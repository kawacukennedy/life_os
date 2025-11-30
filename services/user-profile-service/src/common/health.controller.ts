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
      service: 'user-profile-service',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      checks: {
        database: await this.checkDatabase(),
        memory: this.checkMemory(),
        disk: this.checkDisk(),
      },
    };

    // Record health check
    const overallStatus = health.checks.database.status === 'ok' &&
                         health.checks.memory.status === 'ok' &&
                         health.checks.disk.status === 'ok' ? 'up' : 'down';

    this.monitoringService.recordHealthCheck('user-profile', overallStatus);

    return health;
  }

  @Get('metrics')
  async getMetrics() {
    return this.monitoringService.getMetrics();
  }

  @Get('readiness')
  async getReadiness() {
    const dbCheck = await this.checkDatabase();
    if (dbCheck.status !== 'ok') {
      return { status: 'not ready', database: dbCheck };
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

    // Consider unhealthy if using more than 90% of heap
    const usagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    const status = usagePercent > 90 ? 'warning' : 'ok';

    return {
      status,
      used: `${usedMB}MB`,
      total: `${totalMB}MB`,
      percentage: `${usagePercent.toFixed(1)}%`,
    };
  }

  private checkDisk() {
    // Simple disk check - in production, use system calls
    try {
      // This is a placeholder - implement actual disk space checking
      return { status: 'ok', freeSpace: 'N/A' };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
}