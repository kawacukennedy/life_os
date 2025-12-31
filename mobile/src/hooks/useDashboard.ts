import {useQuery} from '@tanstack/react-query';
import {useAuth} from '../contexts/AuthContext';

export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
}

export interface HealthSummary {
  sleepHours: number;
  steps: number;
  heartRate: number;
  calories: number;
  lastUpdated: string;
}

export interface AISuggestion {
  id: string;
  type: 'task' | 'health' | 'finance' | 'learning';
  title: string;
  description: string;
  confidence: number;
  action?: {
    type: 'create_task' | 'schedule' | 'navigate';
    payload?: any;
  };
}

export interface FinanceSummary {
  balance: number;
  spendingToday: number;
  budgetRemaining: number;
  alerts: string[];
}

export interface DashboardData {
  tasksToday: Task[];
  healthSummary: HealthSummary;
  aiSuggestions: AISuggestion[];
  financeSummary: FinanceSummary;
  productivityScore: number;
}

// Mock data - replace with actual API calls
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Review project proposal',
    status: 'pending',
    priority: 'high',
    dueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Morning workout',
    status: 'completed',
    priority: 'medium',
    dueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

const mockHealthSummary: HealthSummary = {
  sleepHours: 7.5,
  steps: 8432,
  heartRate: 72,
  calories: 1850,
  lastUpdated: new Date().toISOString(),
};

const mockAISuggestions: AISuggestion[] = [
  {
    id: '1',
    type: 'task',
    title: 'Schedule team meeting',
    description: 'Based on your calendar, you have availability at 2 PM today',
    confidence: 0.85,
    action: {
      type: 'schedule',
      payload: { time: '14:00' },
    },
  },
  {
    id: '2',
    type: 'health',
    title: 'Take a 10-minute walk',
    description: 'Your step count is below target. A short walk could boost your energy.',
    confidence: 0.72,
    action: {
      type: 'create_task',
      payload: { title: 'Take a 10-minute walk', duration: 10 },
    },
  },
];

const mockFinanceSummary: FinanceSummary = {
  balance: 5420.50,
  spendingToday: 45.67,
  budgetRemaining: 154.33,
  alerts: ['Coffee shop spending is 20% over budget this week'],
};

export const useDashboardData = () => {
  const {user} = useAuth();

  return useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: async (): Promise<DashboardData> => {
      // In a real app, these would be separate API calls
      // For now, return mock data with simulated delay
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        tasksToday: mockTasks,
        healthSummary: mockHealthSummary,
        aiSuggestions: mockAISuggestions,
        financeSummary: mockFinanceSummary,
        productivityScore: 85,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};

export const useTasksToday = () => {
  const {data} = useDashboardData();
  return {
    tasks: data?.tasksToday || [],
    isLoading: !data,
  };
};

export const useHealthSummary = () => {
  const {data} = useDashboardData();
  return {
    health: data?.healthSummary,
    isLoading: !data,
  };
};

export const useAISuggestions = () => {
  const {data} = useDashboardData();
  return {
    suggestions: data?.aiSuggestions || [],
    isLoading: !data,
  };
};

export const useFinanceSummary = () => {
  const {data} = useDashboardData();
  return {
    finance: data?.financeSummary,
    isLoading: !data,
  };
};

export const useProductivityScore = () => {
  const {data} = useDashboardData();
  return {
    score: data?.productivityScore || 0,
    isLoading: !data,
  };
};