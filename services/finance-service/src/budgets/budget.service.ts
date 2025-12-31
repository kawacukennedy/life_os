import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Budget } from './budget.entity';
import { Transaction } from '../transactions/transaction.entity';

export interface BudgetAlert {
  id: string;
  category: string;
  budgetAmount: number;
  spentAmount: number;
  percentage: number;
  message: string;
}

@Injectable()
export class BudgetService {
  constructor(
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async createBudget(userId: string, budgetData: Partial<Budget>): Promise<Budget> {
    const budget = this.budgetRepository.create({
      ...budgetData,
      userId,
    });
    return this.budgetRepository.save(budget);
  }

  async getBudgets(userId: string): Promise<Budget[]> {
    return this.budgetRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async updateBudget(id: string, userId: string, updates: Partial<Budget>): Promise<Budget> {
    await this.budgetRepository.update({ id, userId }, updates);
    return this.budgetRepository.findOne({ where: { id, userId } });
  }

  async deleteBudget(id: string, userId: string): Promise<void> {
    await this.budgetRepository.update({ id, userId }, { isActive: false });
  }

  async getBudgetAlerts(userId: string): Promise<BudgetAlert[]> {
    const budgets = await this.budgetRepository.find({
      where: { userId, isActive: true },
    });

    const alerts: BudgetAlert[] = [];

    for (const budget of budgets) {
      const spent = await this.calculateSpentAmount(userId, budget);
      const percentage = (spent / budget.amount) * 100;

      if (percentage >= 80) {
        let message = '';
        if (percentage >= 100) {
          message = `You've exceeded your ${budget.category} budget by $${(spent - budget.amount).toFixed(2)}`;
        } else if (percentage >= 90) {
          message = `You're close to exceeding your ${budget.category} budget`;
        } else {
          message = `You've used ${percentage.toFixed(0)}% of your ${budget.category} budget`;
        }

        alerts.push({
          id: budget.id,
          category: budget.category,
          budgetAmount: budget.amount,
          spentAmount: spent,
          percentage,
          message,
        });
      }
    }

    return alerts;
  }

  private async calculateSpentAmount(userId: string, budget: Budget): Promise<number> {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (budget.startDate && budget.endDate) {
      startDate = budget.startDate;
      endDate = budget.endDate;
    } else {
      // Calculate period-based dates
      switch (budget.period) {
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = now;
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
      }
    }

    const transactions = await this.transactionRepository.find({
      where: {
        userId,
        category: budget.category,
        date: Between(startDate, endDate),
      },
    });

    return transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  }

  async updateSpentAmounts(userId: string): Promise<void> {
    const budgets = await this.budgetRepository.find({
      where: { userId, isActive: true },
    });

    for (const budget of budgets) {
      const spent = await this.calculateSpentAmount(userId, budget);
      await this.budgetRepository.update(budget.id, { spent });
    }
  }
}