import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vital } from '../vitals/vital.entity';

export interface AnomalyResult {
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high';
  reason: string;
  recommendedAction: string;
  confidence: number;
}

@Injectable()
export class HealthAnomalyDetectorService {
  // Normal ranges for vital signs
  private normalRanges = {
    heart_rate: { min: 60, max: 100, unit: 'bpm' },
    blood_pressure_systolic: { min: 90, max: 140, unit: 'mmHg' },
    blood_pressure_diastolic: { min: 60, max: 90, unit: 'mmHg' },
    oxygen_saturation: { min: 95, max: 100, unit: '%' },
    respiratory_rate: { min: 12, max: 20, unit: 'breaths/min' },
    body_temperature: { min: 97, max: 99, unit: '°F' },
    sleep_hours: { min: 7, max: 9, unit: 'hours' },
    steps: { min: 5000, max: 15000, unit: 'steps' }, // Daily target
  };

  // Anomaly thresholds
  private anomalyThresholds = {
    heart_rate: { critical_low: 50, critical_high: 120 },
    blood_pressure_systolic: { critical_low: 80, critical_high: 160 },
    blood_pressure_diastolic: { critical_low: 50, critical_high: 100 },
    oxygen_saturation: { critical_low: 90 },
    respiratory_rate: { critical_low: 8, critical_high: 30 },
    body_temperature: { critical_low: 95, critical_high: 103 },
  };

  constructor(
    @InjectRepository(Vital)
    private vitalRepository: Repository<Vital>,
  ) {}

  async detectAnomalies(userId: string, vitalType: string, currentValue: number): Promise<AnomalyResult> {
    const historicalData = await this.getHistoricalData(userId, vitalType, 30); // Last 30 days

    const baseline = this.calculateBaseline(historicalData);
    const isAnomaly = this.isAnomalous(currentValue, baseline, vitalType);

    if (!isAnomaly) {
      return {
        isAnomaly: false,
        severity: 'low',
        reason: 'Within normal range',
        recommendedAction: 'Continue monitoring',
        confidence: 0.9,
      };
    }

    const severity = this.calculateSeverity(currentValue, vitalType);
    const reason = this.generateReason(currentValue, baseline, vitalType);
    const recommendedAction = this.generateRecommendedAction(vitalType, severity);

    return {
      isAnomaly: true,
      severity,
      reason,
      recommendedAction,
      confidence: this.calculateConfidence(currentValue, baseline, historicalData),
    };
  }

  private async getHistoricalData(userId: string, vitalType: string, days: number): Promise<number[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const vitals = await this.vitalRepository
      .createQueryBuilder('vital')
      .where('vital.userId = :userId', { userId })
      .andWhere('vital.type = :type', { type: vitalType })
      .andWhere('vital.timestamp >= :startDate', { startDate })
      .orderBy('vital.timestamp', 'DESC')
      .getMany();

    return vitals.map(v => v.value);
  }

  private calculateBaseline(historicalValues: number[]): { mean: number; std: number } {
    if (historicalValues.length === 0) {
      return { mean: 0, std: 0 };
    }

    const mean = historicalValues.reduce((sum, val) => sum + val, 0) / historicalValues.length;
    const variance = historicalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalValues.length;
    const std = Math.sqrt(variance);

    return { mean, std };
  }

  private isAnomalous(currentValue: number, baseline: { mean: number; std: number }, vitalType: string): boolean {
    const thresholds = this.anomalyThresholds[vitalType];
    if (!thresholds) return false;

    // Check critical thresholds first
    if (thresholds.critical_low && currentValue < thresholds.critical_low) return true;
    if (thresholds.critical_high && currentValue > thresholds.critical_high) return true;

    // Check statistical anomaly (3 standard deviations)
    const deviation = Math.abs(currentValue - baseline.mean);
    return deviation > 3 * baseline.std && baseline.std > 0;
  }

  private calculateSeverity(currentValue: number, vitalType: string): 'low' | 'medium' | 'high' {
    const thresholds = this.anomalyThresholds[vitalType];
    if (!thresholds) return 'low';

    const deviation = Math.abs(currentValue - (this.normalRanges[vitalType]?.max + this.normalRanges[vitalType]?.min) / 2);

    if ((thresholds.critical_low && currentValue < thresholds.critical_low) ||
        (thresholds.critical_high && currentValue > thresholds.critical_high)) {
      return 'high';
    }

    if (deviation > 20) return 'high';
    if (deviation > 10) return 'medium';
    return 'low';
  }

  private generateReason(currentValue: number, baseline: { mean: number; std: number }, vitalType: string): string {
    const normalRange = this.normalRanges[vitalType];
    if (!normalRange) return 'Value outside expected range';

    const { min, max, unit } = normalRange;
    const baselineStr = baseline.mean.toFixed(1);

    if (currentValue < min) {
      return `${vitalType.replace('_', ' ')} (${currentValue} ${unit}) is below normal range (${min}-${max} ${unit}). Baseline: ${baselineStr}`;
    } else if (currentValue > max) {
      return `${vitalType.replace('_', ' ')} (${currentValue} ${unit}) is above normal range (${min}-${max} ${unit}). Baseline: ${baselineStr}`;
    } else {
      return `${vitalType.replace('_', ' ')} (${currentValue} ${unit}) shows unusual deviation from baseline (${baselineStr})`;
    }
  }

  private generateRecommendedAction(vitalType: string, severity: string): string {
    const actions = {
      heart_rate: {
        high: 'Consider relaxation techniques or consult a healthcare provider if symptoms persist',
        medium: 'Monitor heart rate and reduce stress factors',
        low: 'Stay hydrated and consider light exercise',
      },
      blood_pressure_systolic: {
        high: 'Monitor blood pressure and consider lifestyle changes or medical consultation',
        medium: 'Reduce sodium intake and increase physical activity',
        low: 'Stay hydrated and avoid sudden position changes',
      },
      oxygen_saturation: {
        high: 'This is unexpected - please verify measurement',
        medium: 'Ensure proper measurement technique',
        low: 'Seek immediate medical attention if experiencing shortness of breath',
      },
      sleep_hours: {
        high: 'Good sleep duration - maintain current habits',
        medium: 'Consider adjusting bedtime routine',
        low: 'Prioritize better sleep hygiene and consistent schedule',
      },
    };

    return actions[vitalType]?.[severity] || 'Consult with a healthcare professional for personalized advice';
  }

  private calculateConfidence(currentValue: number, baseline: { mean: number; std: number }, historicalData: number[]): number {
    if (historicalData.length < 5) return 0.6; // Low confidence with limited data

    const deviation = Math.abs(currentValue - baseline.mean);
    const zScore = baseline.std > 0 ? deviation / baseline.std : 0;

    // Higher confidence for more extreme anomalies
    if (zScore > 3) return 0.95;
    if (zScore > 2) return 0.85;
    if (zScore > 1) return 0.75;
    return 0.7;
  }

  async detectAnomaliesForUser(userId: string): Promise<AnomalyResult[]> {
    const recentVitals = await this.vitalRepository
      .createQueryBuilder('vital')
      .where('vital.userId = :userId', { userId })
      .andWhere('vital.timestamp >= :recent', { recent: new Date(Date.now() - 24 * 60 * 60 * 1000) }) // Last 24 hours
      .orderBy('vital.timestamp', 'DESC')
      .getMany();

    const anomalies: AnomalyResult[] = [];

    for (const vital of recentVitals) {
      const anomaly = await this.detectAnomalies(userId, vital.type, vital.value);
      if (anomaly.isAnomaly) {
        anomalies.push({
          ...anomaly,
          reason: `${vital.type}: ${anomaly.reason}`,
        });
      }
    }

    return anomalies;
  }
}