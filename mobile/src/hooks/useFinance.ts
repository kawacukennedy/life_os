import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  type: 'income' | 'expense';
}

export interface Budget {
  category: string;
  spent: number;
  limit: number;
}

export interface FinanceData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsGoal: number;
  recentTransactions: Transaction[];
  budgets: Budget[];
}

// Mock data
const mockTransactions: Transaction[] = [
  {
    id: '1',
    amount: -45.67,
    description: 'Coffee Shop',
    category: 'Food & Dining',
    date: new Date().toISOString(),
    type: 'expense',
  },
  {
    id: '2',
    amount: 3500.00,
    description: 'Salary Deposit',
    category: 'Income',
    date: new Date(Date.now() - 86400000).toISOString(),
    type: 'income',
  },
  {
    id: '3',
    amount: -120.00,
    description: 'Grocery Store',
    category: 'Groceries',
    date: new Date(Date.now() - 172800000).toISOString(),
    type: 'expense',
  },
  {
    id: '4',
    amount: -85.50,
    description: 'Gas Station',
    category: 'Transportation',
    date: new Date(Date.now() - 259200000).toISOString(),
    type: 'expense',
  },
];

const mockBudgets: Budget[] = [
  { category: 'Food & Dining', spent: 450, limit: 600 },
  { category: 'Transportation', spent: 280, limit: 400 },
  { category: 'Entertainment', spent: 150, limit: 200 },
  { category: 'Shopping', spent: 320, limit: 300 },
];

export const useFinanceData = (period: string = 'month') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['finance', user?.id, period],
    queryFn: async (): Promise<FinanceData> => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      return {
        totalBalance: 5420.50,
        monthlyIncome: 3500.00,
        monthlyExpenses: 1850.67,
        savingsGoal: 1000.00,
        recentTransactions: mockTransactions,
        budgets: mockBudgets,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useTransactions = (limit: number = 10) => {
  const { data } = useFinanceData();
  return {
    transactions: data?.recentTransactions?.slice(0, limit) || [],
    isLoading: !data,
  };
};

export const useBudgets = () => {
  const { data } = useFinanceData();
  return {
    budgets: data?.budgets || [],
    isLoading: !data,
  };
};