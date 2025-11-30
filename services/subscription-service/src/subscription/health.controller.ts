import { Controller, Get } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { PrismaClient } from '@prisma/client';

@Controller('health')
export class HealthController {
  private prisma = new PrismaClient();

  constructor(private readonly monitoringService: MonitoringService) {}

  @Get()
  async getHealth() {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'subscription-service',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      checks: {
        database: await this.checkDatabase(),
        memory: this.checkMemory(),
        stripe: await this.checkStripe(),
      },
    };

    // Record health check
    const overallStatus = health.checks.database.status === 'ok' &&
                         health.checks.memory.status === 'ok' &&
                         health.checks.stripe.status === 'ok' ? 'up' : 'down';

    this.monitoringService.recordHealthCheck('subscription', overallStatus);

    return health;
  }

  @Get('metrics')
  async getMetrics() {
    return this.monitoringService.getMetrics();
  }

  @Get('readiness')
  async getReadiness() {
    const dbCheck = await this.checkDatabase();
    const stripeCheck = await this.checkStripe();
    if (dbCheck.status !== 'ok' || stripeCheck.status !== 'ok') {
      return { status: 'not ready', database: dbCheck, stripe: stripeCheck };
    }
    return { status: 'ready' };
  }

  @Get('liveness')
  getLiveness() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
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

  private async checkStripe() {
    try {
      // This is a placeholder - implement actual Stripe health check
      return { status: 'ok', responseTime: Date.now() };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
}