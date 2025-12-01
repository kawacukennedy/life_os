import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service';
import { TenantStatus } from './tenant.entity';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract tenant from various sources
      const tenant = await this.resolveTenant(req);

      if (!tenant) {
        throw new UnauthorizedException('Tenant not found');
      }

      // Check tenant status
      if (tenant.status !== TenantStatus.ACTIVE) {
        throw new UnauthorizedException('Tenant is not active');
      }

      // Check subscription expiry
      if (tenant.subscriptionExpiresAt && tenant.subscriptionExpiresAt < new Date()) {
        throw new UnauthorizedException('Tenant subscription has expired');
      }

      // Attach tenant to request
      (req as any).tenant = tenant;

      next();
    } catch (error) {
      next(error);
    }
  }

  private async resolveTenant(req: Request) {
    // Try different strategies to resolve tenant

    // 1. Subdomain (e.g., tenant1.app.example.com)
    const host = req.headers.host;
    if (host) {
      const subdomain = this.extractSubdomain(host);
      if (subdomain) {
        try {
          return await this.tenantService.getTenantByDomain(subdomain);
        } catch (error) {
          // Continue to next strategy
        }
      }
    }

    // 2. Custom header (X-Tenant-ID)
    const tenantId = req.headers['x-tenant-id'] as string;
    if (tenantId) {
      try {
        return await this.tenantService.getTenantById(tenantId);
      } catch (error) {
        // Continue to next strategy
      }
    }

    // 3. JWT token (if user is authenticated)
    const user = (req as any).user;
    if (user && user.tenantId) {
      try {
        return await this.tenantService.getTenantById(user.tenantId);
      } catch (error) {
        // Continue to next strategy
      }
    }

    // 4. Query parameter (for development/testing)
    const tenantParam = req.query.tenant as string;
    if (tenantParam) {
      try {
        return await this.tenantService.getTenantById(tenantParam);
      } catch (error) {
        // Continue to next strategy
      }
    }

    // 5. Default tenant (for single-tenant mode or development)
    if (process.env.DEFAULT_TENANT_ID) {
      try {
        return await this.tenantService.getTenantById(process.env.DEFAULT_TENANT_ID);
      } catch (error) {
        // No tenant found
      }
    }

    return null;
  }

  private extractSubdomain(host: string): string | null {
    // Remove port if present
    const hostname = host.split(':')[0];

    // Handle localhost and IP addresses
    if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return null;
    }

    // Split by dots
    const parts = hostname.split('.');

    // If we have more than 2 parts, the first one is likely a subdomain
    if (parts.length > 2) {
      return parts[0];
    }

    return null;
  }
}