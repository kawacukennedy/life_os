import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FinanceService {
  constructor(private readonly httpService: HttpService) {}

  async getFinanceSummary(userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.FINANCE_SERVICE_URL || 'http://localhost:3006'}/finance/summary?userId=${userId}`)
      );
      return response.data;
    } catch (error) {
      return {
        userId,
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        savingsRate: 0,
        topCategories: [],
        recentTransactions: [],
        budgetAlerts: [],
      };
    }
  }

  async getFinanceInsights(userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.FINANCE_SERVICE_URL || 'http://localhost:3006'}/finance/insights?userId=${userId}`)
      );
      return response.data;
    } catch (error) {
      return {
        insights: [],
      };
    }
  }
}