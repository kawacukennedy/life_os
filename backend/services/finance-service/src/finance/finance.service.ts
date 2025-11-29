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
      balance,
      totalIncome,
      totalExpenses,
      categoryBreakdown,
      transactionCount: transactions.length,
    };
  }

  // Plaid Integration Methods
  async createPlaidLinkToken(userId: string) {
    return this.plaidService.createLinkToken(userId);
  }

  async connectPlaidAccount(publicToken: string) {
    const tokenResponse = await this.plaidService.exchangePublicToken(publicToken);
    return tokenResponse;
  }

  async syncPlaidTransactions(userId: string, accessToken: string) {
    try {
      // Get last 30 days of transactions
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      const plaidTransactions = await this.plaidService.getTransactions(
        accessToken,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      const ingestedTransactions = [];

      for (const transaction of plaidTransactions.transactions) {
        // Check if transaction already exists
        const existing = await this.transactionsRepository.findOne({
          where: {
            userId,
            externalId: transaction.transaction_id,
          },
        });

        if (!existing) {
          const newTransaction = await this.addTransaction(userId, {
            externalId: transaction.transaction_id,
            amount: transaction.amount,
            description: transaction.name,
            category: transaction.category?.[0] || 'Other',
            postedAt: new Date(transaction.date),
            merchantName: transaction.merchant_name,
            pending: transaction.pending,
            accountId: transaction.account_id,
          });
          ingestedTransactions.push(newTransaction);
        }
      }

      return {
        success: true,
        ingestedCount: ingestedTransactions.length,
        totalCount: plaidTransactions.transactions.length,
        syncedAt: new Date(),
      };
    } catch (error) {
      console.error('Error syncing Plaid transactions:', error);
      throw error;
    }
  }

  async getPlaidAccounts(accessToken: string) {
    return this.plaidService.getAccounts(accessToken);
  }

  async getPlaidBalances(accessToken: string) {
    return this.plaidService.getBalances(accessToken);
  }

  async getPlaidIdentity(accessToken: string) {
    return this.plaidService.getIdentity(accessToken);
  }

  // Categorization and insights
  async categorizeTransaction(description: string, amount: number): Promise<string> {
    // Simple rule-based categorization (in production, use ML model)
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('grocery') || lowerDesc.includes('supermarket')) {
      return 'Food & Dining';
    }
    if (lowerDesc.includes('gas') || lowerDesc.includes('fuel')) {
      return 'Transportation';
    }
    if (lowerDesc.includes('rent') || lowerDesc.includes('mortgage')) {
      return 'Housing';
    }
    if (lowerDesc.includes('salary') || lowerDesc.includes('payroll')) {
      return 'Income';
    }
    if (amount > 0) {
      return 'Income';
    }

    return 'Other';
  }

  async getSpendingInsights(userId: string) {
    const transactions = await this.getTransactions(userId, 1000);
    const expenses = transactions.filter(t => t.amount < 0);

    const monthlySpending = expenses.reduce((acc, t) => {
      const month = new Date(t.postedAt).toISOString().slice(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);

    const categorySpending = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);

    return {
      monthlySpending,
      categorySpending,
      topCategories: Object.entries(categorySpending)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5),
    };
  }
}