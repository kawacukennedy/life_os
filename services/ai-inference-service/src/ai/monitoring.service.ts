import { Injectable } from '@nestjs/common';
import { register, collectDefaultMetrics, Gauge, Counter, Histogram } from 'prom-client';

@Injectable()
export class MonitoringService {
  private readonly httpRequestDuration: Histogram<string>;
  private readonly httpRequestsTotal: Counter<string>;
  private readonly activeConnections: Gauge<string>;
  private readonly aiInferenceDuration: Histogram<string>;
  private readonly aiRequestsTotal: Counter<string>;
  private readonly vectorSearchDuration: Histogram<string>;
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

    this.aiInferenceDuration = new Histogram({
      name: 'ai_inference_duration_seconds',
      help: 'Duration of AI inference operations in seconds',
      labelNames: ['operation', 'model'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
    });

    this.aiRequestsTotal = new Counter({
      name: 'ai_requests_total',
      help: 'Total number of AI requests',
      labelNames: ['operation', 'model', 'success'],
    });

    this.vectorSearchDuration = new Histogram({
      name: 'vector_search_duration_seconds',
      help: 'Duration of vector search operations in seconds',
      labelNames: ['operation'],
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

  // AI inference metrics
  recordAiInference(operation: string, model: string, duration: number, success: boolean) {
    this.aiInferenceDuration
      .labels(operation, model)
      .observe(duration);

    this.aiRequestsTotal
      .labels(operation, model, success.toString())
      .inc();
  }

  // Vector search metrics
  recordVectorSearch(operation: string, duration: number) {
    this.vectorSearchDuration
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