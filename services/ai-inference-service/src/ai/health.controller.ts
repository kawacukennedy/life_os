import { Controller, Get } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';

@Controller('health')
export class HealthController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get()
  async getHealth() {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ai-inference-service',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      checks: {
        memory: this.checkMemory(),
        openai: await this.checkOpenAI(),
        milvus: await this.checkMilvus(),
        redis: await this.checkRedis(),
      },
    };

    // Record health check
    const overallStatus = health.checks.memory.status === 'ok' &&
                         health.checks.openai.status === 'ok' &&
                         health.checks.milvus.status === 'ok' &&
                         health.checks.redis.status === 'ok' ? 'up' : 'down';

    this.monitoringService.recordHealthCheck('ai-inference', overallStatus);

    return health;
  }

  @Get('metrics')
  async getMetrics() {
    return this.monitoringService.getMetrics();
  }

  @Get('readiness')
  async getReadiness() {
    const openaiCheck = await this.checkOpenAI();
    const milvusCheck = await this.checkMilvus();
    const redisCheck = await this.checkRedis();

    if (openaiCheck.status !== 'ok' || milvusCheck.status !== 'ok' || redisCheck.status !== 'ok') {
      return { status: 'not ready', openai: openaiCheck, milvus: milvusCheck, redis: redisCheck };
    }
    return { status: 'ready' };
  }

  @Get('liveness')
  getLiveness() {
    return { status: 'alive', timestamp: new Date().toISOString() };
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

  private async checkOpenAI() {
    try {
      // This is a placeholder - implement actual OpenAI health check
      return { status: 'ok', responseTime: Date.now() };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  private async checkMilvus() {
    try {
      // This is a placeholder - implement actual Milvus health check
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