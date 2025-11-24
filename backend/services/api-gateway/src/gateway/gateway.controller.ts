import { Controller, All, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { GatewayService } from './gateway.service';

@Controller()
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @All('*')
  async proxy(@Req() req: Request, @Res() res: Response) {
    const path = req.path;
    const method = req.method;

    let service = 'auth'; // default

    if (path.startsWith('/health')) {
      service = 'health';
    } else if (path.startsWith('/finance')) {
      service = 'finance';
    } else if (path.startsWith('/learning')) {
      service = 'learning';
    } else if (path.startsWith('/notifications')) {
      service = 'notification';
    }

    const serviceUrl = `${this.gatewayService.getServiceUrl(service)}${path}`;

    try {
      const result = await this.gatewayService.proxyToService(
        serviceUrl,
        method,
        req.body,
        req.headers
      );
      res.json(result);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { message: 'Gateway error' });
    }
  }
}