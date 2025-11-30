import { Injectable } from "@nestjs/common";
import * as winston from "winston";
import * as DailyRotateFile from 'winston-daily-rotate-file';

@Injectable()
export class LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: "auth-service" },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
        new DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          zippedArchive: true,
        }),
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

  log(message: string, meta?: any) {
    this.logger.info(message, meta);
  }

  error(message: string, error?: any, meta?: any) {
    this.logger.error(message, {
      error: error?.message || error,
      stack: error?.stack,
      ...meta,
    });
  }

  warn(message: string, meta?: any) {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any) {
    this.logger.debug(message, meta);
  }

  verbose(message: string, meta?: any) {
    this.logger.verbose(message, meta);
  }

  logRequest(method: string, url: string, statusCode: number, duration: number, userId?: string) {
    this.logger.info('HTTP Request', {
      method,
      url,
      statusCode,
      duration,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  logAuthEvent(event: string, details: any, userId?: string, ip?: string) {
    this.logger.info('Auth Event', {
      event,
      details,
      userId,
      ip,
      timestamp: new Date().toISOString(),
    });
  }

  logSecurityEvent(event: string, details: any, userId?: string, ip?: string) {
    this.logger.warn('Security Event', {
      event,
      details,
      userId,
      ip,
      timestamp: new Date().toISOString(),
    });
  }

  logDatabaseQuery(operation: string, table: string, duration: number, success: boolean) {
    this.logger.info('Database Query', {
      operation,
      table,
      duration,
      success,
      timestamp: new Date().toISOString(),
    });
  }
}
