import { Injectable, Logger } from '@nestjs/common';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

@Injectable()
export class LoggingService extends Logger {
  private winstonLogger: winston.Logger;

  constructor() {
    super('LifeOS Finance');

    // Configure Winston logger
    this.winstonLogger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'finance-service' },
      transports: [
        // Console transport for development
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),

        // File transport with rotation
        new DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          zippedArchive: true,
        }),

        // Error log file
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '30d',
          zippedArchive: true,
        }),
      ],
    });
  }

  logRequest(method: string, url: string, statusCode: number, duration: number, userId?: string) {
    this.winstonLogger.info('HTTP Request', {
      method,
      url,
      statusCode,
      duration,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  logPlaidApiCall(endpoint: string, method: string, duration: number, success: boolean, userId?: string) {
    this.winstonLogger.info('Plaid API Call', {
      endpoint,
      method,
      duration,
      success,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  logTransactionOperation(operation: string, transactionId: string, duration: number, success: boolean, userId?: string) {
    this.winstonLogger.info('Transaction Operation', {
      operation,
      transactionId,
      duration,
      success,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  logDatabaseQuery(operation: string, table: string, duration: number, success: boolean) {
    this.winstonLogger.info('Database Query', {
      operation,
      table,
      duration,
      success,
      timestamp: new Date().toISOString(),
    });
  }

  logError(error: Error, context?: string, userId?: string) {
    this.winstonLogger.error('Application Error', {
      message: error.message,
      stack: error.stack,
      context,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  logSecurityEvent(event: string, details: any, userId?: string, ip?: string) {
    this.winstonLogger.warn('Security Event', {
      event,
      details,
      userId,
      ip,
      timestamp: new Date().toISOString(),
    });
  }

  // Override NestJS Logger methods to use Winston
  error(message: any, stack?: string, context?: string) {
    this.winstonLogger.error(message, { stack, context });
  }

  warn(message: any, context?: string) {
    this.winstonLogger.warn(message, { context });
  }

  debug(message: any, context?: string) {
    this.winstonLogger.debug(message, { context });
  }

  verbose(message: any, context?: string) {
    this.winstonLogger.verbose(message, { context });
  }
}