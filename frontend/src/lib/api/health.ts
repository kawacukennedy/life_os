const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface Vital {
  id: string;
  userId: string;
  metricType: string;
  value: number;
  unit: string;
  recordedAt: string;
}

export interface HealthSummary {
  averageHeartRate: number;
  totalSteps: number;
  averageSleepHours: number;
  lastUpdated: string;
  vitalsCount: number;
}

export class HealthAPI {
  private static async request(endpoint: string, options?: RequestInit) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    };

    const response = await fetch(`${API_BASE}/api/health${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  static async getHealthSummary(userId: string): Promise<HealthSummary> {
    return this.request(`/summary?userId=${userId}`);
  }

  static async getVitals(
    userId: string,
    metricType?: string,
    limit?: number,
  ): Promise<Vital[]> {
    const params = new URLSearchParams({
      userId,
      ...(metricType && { metricType }),
      ...(limit && { limit: limit.toString() }),
    });
    return this.request(`/vitals?${params}`);
  }

  static async addVital(
    userId: string,
    metricType: string,
    value: number,
    unit: string,
  ): Promise<Vital> {
    return this.request('/vitals', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        metricType,
        value,
        unit,
      }),
    });
  }

  // Helper method to get vitals by date range
  static async getVitalsByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
    metricType?: string,
  ): Promise<Vital[]> {
    const vitals = await this.getVitals(userId, metricType, 1000); // Get more data
    return vitals.filter(vital => {
      const vitalDate = new Date(vital.recordedAt).toISOString().split('T')[0];
      return vitalDate >= startDate && vitalDate <= endDate;
    });
  }

  // Helper method to aggregate vitals by date
  static aggregateVitalsByDate(vitals: Vital[], metricType: string) {
    const aggregated: { [date: string]: number[] } = {};

    vitals
      .filter(v => v.metricType === metricType)
      .forEach(vital => {
        const date = new Date(vital.recordedAt).toISOString().split('T')[0];
        if (!aggregated[date]) {
          aggregated[date] = [];
        }
        aggregated[date].push(vital.value);
      });

    // Return average values per date
    return Object.entries(aggregated).map(([date, values]) => ({
      date,
      value: values.reduce((sum, val) => sum + val, 0) / values.length,
    }));
  }
}