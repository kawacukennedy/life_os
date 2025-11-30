import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { AIRecommendation, ScheduleOptimization, PersonalizedRecommendations } from './ai.types';
import { AIService } from './ai.service';

@Resolver()
export class AIResolver {
  constructor(private readonly aiService: AIService) {}

  @Query(() => AIRecommendation)
  async getSuggestions(
    @Args('userId') userId: string,
    @Args('context') context: string,
    @Args('maxResults', { nullable: true, type: () => Number }) maxResults?: number,
    @Context() contextObj: any,
  ): Promise<AIRecommendation> {
    const authenticatedUserId = contextObj.req.user?.id;
    if (!authenticatedUserId || authenticatedUserId !== userId) {
      throw new Error('Unauthorized');
    }
    return this.aiService.getSuggestions(userId, context, maxResults);
  }

  @Mutation(() => ScheduleOptimization)
  async optimizeSchedule(
    @Args('userId') userId: string,
    @Args('tasks') tasks: any,
    @Args('constraints', { nullable: true }) constraints?: any,
    @Context() context: any,
  ): Promise<ScheduleOptimization> {
    const authenticatedUserId = context.req.user?.id;
    if (!authenticatedUserId || authenticatedUserId !== userId) {
      throw new Error('Unauthorized');
    }
    return this.aiService.optimizeSchedule(userId, tasks, constraints);
  }

  @Query(() => PersonalizedRecommendations)
  async getPersonalizedRecommendations(
    @Args('userId') userId: string,
    @Args('userData') userData: any,
    @Context() context: any,
  ): Promise<PersonalizedRecommendations> {
    const authenticatedUserId = context.req.user?.id;
    if (!authenticatedUserId || authenticatedUserId !== userId) {
      throw new Error('Unauthorized');
    }
    return this.aiService.getPersonalizedRecommendations(userId, userData);
  }
}