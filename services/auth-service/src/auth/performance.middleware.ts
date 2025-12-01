import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PerformanceService } from './performance.service';

@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PerformanceMiddleware.name);

  constructor(private readonly performanceService: PerformanceService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const originalSend = res.send;

    // Override res.send to capture response time
    res.send = function(data) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Record performance metrics
      this.performanceService.recordRequest({
        service: 'auth-service',
        endpoint: req.path,
        method: req.method,
        responseTime,
        statusCode: res.statusCode,
        userId: (req as any).user?.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        memoryUsage: process.memoryUsage().heapUsed,
      }).catch(error => {
        this.logger.error('Failed to record performance metrics:', error);
      });

      // Call original send method
      return originalSend.call(this, data);
    }.bind(this);

    next();
  }
}