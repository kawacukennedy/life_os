import { Resolver, Query, Args, Context } from '@nestjs/graphql';
import { SocialService } from './social.service';
import { SocialConnections, SharedGoals } from './social.types';

@Resolver()
export class SocialResolver {
  constructor(private readonly socialService: SocialService) {}

  @Query(() => SocialConnections)
  async getSocialConnections(@Args('userId') userId: string, @Context() context: any) {
    const authenticatedUserId = context.req.user?.id;
    if (!authenticatedUserId || authenticatedUserId !== userId) {
      throw new Error('Unauthorized');
    }
    return this.socialService.getSocialConnections(userId);
  }

  @Query(() => SharedGoals)
  async getSharedGoals(@Args('userId') userId: string, @Context() context: any) {
    const authenticatedUserId = context.req.user?.id;
    if (!authenticatedUserId || authenticatedUserId !== userId) {
      throw new Error('Unauthorized');
    }
    return this.socialService.getSharedGoals(userId);
  }
}