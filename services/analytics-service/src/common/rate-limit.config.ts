import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const rateLimitConfig: ThrottlerModuleOptions = [
  {
    name: 'short',
    ttl: 1000, // 1 second
    limit: 10, // 10 requests per second
  },
  {
    name: 'medium',
    ttl: 60000, // 1 minute
    limit: 100, // 100 requests per minute
  },
  {
    name: 'long',
    ttl: 3600000, // 1 hour
    limit: 1000, // 1000 requests per hour
  },
];

export const getRateLimitConfig = (): ThrottlerModuleOptions => {
  const config = [...rateLimitConfig];

  // Add stricter limits for analytics endpoints
  config.push({
    name: 'analytics-strict',
    ttl: 60000, // 1 minute
    limit: 50, // 50 requests per minute for analytics endpoints
  });

  return config;
};