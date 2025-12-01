import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transactions/transaction.entity';
import { PlaidService } from './plaid.service';
import { MonitoringService } from './monitoring.service';
import { LoggingService } from './logging.service';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    private plaidService: PlaidService,
    private readonly monitoringService: MonitoringService,
    private readonly loggingService: LoggingService,
  ) {}

  async getTransactions(userId: string, limit = 50) {
    const startTime = Date.now();
    try {
      const transactions = await this.transactionsRepository
        .createQueryBuilder('transaction')
        .where('transaction.userId = :userId', { userId })
        .orderBy('transaction.postedAt', 'DESC')
        .take(limit)
        .getMany();

      this.monitoringService.recordDbQuery('query', 'transaction', Date.now() - startTime);
      this.loggingService.logDatabaseQuery('getTransactions', 'transaction', Date.now() - startTime, true);

      return transactions;
    } catch (error) {
      this.monitoringService.recordDbQuery('query', 'transaction', Date.now() - startTime);
      this.loggingService.logError(error, 'getTransactions', userId);
      throw error;
    }
  }

  async getTransactionById(transactionId: string): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id: transactionId },
    });
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    return transaction;
  }

  async addTransaction(userId: string, transactionData: Partial<Transaction>) {
    const startTime = Date.now();
    try {
      const transaction = this.transactionsRepository.create({
        ...transactionData,
        userId,
      });
      const savedTransaction = await this.transactionsRepository.save(transaction);

      this.monitoringService.recordDbQuery('save', 'transaction', Date.now() - startTime);
      this.monitoringService.recordTransactionProcessing('add_transaction', Date.now() - startTime);
      this.loggingService.logTransactionOperation('add_transaction', savedTransaction.id.toString(), Date.now() - startTime, true, userId);

      return savedTransaction;
    } catch (error) {
      this.monitoringService.recordDbQuery('save', 'transaction', Date.now() - startTime);
      this.monitoringService.recordTransactionProcessing('add_transaction', Date.now() - startTime);
      this.loggingService.logError(error, 'addTransaction', userId);
      throw error;
    }
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
    const startTime = Date.now();
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago

      const plaidStartTime = Date.now();
      const plaidTransactions = await this.plaidService.getTransactions(accessToken, startDate, endDate);
      this.monitoringService.recordPlaidApiCall('get_transactions', 'POST', Date.now() - plaidStartTime, true);
      this.loggingService.logPlaidApiCall('get_transactions', 'POST', Date.now() - plaidStartTime, true, userId);

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

      this.monitoringService.recordTransactionProcessing('sync_plaid_transactions', Date.now() - startTime);
      this.loggingService.logTransactionOperation('sync_plaid_transactions', 'bulk', Date.now() - startTime, true, userId);

      return {
        synced: savedTransactions.length,
        total: plaidTransactions.transactions.length,
      };
    } catch (error) {
      this.monitoringService.recordPlaidApiCall('get_transactions', 'POST', Date.now() - startTime, false);
      this.monitoringService.recordTransactionProcessing('sync_plaid_transactions', Date.now() - startTime);
      this.loggingService.logError(error, 'syncPlaidTransactions', userId);
      throw error;
    }
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