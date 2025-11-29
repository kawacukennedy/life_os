import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vital } from '../vitals/vital.entity';
import { FitbitService } from './fitbit.service';

@Injectable()
export class HealthService {
  constructor(
    @InjectRepository(Vital)
    private vitalsRepository: Repository<Vital>,
    private fitbitService: FitbitService,
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

  // Wearable data ingestion methods
  async ingestFitbitData(userId: string, accessToken: string) {
    try {
      const data = await this.fitbitService.syncHealthData(accessToken, userId);

      const ingestedData = [];

      // Process activity data (steps, distance, etc.)
      if (data.activity?.summary) {
        const summary = data.activity.summary;
        if (summary.steps) {
          ingestedData.push(await this.addVital(userId, 'steps', summary.steps, 'steps'));
        }
        if (summary.distances?.[0]?.distance) {
          ingestedData.push(await this.addVital(userId, 'distance', summary.distances[0].distance, 'km'));
        }
        if (summary.caloriesOut) {
          ingestedData.push(await this.addVital(userId, 'calories', summary.caloriesOut, 'kcal'));
        }
      }

      // Process heart rate data
      if (data.heartRate?.['activities-heart']?.[0]?.value?.restingHeartRate) {
        const restingHR = data.heartRate['activities-heart'][0].value.restingHeartRate;
        ingestedData.push(await this.addVital(userId, 'heart_rate_resting', restingHR, 'bpm'));
      }

      // Process sleep data
      if (data.sleep?.summary) {
        const sleepSummary = data.sleep.summary;
        if (sleepSummary.totalMinutesAsleep) {
          ingestedData.push(await this.addVital(userId, 'sleep_duration', sleepSummary.totalMinutesAsleep, 'minutes'));
        }
        if (sleepSummary.totalSleepRecords) {
          ingestedData.push(await this.addVital(userId, 'sleep_records', sleepSummary.totalSleepRecords, 'count'));
        }
      }

      // Process weight data
      if (data.weight?.weight?.[0]?.weight) {
        const weight = data.weight.weight[0].weight;
        ingestedData.push(await this.addVital(userId, 'weight', weight, 'kg'));
      }

      return {
        success: true,
        ingestedCount: ingestedData.length,
        syncedAt: data.syncedAt,
      };
    } catch (error) {
      console.error('Error ingesting Fitbit data:', error);
      throw error;
    }
  }

  async ingestAppleHealthData(userId: string, healthData: any) {
    // Placeholder for Apple Health integration
    // This would process HKWorkout, HKQuantitySample, etc.
    const ingestedData = [];

    if (healthData.workouts) {
      for (const workout of healthData.workouts) {
        if (workout.totalEnergyBurned) {
          ingestedData.push(await this.addVital(userId, 'calories', workout.totalEnergyBurned, 'kcal'));
        }
        if (workout.duration) {
          ingestedData.push(await this.addVital(userId, 'workout_duration', workout.duration, 'minutes'));
        }
      }
    }

    if (healthData.vitals) {
      for (const vital of healthData.vitals) {
        ingestedData.push(await this.addVital(userId, vital.type, vital.value, vital.unit));
      }
    }

    return {
      success: true,
      ingestedCount: ingestedData.length,
      syncedAt: new Date(),
    };
  }

  async getWearableAuthUrl(provider: string, userId: string) {
    switch (provider) {
      case 'fitbit':
        return this.fitbitService.getAuthUrl(userId);
      case 'apple':
        // Placeholder for Apple Health auth
        return `https://apple.com/health/auth?user=${userId}`;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  async handleWearableCallback(provider: string, code: string, state: string) {
    switch (provider) {
      case 'fitbit':
        return this.fitbitService.exchangeCodeForToken(code);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
}