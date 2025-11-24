const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  amount: number;
  currency: string;
  category: string;
  description?: string;
  transactionDate: string;
  createdAt: string;
}

export interface FinanceSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  currency: string;
  accountsCount: number;
  transactionsCount: number;
  lastUpdated: string;
}

export class FinanceAPI {
  private static async request(endpoint: string, options?: RequestInit) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    };

    const response = await fetch(`${API_BASE}/api/finance${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  static async getFinanceSummary(userId: string): Promise<FinanceSummary> {
    return this.request(`/summary?userId=${userId}`);
  }

  static async getTransactions(
    userId: string,
    limit?: number,
  ): Promise<Transaction[]> {
    const params = new URLSearchParams({
      userId,
      ...(limit && { limit: limit.toString() }),
    });
    return this.request(`/transactions?${params}`);
  }

  static async addTransaction(
    userId: string,
    transaction: {
      accountId: string;
      amount: number;
      currency: string;
      category: string;
      description?: string;
    },
  ): Promise<Transaction> {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        ...transaction,
      }),
    });
  }

  // Helper method to get spending by category
  static getSpendingByCategory(transactions: Transaction[]) {
    const spending: { [category: string]: number } = {};

    transactions
      .filter(t => t.amount < 0) // Only expenses
      .forEach(transaction => {
        const category = transaction.category;
        if (!spending[category]) {
          spending[category] = 0;
        }
        spending[category] += Math.abs(transaction.amount);
      });

    return Object.entries(spending).map(([category, amount]) => ({
      category,
      amount,
    }));
  }

  // Helper method to get recent transactions (last 30 days)
  static getRecentTransactions(transactions: Transaction[], days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return transactions
      .filter(t => new Date(t.transactionDate) >= cutoffDate)
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  }

  // Helper method to calculate monthly totals
  static calculateMonthlyTotals(transactions: Transaction[]) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.transactionDate);
      return transactionDate.getMonth() === currentMonth &&
             transactionDate.getFullYear() === currentYear;
    });

    const income = monthlyTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = Math.abs(monthlyTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0));

    return { income, expenses };
  }
}