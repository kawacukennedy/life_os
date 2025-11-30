import { Injectable } from '@nestjs/common';
import { register, collectDefaultMetrics, Gauge, Counter, Histogram } from 'prom-client';

@Injectable()
export class MonitoringService {
  private readonly httpRequestDuration: Histogram<string>;
  private readonly httpRequestsTotal: Counter<string>;
  private readonly activeConnections: Gauge<string>;
  private readonly dbQueryDuration: Histogram<string>;
  private readonly errorCounter: Counter<string>;

  constructor() {
    // Enable default metrics collection
    collectDefaultMetrics();

    // Custom metrics
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });

    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
    });

    this.dbQueryDuration = new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
    });

    this.errorCounter = new Counter({
      name: 'application_errors_total',
      help: 'Total number of application errors',
      labelNames: ['type', 'endpoint'],
    });
  }

  // HTTP metrics
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(duration);

    this.httpRequestsTotal
      .labels(method, route, statusCode.toString())
      .inc();
  }

  // Database metrics
  recordDbQuery(operation: string, table: string, duration: number) {
    this.dbQueryDuration
      .labels(operation, table)
      .observe(duration);
  }

  // Connection metrics
  setActiveConnections(count: number) {
    this.activeConnections.set(count);
  }

  incrementActiveConnections() {
    this.activeConnections.inc();
  }

  decrementActiveConnections() {
    this.activeConnections.dec();
  }

  // Error metrics
  recordError(type: string, endpoint: string) {
    this.errorCounter.labels(type, endpoint).inc();
  }

  // Health check metrics
  recordHealthCheck(service: string, status: 'up' | 'down') {
    // Create gauge for health status
    const healthGauge = new Gauge({
      name: `health_status_${service}`,
      help: `Health status of ${service} service`,
    });

    healthGauge.set(status === 'up' ? 1 : 0);
  }

  // Get metrics for Prometheus scraping
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  // Register custom metrics
  getRegistry() {
    return register;
  }
}