import { Controller, Get, Post, Body, Query, UseGuards, Headers } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceService } from './finance.service';
import { PlaidService } from './plaid.service';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly plaidService: PlaidService,
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
  async getTransactions(
    @Query('accessToken') accessToken: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.plaidService.getTransactions(accessToken, startDate, endDate);
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
}