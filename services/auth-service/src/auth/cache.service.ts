import { Injectable, Inject, Logger } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import Redis from "ioredis";

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private redisClient: Redis;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    // Initialize Redis client for advanced operations
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB) || 0,
    });

    this.redisClient.on('error', (err) => {
      this.logger.error('Redis connection error:', err);
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Connected to Redis');
    });
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  // User-specific cache keys
  getUserKey(userId: string, suffix: string): string {
    return `user:${userId}:${suffix}`;
  }

  // Cache user profile
  async getUserProfile(userId: string) {
    const key = this.getUserKey(userId, "profile");
    return this.get(key);
  }

  async setUserProfile(
    userId: string,
    profile: any,
    ttl = 300000,
  ): Promise<void> {
    const key = this.getUserKey(userId, "profile");
    await this.set(key, profile, ttl);
  }

  // Cache dashboard data
  async getDashboardData(userId: string) {
    const key = this.getUserKey(userId, "dashboard");
    return this.get(key);
  }

  async setDashboardData(
    userId: string,
    data: any,
    ttl = 60000,
  ): Promise<void> {
    const key = this.getUserKey(userId, "dashboard");
    await this.set(key, data, ttl);
  }

  // Cache API responses
  async getApiResponse(endpoint: string, params?: any) {
    const key = `api:${endpoint}:${JSON.stringify(params || {})}`;
    return this.get(key);
  }

  async setApiResponse(
    endpoint: string,
    params: any,
    data: any,
    ttl = 300000,
  ): Promise<void> {
    const key = `api:${endpoint}:${JSON.stringify(params || {})}`;
    await this.set(key, data, ttl);
  }

  // Cache third-party API responses
  async getThirdPartyData(provider: string, userId: string, endpoint: string) {
    const key = `thirdparty:${provider}:${userId}:${endpoint}`;
    return this.get(key);
  }

  async setThirdPartyData(
    provider: string,
    userId: string,
    endpoint: string,
    data: any,
    ttl = 1800000,
  ): Promise<void> {
    const key = `thirdparty:${provider}:${userId}:${endpoint}`;
    await this.set(key, data, ttl);
  }

  // Invalidate user cache
  async invalidateUserCache(userId: string): Promise<void> {
    const pattern = `user:${userId}:*`;
    const keys = await this.redisClient.keys(pattern);

    if (keys.length > 0) {
      await this.redisClient.del(...keys);
      this.logger.log(`Invalidated ${keys.length} cache keys for user ${userId}`);
    }
  }

  // Advanced caching with Redis
  async setWithTags(key: string, value: any, tags: string[], ttl?: number): Promise<void> {
    // Store the value
    await this.set(key, value, ttl);

    // Store tag relationships for batch invalidation
    for (const tag of tags) {
      await this.redisClient.sadd(`tag:${tag}`, key);
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    const keys = await this.redisClient.smembers(`tag:${tag}`);
    if (keys.length > 0) {
      await this.redisClient.del(...keys);
      await this.redisClient.del(`tag:${tag}`);
      this.logger.log(`Invalidated ${keys.length} cache keys for tag ${tag}`);
    }
  }

  // Cache warming
  async warmCache<T>(keys: string[], fetcher: (key: string) => Promise<T>, ttl?: number): Promise<void> {
    const pipeline = this.redisClient.pipeline();

    for (const key of keys) {
      try {
        const data = await fetcher(key);
        pipeline.set(key, JSON.stringify(data), 'EX', ttl || 300);
      } catch (error) {
        this.logger.error(`Failed to warm cache for key ${key}:`, error);
      }
    }

    await pipeline.exec();
    this.logger.log(`Warmed cache for ${keys.length} keys`);
  }

  // Cache analytics
  async getCacheStats(): Promise<{
    totalKeys: number;
    memoryUsage: number;
    hitRate: number;
    connectedClients: number;
  }> {
    const info = await this.redisClient.info();
    const stats = {
      totalKeys: parseInt(await this.redisClient.dbsize()),
      memoryUsage: parseInt(info.match(/used_memory:(\d+)/)?.[1] || '0'),
      hitRate: parseFloat(info.match(/keyspace_hits:(\d+)/)?.[1] || '0') /
               (parseFloat(info.match(/keyspace_hits:(\d+)/)?.[1] || '0') +
                parseFloat(info.match(/keyspace_misses:(\d+)/)?.[1] || '0')) || 0,
      connectedClients: parseInt(info.match(/connected_clients:(\d+)/)?.[1] || '0'),
    };

    return stats;
  }

  // Distributed locking
  async acquireLock(key: string, ttl: number = 30000): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const result = await this.redisClient.set(lockKey, 'locked', 'NX', 'PX', ttl);
    return result === 'OK';
  }

  async releaseLock(key: string): Promise<void> {
    const lockKey = `lock:${key}`;
    await this.redisClient.del(lockKey);
  }

  // Rate limiting with Redis
  async checkRateLimit(identifier: string, limit: number, windowMs: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;

    // Use Redis sorted set to track requests
    const member = `${now}:${Math.random()}`;

    await this.redisClient.zadd(key, now, member);
    await this.redisClient.zremrangebyscore(key, 0, windowStart);
    await this.redisClient.expire(key, Math.ceil(windowMs / 1000));

    const requestCount = await this.redisClient.zcard(key);
    const remaining = Math.max(0, limit - requestCount);
    const allowed = requestCount <= limit;

    // Calculate reset time
    const oldestRequest = await this.redisClient.zrange(key, 0, 0, 'WITHSCORES');
    const resetTime = oldestRequest.length > 0 ?
      parseInt(oldestRequest[1]) + windowMs : now + windowMs;

    return { allowed, remaining, resetTime };
  }

  // Cache compression for large objects
  async setCompressed(key: string, value: any, ttl?: number): Promise<void> {
    const compressed = JSON.stringify(value);
    // In production, you might want to use actual compression like gzip
    await this.set(`${key}:compressed`, compressed, ttl);
  }

  async getCompressed<T>(key: string): Promise<T | undefined> {
    const compressed = await this.get<string>(`${key}:compressed`);
    return compressed ? JSON.parse(compressed) : undefined;
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    await this.redisClient.quit();
  }
}
