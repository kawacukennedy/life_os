import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { BigQueryService } from '../analytics/bigquery.service';

@Injectable()
export class HealthCheckService {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,
    private readonly bigQueryService: BigQueryService,
  ) {}

  async getHealthStatus() {
    const checks = {
      database: await this.checkDatabase(),
      bigquery: await this.checkBigQuery(),
      timestamp: new Date().toISOString(),
    };

    const isHealthy = Object.values(checks).every(check =>
      check.status === 'ok' || check.status === 'healthy'
    );

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'analytics-service',
      version: '1.0.0',
      checks,
    };
  }

  private async checkDatabase() {
    try {
      await this.connection.query('SELECT 1');
      return { status: 'ok', message: 'Database connection successful' };
    } catch (error) {
      return { status: 'error', message: `Database connection failed: ${error.message}` };
    }
  }

  private async checkBigQuery() {
    try {
      // Simple query to check BigQuery connectivity
      await this.bigQueryService.queryUserActivity('test-user', '2024-01-01', '2024-01-02');
      return { status: 'ok', message: 'BigQuery connection successful' };
    } catch (error) {
      return { status: 'error', message: `BigQuery connection failed: ${error.message}` };
    }
  }
}