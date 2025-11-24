import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transactions/transaction.entity';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
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
}