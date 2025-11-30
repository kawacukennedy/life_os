import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transactions/transaction.entity';
import { PlaidService } from './plaid.service';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    private plaidService: PlaidService,
  ) {}

  async getTransactions(userId: string, limit = 50) {
    return this.transactionsRepository
      .createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId })
      .orderBy('transaction.postedAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async addTransaction(userId: string, transactionData: Partial<Transaction>) {
    const transaction = this.transactionsRepository.create({
      ...transactionData,
      userId,
    });
    return this.transactionsRepository.save(transaction);
  }

  async getFinanceSummary(userId: string) {
    const transactions = await this.getTransactions(userId, 1000);

    const totalIncome = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    const balance = totalIncome - totalExpenses;

    const categoryBreakdown = transactions.reduce((acc, t) => {
      const category = t.category;
      if (!acc[category]) acc[category] = 0;
      acc[category] += Math.abs(Number(t.amount));
      return acc;
    }, {} as Record<string, number>);

    return {
      totalIncome,
      totalExpenses,
      balance,
      categoryBreakdown,
    };
  }

  async createPlaidLinkToken(userId: string) {
    return this.plaidService.createLinkToken(userId);
  }

  async exchangePlaidToken(publicToken: string) {
    return this.plaidService.exchangePublicToken(publicToken);
  }

  async syncPlaidTransactions(userId: string, accessToken: string) {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago

    const plaidTransactions = await this.plaidService.getTransactions(accessToken, startDate, endDate);

    const savedTransactions = [];

    for (const transaction of plaidTransactions.transactions) {
      // Check if transaction already exists
      const existing = await this.transactionsRepository.findOne({
        where: { plaidTransactionId: transaction.transaction_id },
      });

      if (!existing) {
        const category = transaction.personal_finance_category?.primary ||
                        this.plaidService.categorizeTransaction(transaction.name, transaction.amount);

        const savedTransaction = await this.addTransaction(userId, {
          plaidTransactionId: transaction.transaction_id,
          amount: transaction.amount,
          description: transaction.name,
          category,
          postedAt: new Date(transaction.date),
          merchantName: transaction.merchant_name,
          pending: transaction.pending,
        });

        savedTransactions.push(savedTransaction);
      }
    }

    return {
      synced: savedTransactions.length,
      total: plaidTransactions.transactions.length,
    };
  }

  async getSpendingInsights(userId: string) {
    const transactions = await this.getTransactions(userId, 1000);
    const expenses = transactions.filter(t => t.amount < 0);

    // Monthly spending trend
    const monthlySpending = expenses.reduce((acc, t) => {
      const month = t.postedAt.toISOString().slice(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + Math.abs(Number(t.amount));
      return acc;
    }, {} as Record<string, number>);

    // Top spending categories
    const categorySpending = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(Number(t.amount));
      return acc;
    }, {} as Record<string, number>);

    const topCategories = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    // Budget recommendations
    const averageMonthlySpending = Object.values(monthlySpending).reduce((a, b) => a + b, 0) /
                                  Math.max(Object.keys(monthlySpending).length, 1);

    return {
      monthlySpending,
      topCategories,
      averageMonthlySpending,
      recommendations: this.generateBudgetRecommendations(topCategories, averageMonthlySpending),
    };
  }

  private generateBudgetRecommendations(topCategories: [string, number][], averageMonthly: number) {
    const recommendations = [];

    for (const [category, amount] of topCategories) {
      const percentage = (amount / averageMonthly) * 100;

      if (percentage > 30) {
        recommendations.push({
          category,
          message: `You're spending ${percentage.toFixed(1)}% of your budget on ${category}. Consider setting a limit.`,
          suggestedLimit: amount * 0.8, // 20% reduction
        });
      }
    }

    return recommendations;
  }
}