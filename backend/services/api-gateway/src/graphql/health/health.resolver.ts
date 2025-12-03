import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { HealthService } from './health.service';
import { HealthSummary, Vital, HealthInsights } from './health.types';

@Resolver()
export class HealthResolver {
  constructor(private readonly healthService: HealthService) {}

  @Query(() => HealthSummary)
  async getHealthSummary(@Args('userId') userId: string, @Context() context: any) {
    const authenticatedUserId = context.req.user?.id;
    if (!authenticatedUserId || authenticatedUserId !== userId) {
      throw new Error('Unauthorized');
    }
    return this.healthService.getHealthSummary(userId);
  }

  @Query(() => [Vital])
  async vitals(
    @Args('userId') userId: string,
    @Args('metricType', { nullable: true }) metricType?: string,
    @Args('limit', { nullable: true }) limit?: number,
  ) {
    return this.healthService.getVitals(userId, metricType, limit);
  }

  @Mutation(() => Vital)
  async addVital(
    @Args('userId') userId: string,
    @Args('metricType') metricType: string,
    @Args('value') value: number,
    @Args('unit') unit: string,
  ) {
    return this.healthService.addVital(userId, metricType, value, unit);
  }

  @Query(() => HealthInsights)
  async getHealthInsights(@Args('userId') userId: string, @Context() context: any) {
    const authenticatedUserId = context.req.user?.id;
    if (!authenticatedUserId || authenticatedUserId !== userId) {
      throw new Error('Unauthorized');
    }
    return this.healthService.getHealthInsights(userId);
  }
}