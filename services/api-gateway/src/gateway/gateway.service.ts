import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GatewayService {
  constructor(private httpService: HttpService) {}

  async proxyToService(serviceUrl: string, method: string, data?: any, headers?: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method: method as any,
          url: serviceUrl,
          data,
          headers,
        })
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  getServiceUrl(service: string): string {
    const services = {
      auth: 'http://localhost:3001',
      health: 'http://localhost:3002',
      finance: 'http://localhost:3003',
      learning: 'http://localhost:3004',
      notification: 'http://localhost:3005',
      task: 'http://localhost:3006',
      user: 'http://localhost:3007',
      task: 'http://localhost:3006',
      ai: 'http://localhost:3008',
    };
    return services[service as keyof typeof services] || '';
  }
}