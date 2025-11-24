import { Injectable, Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

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
    // Note: This is a simplified version. In production, you might want to use Redis SCAN or KEYS
    // For now, we'll just clear some common keys
    const keys = [
      this.getUserKey(userId, "profile"),
      this.getUserKey(userId, "dashboard"),
    ];

    await Promise.all(keys.map((key) => this.del(key)));
  }
}
