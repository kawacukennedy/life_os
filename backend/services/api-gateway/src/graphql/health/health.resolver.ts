import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { HealthService } from './health.service';
import { HealthSummary, Vital } from './health.types';

@Resolver()
export class HealthResolver {
  constructor(private readonly healthService: HealthService) {}

  @Query(() => HealthSummary)
  async healthSummary(@Context() context: any) {
    const userId = context.req.user?.id;
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
}