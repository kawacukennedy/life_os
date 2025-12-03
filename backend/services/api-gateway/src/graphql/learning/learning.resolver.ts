import { Resolver, Query, Args, Context } from '@nestjs/graphql';
import { LearningService } from './learning.service';
import { LearningProgress, LearningRecommendations } from './learning.types';

@Resolver()
export class LearningResolver {
  constructor(private readonly learningService: LearningService) {}

  @Query(() => LearningProgress)
  async getLearningProgress(@Args('userId') userId: string, @Context() context: any) {
    const authenticatedUserId = context.req.user?.id;
    if (!authenticatedUserId || authenticatedUserId !== userId) {
      throw new Error('Unauthorized');
    }
    return this.learningService.getLearningProgress(userId);
  }

  @Query(() => LearningRecommendations)
  async getLearningRecommendations(@Args('userId') userId: string, @Context() context: any) {
    const authenticatedUserId = context.req.user?.id;
    if (!authenticatedUserId || authenticatedUserId !== userId) {
      throw new Error('Unauthorized');
    }
    return this.learningService.getLearningRecommendations(userId);
  }
}