import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as rateLimit from 'express-rate-limit';
import * as helmet from 'helmet';
import * as cors from 'cors';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  private authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth attempts per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  use(req: Request, res: Response, next: NextFunction) {
    // Apply Helmet for security headers
    helmet()(req, res, () => {});

    // Apply CORS
    cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
    })(req, res, () => {});

    // Apply rate limiting based on route
    if (req.path.includes('/auth/login') || req.path.includes('/auth/signup')) {
      this.authRateLimiter(req, res, next);
    } else {
      this.rateLimiter(req, res, next);
    }
  }
}