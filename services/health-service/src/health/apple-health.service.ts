import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vital } from '../vitals/vital.entity';

export interface AppleHealthData {
  userId: string;
  dataType: string;
  value: number;
  unit: string;
  startDate: Date;
  endDate: Date;
  source: string;
  metadata?: any;
}

@Injectable()
export class AppleHealthService {
  constructor(
    @InjectRepository(Vital)
    private vitalRepository: Repository<Vital>,
  ) {}

  async processHealthData(healthData: AppleHealthData[]): Promise<void> {
    for (const data of healthData) {
      // Map Apple Health data types to our Vital types
      const vitalType = this.mapAppleHealthType(data.dataType);

      if (vitalType) {
        const vital = this.vitalRepository.create({
          userId: data.userId,
          type: vitalType,
          value: data.value,
          unit: data.unit,
          timestamp: data.startDate,
          source: 'apple_health',
          metadata: {
            ...data.metadata,
            endDate: data.endDate,
            originalDataType: data.dataType,
          },
        });

        await this.vitalRepository.save(vital);
      }
    }
  }

  private mapAppleHealthType(appleType: string): string | null {
    const typeMapping = {
      'HKQuantityTypeIdentifierHeartRate': 'heart_rate',
      'HKQuantityTypeIdentifierBodyMass': 'weight',
      'HKQuantityTypeIdentifierHeight': 'height',
      'HKQuantityTypeIdentifierBodyMassIndex': 'bmi',
      'HKQuantityTypeIdentifierBodyFatPercentage': 'body_fat',
      'HKQuantityTypeIdentifierLeanBodyMass': 'lean_mass',
      'HKQuantityTypeIdentifierStepCount': 'steps',
      'HKQuantityTypeIdentifierDistanceWalkingRunning': 'distance',
      'HKQuantityTypeIdentifierActiveEnergyBurned': 'calories',
      'HKQuantityTypeIdentifierBasalEnergyBurned': 'basal_calories',
      'HKQuantityTypeIdentifierFlightsClimbed': 'flights_climbed',
      'HKCategoryTypeIdentifierSleepAnalysis': 'sleep',
      'HKQuantityTypeIdentifierOxygenSaturation': 'oxygen_saturation',
      'HKQuantityTypeIdentifierBloodPressureSystolic': 'blood_pressure_systolic',
      'HKQuantityTypeIdentifierBloodPressureDiastolic': 'blood_pressure_diastolic',
      'HKQuantityTypeIdentifierRespiratoryRate': 'respiratory_rate',
    };

    return typeMapping[appleType] || null;
  }

  async getHealthData(userId: string, type?: string, startDate?: Date, endDate?: Date): Promise<Vital[]> {
    const query = this.vitalRepository
      .createQueryBuilder('vital')
      .where('vital.userId = :userId', { userId })
      .andWhere('vital.source = :source', { source: 'apple_health' });

    if (type) {
      query.andWhere('vital.type = :type', { type });
    }

    if (startDate) {
      query.andWhere('vital.timestamp >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('vital.timestamp <= :endDate', { endDate });
    }

    query.orderBy('vital.timestamp', 'DESC');

    return query.getMany();
  }

  async getLatestVitals(userId: string): Promise<any> {
    const vitals = await this.vitalRepository
      .createQueryBuilder('vital')
      .where('vital.userId = :userId', { userId })
      .andWhere('vital.source = :source', { source: 'apple_health' })
      .orderBy('vital.timestamp', 'DESC')
      .getMany();

    // Group by type and get latest for each
    const latestVitals = {};
    for (const vital of vitals) {
      if (!latestVitals[vital.type]) {
        latestVitals[vital.type] = vital;
      }
    }

    return latestVitals;
  }
}