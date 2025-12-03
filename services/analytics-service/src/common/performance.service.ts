import { Injectable } from '@nestjs/common';
import { register, collectDefaultMetrics, Histogram, Counter, Gauge } from 'prom-client';

@Injectable()
export class PerformanceService {
  private readonly requestDuration: Histogram<string>;
  private readonly requestsTotal: Counter<string>;
  private readonly activeConnections: Gauge<string>;
  private readonly cacheHitRatio: Gauge<string>;

  constructor() {
    // Enable default metrics collection
    collectDefaultMetrics();

    // Custom metrics
    this.requestDuration = new Histogram({
      name: 'analytics_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2.5, 5, 10],
    });

    this.requestsTotal = new Counter({
      name: 'analytics_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.activeConnections = new Gauge({
      name: 'analytics_active_connections',
      help: 'Number of active connections',
    });

    this.cacheHitRatio = new Gauge({
      name: 'analytics_cache_hit_ratio',
      help: 'Cache hit ratio (0-1)',
    });
  }

  recordRequest(method: string, route: string, statusCode: number, duration: number) {
    this.requestDuration
      .labels(method, route, statusCode.toString())
      .observe(duration);

    this.requestsTotal
      .labels(method, route, statusCode.toString())
      .inc();
  }

  setActiveConnections(count: number) {
    this.activeConnections.set(count);
  }

  setCacheHitRatio(ratio: number) {
    this.cacheHitRatio.set(ratio);
  }

  async getMetrics() {
    return register.metrics();
  }

  async getRegistry() {
    return register;
  }
}