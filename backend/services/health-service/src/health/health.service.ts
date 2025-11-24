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
    const vitals = await this.getVitals(userId, undefined, 100);

    const summary = {
      heartRate: this.calculateAverage(vitals.filter(v => v.metricType === 'heart_rate')),
      steps: this.calculateSum(vitals.filter(v => v.metricType === 'steps')),
      sleep: this.calculateAverage(vitals.filter(v => v.metricType === 'sleep')),
      lastUpdated: vitals.length > 0 ? vitals[0].recordedAt : null,
    };

    return summary;
  }

  private calculateAverage(vitals: Vital[]): number | null {
    if (vitals.length === 0) return null;
    const sum = vitals.reduce((acc, vital) => acc + Number(vital.value), 0);
    return sum / vitals.length;
  }

  private calculateSum(vitals: Vital[]): number | null {
    if (vitals.length === 0) return null;
    return vitals.reduce((acc, vital) => acc + Number(vital.value), 0);
  }
}