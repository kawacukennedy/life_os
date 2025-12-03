import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vital } from '../vitals/vital.entity';

@Injectable()
export class HealthService {
  constructor(
    @InjectRepository(Vital)
    private vitalsRepository: Repository<Vital>,
  ) {}

  async getVitals(userId: string, metricType?: string, limit = 30) {
    const query = this.vitalsRepository
      .createQueryBuilder('vital')
      .where('vital.userId = :userId', { userId })
      .orderBy('vital.recordedAt', 'DESC')
      .take(limit);

    if (metricType) {
      query.andWhere('vital.metricType = :metricType', { metricType });
    }

    return query.getMany();
  }

  async addVital(userId: string, metricType: string, value: number, unit: string) {
    const vital = this.vitalsRepository.create({
      userId,
      metricType,
      value,
      unit,
      recordedAt: new Date(),
    });

    return this.vitalsRepository.save(vital);
  }

  async getHealthSummary(userId: string) {
    const vitals = await this.getVitals(userId, undefined, 1000);

    // Calculate metrics for the last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentVitals = vitals.filter(v => v.recordedAt >= last24Hours);

    const summary = {
      userId,
      date: new Date().toISOString().split('T')[0],
      steps: this.calculateSum(recentVitals.filter(v => v.metricType === 'steps')),
      heartRate: this.calculateAverage(recentVitals.filter(v => v.metricType === 'heart_rate')),
      sleepHours: this.calculateSum(recentVitals.filter(v => v.metricType === 'sleep_hours')),
      calories: this.calculateSum(recentVitals.filter(v => v.metricType === 'calories')),
      activeMinutes: this.calculateSum(recentVitals.filter(v => v.metricType === 'active_minutes')),
      vitals: recentVitals.slice(0, 10).map(v => ({
        id: v.id,
        metricType: v.metricType,
        value: v.value,
        unit: v.unit,
        timestamp: v.recordedAt.toISOString(),
      })),
      anomalies: [], // Will be populated by anomaly detector
    };

    return summary;
  }

  async getHealthInsights(userId: string) {
    const vitals = await this.getVitals(userId, undefined, 100);
    const insights = [];

    // Generate basic insights based on data
    const avgHeartRate = this.calculateAverage(vitals.filter(v => v.metricType === 'heart_rate'));
    const totalSteps = this.calculateSum(vitals.filter(v => v.metricType === 'steps'));
    const avgSleep = this.calculateAverage(vitals.filter(v => v.metricType === 'sleep_hours'));

    if (avgHeartRate > 80) {
      insights.push({
        id: 'high-heart-rate',
        type: 'warning',
        title: 'Elevated Heart Rate',
        description: `Your average heart rate of ${avgHeartRate.toFixed(0)} bpm is higher than normal. Consider consulting a healthcare professional.`,
        actionable: true,
        createdAt: new Date(),
      });
    }

    if (totalSteps < 7000) {
      insights.push({
        id: 'low-activity',
        type: 'suggestion',
        title: 'Increase Daily Activity',
        description: `You've taken ${totalSteps} steps today. Aim for 10,000 steps for better health.`,
        actionable: true,
        createdAt: new Date(),
      });
    }

    if (avgSleep < 7) {
      insights.push({
        id: 'insufficient-sleep',
        type: 'suggestion',
        title: 'Improve Sleep Quality',
        description: `You're averaging ${avgSleep.toFixed(1)} hours of sleep. Aim for 7-9 hours for optimal health.`,
        actionable: true,
        createdAt: new Date(),
      });
    }

    return { insights };
  }

  private calculateAverage(vitals: any[]) {
    if (vitals.length === 0) return 0;
    const sum = vitals.reduce((acc, vital) => acc + vital.value, 0);
    return sum / vitals.length;
  }

  private calculateSum(vitals: any[]) {
    return vitals.reduce((acc, vital) => acc + vital.value, 0);
  }
}

  private calculateSum(vitals: Vital[]): number | null {
    if (vitals.length === 0) return null;
    return vitals.reduce((acc, vital) => acc + Number(vital.value), 0);
  }
}