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
    const timeSeriesAnomaly = this.detectTimeSeriesAnomaly(historicalData, currentValue);
    const isAnomaly = this.isAnomalous(currentValue, baseline, vitalType) || timeSeriesAnomaly.isAnomaly;

    if (!isAnomaly) {
      return {
        isAnomaly: false,
        severity: 'low',
        reason: 'Within normal range',
        recommendedAction: 'Continue monitoring',
        confidence: 0.9,
      };
    }

    const severity = Math.max(
      this.calculateSeverity(currentValue, vitalType),
      timeSeriesAnomaly.severity === 'high' ? 2 : timeSeriesAnomaly.severity === 'medium' ? 1 : 0
    ) as 'low' | 'medium' | 'high';

    const reason = timeSeriesAnomaly.isAnomaly
      ? timeSeriesAnomaly.reason
      : this.generateReason(currentValue, baseline, vitalType);
    const recommendedAction = this.generateRecommendedAction(vitalType, severity);

    return {
      isAnomaly: true,
      severity,
      reason,
      recommendedAction,
      confidence: Math.max(
        this.calculateConfidence(currentValue, baseline, historicalData),
        timeSeriesAnomaly.confidence
      ),
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

  private detectTimeSeriesAnomaly(historicalData: number[], currentValue: number): {
    isAnomaly: boolean;
    severity: 'low' | 'medium' | 'high';
    reason: string;
    confidence: number;
  } {
    if (historicalData.length < 7) {
      return { isAnomaly: false, severity: 'low', reason: '', confidence: 0 };
    }

    // Calculate moving averages
    const shortMA = this.calculateMovingAverage(historicalData.slice(0, 7)); // Last 7 days
    const longMA = this.calculateMovingAverage(historicalData.slice(0, 14)); // Last 14 days

    // Detect trend changes
    const recentTrend = this.calculateTrend(historicalData.slice(0, 7));
    const overallTrend = this.calculateTrend(historicalData.slice(0, 14));

    // Sudden spikes or drops
    const recentAvg = shortMA;
    const deviation = Math.abs(currentValue - recentAvg);
    const relativeDeviation = recentAvg > 0 ? deviation / recentAvg : 0;

    // Trend reversal detection
    const trendReversal = Math.sign(recentTrend) !== Math.sign(overallTrend) &&
                         Math.abs(recentTrend) > 0.1 && Math.abs(overallTrend) > 0.1;

    if (relativeDeviation > 0.5) { // 50% deviation from recent average
      return {
        isAnomaly: true,
        severity: relativeDeviation > 1.0 ? 'high' : 'medium',
        reason: `Sudden ${currentValue > recentAvg ? 'spike' : 'drop'} of ${(relativeDeviation * 100).toFixed(1)}% from recent average`,
        confidence: 0.8,
      };
    }

    if (trendReversal) {
      return {
        isAnomaly: true,
        severity: 'medium',
        reason: `Significant trend reversal detected in recent measurements`,
        confidence: 0.75,
      };
    }

    // Seasonal pattern detection (simplified)
    const seasonalAnomaly = this.detectSeasonalAnomaly(historicalData, currentValue);
    if (seasonalAnomaly) {
      return {
        isAnomaly: true,
        severity: 'low',
        reason: 'Value deviates from expected seasonal pattern',
        confidence: 0.7,
      };
    }

    return { isAnomaly: false, severity: 'low', reason: '', confidence: 0 };
  }

  private calculateMovingAverage(data: number[]): number {
    return data.reduce((sum, val) => sum + val, 0) / data.length;
  }

  private calculateTrend(data: number[]): number {
    if (data.length < 2) return 0;

    // Simple linear trend
    const n = data.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = data.reduce((sum, val, index) => sum + val * index, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  private detectSeasonalAnomaly(historicalData: number[], currentValue: number): boolean {
    if (historicalData.length < 14) return false;

    // Check if current value is outlier compared to same "day of week" pattern
    // Simplified: compare to values 7 days ago
    const weekAgoIndex = Math.min(7, historicalData.length - 1);
    const weekAgoValue = historicalData[weekAgoIndex];

    const deviation = Math.abs(currentValue - weekAgoValue);
    const relativeDeviation = weekAgoValue > 0 ? deviation / weekAgoValue : 0;

    return relativeDeviation > 0.3; // 30% deviation from same period last week
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