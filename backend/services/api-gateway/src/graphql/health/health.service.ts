import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HealthService {
  constructor(private httpService: HttpService) {}

  async getHealthSummary(userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.HEALTH_SERVICE_URL || 'http://localhost:3005'}/health/summary?userId=${userId}`),
      );
      return response.data;
    } catch (error) {
      return {
        userId,
        averageHeartRate: null,
        averageSteps: null,
        averageSleepHours: null,
        lastUpdated: new Date(),
      };
    }
  }

  async getVitals(userId: string, metricType?: string, limit?: number) {
    try {
      const params = new URLSearchParams({ userId });
      if (metricType) params.append('metricType', metricType);
      if (limit) params.append('limit', limit.toString());

      const response = await firstValueFrom(
        this.httpService.get(`${process.env.HEALTH_SERVICE_URL || 'http://localhost:3005'}/health/vitals?${params}`),
      );
      return response.data;
    } catch (error) {
      return [];
    }
  }

  async addVital(userId: string, metricType: string, value: number, unit: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${process.env.HEALTH_SERVICE_URL || 'http://localhost:3005'}/health/vitals`, {
          userId,
          metricType,
          value,
          unit,
        }),
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to add vital');
    }
  }
}