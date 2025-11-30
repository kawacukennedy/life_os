import { Injectable } from '@nestjs/common';
import { register, collectDefaultMetrics, Gauge, Counter, Histogram } from 'prom-client';

@Injectable()
export class MonitoringService {
  private readonly httpRequestDuration: Histogram<string>;
  private readonly httpRequestsTotal: Counter<string>;
  private readonly activeConnections: Gauge<string>;
  private readonly dbQueryDuration: Histogram<string>;
  private readonly plaidApiDuration: Histogram<string>;
  private readonly plaidRequestsTotal: Counter<string>;
  private readonly transactionProcessingDuration: Histogram<string>;
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

    this.plaidApiDuration = new Histogram({
      name: 'plaid_api_duration_seconds',
      help: 'Duration of Plaid API calls in seconds',
      labelNames: ['endpoint', 'method'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
    });

    this.plaidRequestsTotal = new Counter({
      name: 'plaid_requests_total',
      help: 'Total number of Plaid API requests',
      labelNames: ['endpoint', 'method', 'success'],
    });

    this.transactionProcessingDuration = new Histogram({
      name: 'transaction_processing_duration_seconds',
      help: 'Duration of transaction processing operations in seconds',
      labelNames: ['operation'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
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

  // Database metrics
  recordDbQuery(operation: string, table: string, duration: number) {
    this.dbQueryDuration
      .labels(operation, table)
      .observe(duration);
  }

  // Plaid API metrics
  recordPlaidApiCall(endpoint: string, method: string, duration: number, success: boolean) {
    this.plaidApiDuration
      .labels(endpoint, method)
      .observe(duration);

    this.plaidRequestsTotal
      .labels(endpoint, method, success.toString())
      .inc();
  }

  // Transaction processing metrics
  recordTransactionProcessing(operation: string, duration: number) {
    this.transactionProcessingDuration
      .labels(operation)
      .observe(duration);
  }

  // Error metrics
  recordError(type: string, endpoint: string) {
    this.errorCounter.labels(type, endpoint).inc();
  }

  // Health check metrics
  recordHealthCheck(service: string, status: 'up' | 'down') {
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