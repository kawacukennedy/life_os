import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PerformanceService } from './performance.service';

@Injectable()
export class ErrorHandlingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ErrorHandlingMiddleware.name);

  constructor(private readonly performanceService?: PerformanceService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const originalSend = res.send;
    const originalJson = res.json;

    // Override res.send to capture response data for logging
    res.send = function(data) {
      this._responseData = data;
      return originalSend.call(this, data);
    };

    // Override res.json for JSON responses
    res.json = function(data) {
      this._responseData = JSON.stringify(data);
      return originalJson.call(this, data);
    };

    // Log request
    this.logger.log(`[${req.method}] ${req.url} - ${req.ip}`);

    // Handle response
    res.on('finish', () => {
      const statusCode = res.statusCode;
      const responseTime = (Date.now() - (req as any).startTime) / 1000; // Convert to seconds

      // Record performance metrics
      if (this.performanceService) {
        this.performanceService.recordRequest(req.method, req.route?.path || req.url, statusCode, responseTime);
      }

      if (statusCode >= 400) {
        this.logger.error(
          `[${req.method}] ${req.url} - ${statusCode} - ${responseTime.toFixed(3)}s - ${req.ip}`,
          res._responseData || 'No response data'
        );
      } else {
        this.logger.log(
          `[${req.method}] ${req.url} - ${statusCode} - ${responseTime.toFixed(3)}s`
        );
      }
    });

    // Set start time
    (req as any).startTime = Date.now();

    next();
  }
}