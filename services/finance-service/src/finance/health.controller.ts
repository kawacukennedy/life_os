import { Controller, Get } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(
    private readonly monitoringService: MonitoringService,
    private dataSource: DataSource,
  ) {}

  @Get()
  async getHealth() {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'finance-service',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      checks: {
        database: await this.checkDatabase(),
        memory: this.checkMemory(),
        plaid: await this.checkPlaid(),
        redis: await this.checkRedis(),
      },
    };

    // Record health check
    const overallStatus = health.checks.database.status === 'ok' &&
                         health.checks.memory.status === 'ok' &&
                         health.checks.plaid.status === 'ok' &&
                         health.checks.redis.status === 'ok' ? 'up' : 'down';

    this.monitoringService.recordHealthCheck('finance', overallStatus);

    return health;
  }

  @Get('metrics')
  async getMetrics() {
    return this.monitoringService.getMetrics();
  }

  @Get('readiness')
  async getReadiness() {
    const dbCheck = await this.checkDatabase();
    const plaidCheck = await this.checkPlaid();
    const redisCheck = await this.checkRedis();

    if (dbCheck.status !== 'ok' || plaidCheck.status !== 'ok' || redisCheck.status !== 'ok') {
      return { status: 'not ready', database: dbCheck, plaid: plaidCheck, redis: redisCheck };
    }
    return { status: 'ready' };
  }

  @Get('liveness')
  getLiveness() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }

  private async checkDatabase() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', responseTime: Date.now() };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  private checkMemory() {
    const memUsage = process.memoryUsage();
    const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

    const usagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    const status = usagePercent > 90 ? 'warning' : 'ok';

    return {
      status,
      used: `${usedMB}MB`,
      total: `${totalMB}MB`,
      percentage: `${usagePercent.toFixed(1)}%`,
    };
  }

  private async checkPlaid() {
    try {
      // This is a placeholder - implement actual Plaid health check
      return { status: 'ok', responseTime: Date.now() };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  private async checkRedis() {
    try {
      // This is a placeholder - implement actual Redis health check
      return { status: 'ok', responseTime: Date.now() };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
}