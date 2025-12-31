import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from 'lifeos-shared';

export interface HealthMetric {
  id: string;
  type: string;
  value: number;
  unit: string;
  date: string;
}

export interface HealthData {
  steps: number;
  heartRate: number;
  sleepHours: number;
  calories: number;
  vitals: HealthMetric[];
  lastSync?: string;
}

// Mock data
const mockVitals: HealthMetric[] = [
  {
    id: '1',
    type: 'Heart Rate',
    value: 72,
    unit: 'bpm',
    date: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'Blood Pressure',
    value: 120,
    unit: 'mmHg',
    date: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    type: 'Weight',
    value: 70.5,
    unit: 'kg',
    date: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '4',
    type: 'Body Temperature',
    value: 36.6,
    unit: '°C',
    date: new Date(Date.now() - 172800000).toISOString(),
  },
];

export const useHealthData = (period: string = 'today') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['health', user?.id, period],
    queryFn: async (): Promise<HealthData> => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));

      return {
        steps: 8432,
        heartRate: 72,
        sleepHours: 7.5,
        calories: 1850,
        vitals: mockVitals,
        lastSync: new Date().toISOString(),
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSyncHealthData = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (healthData: any[]) => {
      // Simulate API call to sync health data
      await new Promise(resolve => setTimeout(resolve, 1000));

      return { success: true, syncedRecords: healthData.length };
    },
  });
};

export const useHealthMetrics = () => {
  const { data } = useHealthData();
  return {
    metrics: data?.vitals || [],
    isLoading: !data,
  };
};