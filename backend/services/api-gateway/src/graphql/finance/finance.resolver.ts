import { Resolver, Query, Args, Context } from '@nestjs/graphql';
import { FinanceService } from './finance.service';
import { FinanceSummary, FinanceInsights } from './finance.types';

@Resolver()
export class FinanceResolver {
  constructor(private readonly financeService: FinanceService) {}

  @Query(() => FinanceSummary)
  async getFinanceSummary(@Args('userId') userId: string, @Context() context: any) {
    const authenticatedUserId = context.req.user?.id;
    if (!authenticatedUserId || authenticatedUserId !== userId) {
      throw new Error('Unauthorized');
    }
    return this.financeService.getFinanceSummary(userId);
  }

  @Query(() => FinanceInsights)
  async getFinanceInsights(@Args('userId') userId: string, @Context() context: any) {
    const authenticatedUserId = context.req.user?.id;
    if (!authenticatedUserId || authenticatedUserId !== userId) {
      throw new Error('Unauthorized');
    }
    return this.financeService.getFinanceInsights(userId);
  }
}