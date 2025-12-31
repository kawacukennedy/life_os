import { Controller, Get, Post, Body, Query, UseGuards, Headers, Put, Delete, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceService } from './finance.service';
import { PlaidService } from './plaid.service';
import { TransactionCategorizerService } from './transaction-categorizer.service';
import { BudgetService } from '../budgets/budget.service';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly plaidService: PlaidService,
    private readonly categorizerService: TransactionCategorizerService,
    private readonly budgetService: BudgetService,
  ) {}

  @Get('summary')
  async getFinanceSummary(@Query('userId') userId: string) {
    return this.financeService.getFinanceSummary(userId);
  }

  @Get('transactions')
  async getTransactions(
    @Query('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.financeService.getTransactions(userId, limit);
  }

  @Post('transactions')
  async addTransaction(
    @Body() body: { userId: string; accountId: string; amount: number; currency: string; category: string; description?: string },
  ) {
    return this.financeService.addTransaction(body.userId, body);
  }

  // Plaid Integration
  @Post('plaid/link-token')
  async createLinkToken(@Body() body: { userId: string }) {
    return this.plaidService.createLinkToken(body.userId);
  }

  @Post('plaid/exchange-token')
  async exchangePublicToken(@Body() body: { publicToken: string }) {
    return this.plaidService.exchangePublicToken(body.publicToken);
  }

  @Get('plaid/accounts')
  async getAccounts(@Query('accessToken') accessToken: string) {
    return this.plaidService.getAccounts(accessToken);
  }

  @Get('plaid/transactions')
  async getTransactionsPlaid(
    @Query('accessToken') accessToken: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.plaidService.getTransactions(accessToken, startDate, endDate);
  }

  @Post('plaid/sync')
  async syncPlaidTransactions(
    @Body() body: { userId: string; accessToken: string },
  ) {
    return this.financeService.syncPlaidTransactions(body.userId, body.accessToken);
  }

  @Get('insights')
  async getFinanceInsights(@Query('userId') userId: string) {
    return this.financeService.getFinanceInsights(userId);
  }

  @Get('plaid/balances')
  async getBalances(@Query('accessToken') accessToken: string) {
    return this.plaidService.getBalances(accessToken);
  }

  @Get('plaid/identity')
  async getIdentity(@Query('accessToken') accessToken: string) {
    return this.plaidService.getIdentity(accessToken);
  }

  @Post('plaid/webhook')
  async handleWebhook(@Body() body: any, @Headers() headers: any) {
    await this.plaidService.handleWebhook(body, headers);
    return { received: true };
  }

  // Transaction Categorization
  @Post('transactions/categorize')
  async categorizeTransaction(@Body() body: { transactionId: string }) {
    const transaction = await this.financeService.getTransactionById(body.transactionId);
    return this.categorizerService.categorizeTransaction(transaction);
  }

  @Post('transactions/batch-categorize')
  async batchCategorizeTransactions(@Body() body: { userId: string }) {
    await this.categorizerService.batchCategorizeTransactions(body.userId);
    return { message: 'Batch categorization completed' };
  }

  @Post('categorizer/retrain')
  async retrainCategorizationModel(@Body() body: { userId: string }) {
    await this.categorizerService.retrainCategorizationModel(body.userId);
    return { message: 'Model retraining initiated' };
  }

  // Budget Management
  @Post('budgets')
  async createBudget(@Body() body: { userId: string; category: string; amount: number; period?: string }) {
    return this.budgetService.createBudget(body.userId, {
      category: body.category,
      amount: body.amount,
      period: body.period as any || 'monthly',
    });
  }

  @Get('budgets')
  async getBudgets(@Query('userId') userId: string) {
    return this.budgetService.getBudgets(userId);
  }

  @Put('budgets/:id')
  async updateBudget(@Param('id') id: string, @Body() body: { userId: string; updates: any }) {
    return this.budgetService.updateBudget(id, body.userId, body.updates);
  }

  @Delete('budgets/:id')
  async deleteBudget(@Param('id') id: string, @Query('userId') userId: string) {
    await this.budgetService.deleteBudget(id, userId);
    return { message: 'Budget deleted' };
  }

  @Get('budgets/alerts')
  async getBudgetAlerts(@Query('userId') userId: string) {
    return this.budgetService.getBudgetAlerts(userId);
  }

  @Post('budgets/update-spent')
  async updateSpentAmounts(@Body() body: { userId: string }) {
    await this.budgetService.updateSpentAmounts(body.userId);
    return { message: 'Spent amounts updated' };
  }
}