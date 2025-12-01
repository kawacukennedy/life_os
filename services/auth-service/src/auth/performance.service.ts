import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheService } from './cache.service';

export interface PerformanceMetrics {
  timestamp: Date;
  service: string;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  memoryUsage?: number;
  cpuUsage?: number;
}

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetricsInMemory = 10000;

  constructor(
    private readonly cacheService: CacheService,
  ) {}

  async recordRequest(metrics: Omit<PerformanceMetrics, 'timestamp'>): Promise<void> {
    const fullMetrics: PerformanceMetrics = {
      ...metrics,
      timestamp: new Date(),
    };

    // Store in memory for quick access
    this.metrics.push(fullMetrics);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsInMemory) {
      this.metrics = this.metrics.slice(-this.maxMetricsInMemory);
    }

    // Cache for 1 hour
    await this.cacheService.set(
      `perf:${metrics.service}:${metrics.endpoint}:${Date.now()}`,
      fullMetrics,
      3600000
    );

    // Log slow requests
    if (metrics.responseTime > 1000) {
      this.logger.warn(`Slow request: ${metrics.method} ${metrics.endpoint} took ${metrics.responseTime}ms`);
    }
  }

  async getPerformanceStats(timeRange: number = 3600000): Promise<{
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    totalRequests: number;
    errorRate: number;
    topEndpoints: Array<{ endpoint: string; avgTime: number; count: number }>;
    cacheStats: any;
  }> {
    const cutoff = Date.now() - timeRange;
    const recentMetrics = this.metrics.filter(m => m.timestamp.getTime() > cutoff);

    if (recentMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        totalRequests: 0,
        errorRate: 0,
        topEndpoints: [],
        cacheStats: await this.cacheService.getCacheStats(),
      };
    }

    const responseTimes = recentMetrics.map(m => m.responseTime).sort((a, b) => a - b);
    const totalRequests = recentMetrics.length;
    const errors = recentMetrics.filter(m => m.statusCode >= 400).length;

    // Calculate percentiles
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);

    // Group by endpoint
    const endpointStats = new Map<string, { totalTime: number; count: number }>();
    recentMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      const existing = endpointStats.get(key) || { totalTime: 0, count: 0 };
      endpointStats.set(key, {
        totalTime: existing.totalTime + metric.responseTime,
        count: existing.count + 1,
      });
    });

    const topEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgTime: stats.totalTime / stats.count,
        count: stats.count,
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10);

    return {
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      p95ResponseTime: responseTimes[p95Index] || 0,
      p99ResponseTime: responseTimes[p99Index] || 0,
      totalRequests,
      errorRate: errors / totalRequests,
      topEndpoints,
      cacheStats: await this.cacheService.getCacheStats(),
    };
  }

  async getHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    cacheHealth: boolean;
    memoryUsage: number;
    uptime: number;
  }> {
    const startTime = Date.now();

    try {
      // Test cache health
      const cacheHealth = await this.testCacheHealth();

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Get memory usage
      const memUsage = process.memoryUsage();

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (responseTime > 5000 || !cacheHealth) {
        status = 'unhealthy';
      } else if (responseTime > 1000) {
        status = 'degraded';
      }

      return {
        status,
        responseTime,
        cacheHealth,
        memoryUsage: memUsage.heapUsed,
        uptime: process.uptime(),
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        cacheHealth: false,
        memoryUsage: 0,
        uptime: process.uptime(),
      };
    }
  }

  private async testCacheHealth(): Promise<boolean> {
    try {
      const testKey = 'health-check-test';
      const testValue = { test: true, timestamp: Date.now() };

      await this.cacheService.set(testKey, testValue, 10000);
      const retrieved = await this.cacheService.get(testKey);
      await this.cacheService.del(testKey);

      return retrieved && retrieved.test === true;
    } catch (error) {
      this.logger.error('Cache health check failed:', error);
      return false;
    }
  }

  async getSlowQueries(threshold: number = 1000, limit: number = 50): Promise<PerformanceMetrics[]> {
    return this.metrics
      .filter(m => m.responseTime > threshold)
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, limit);
  }

  async clearOldMetrics(olderThan: number = 86400000): Promise<void> {
    const cutoff = Date.now() - olderThan;
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > cutoff);
    this.logger.log(`Cleared metrics older than ${olderThan / 1000} seconds`);
  }
}