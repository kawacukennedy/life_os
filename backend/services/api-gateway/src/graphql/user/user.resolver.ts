import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { User, UserProfile } from './user.types';
import { UserService } from './user.service';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => UserProfile)
  async userProfile(@Context() context: any): Promise<UserProfile> {
    const userId = context.req.user?.id;
    if (!userId) {
      throw new Error('Unauthorized');
    }
    return this.userService.getUserProfile(userId);
  }

  @Mutation(() => User)
  async updateUser(
    @Args('id') id: string,
    @Args('name', { nullable: true }) name?: string,
    @Args('locale', { nullable: true }) locale?: string,
    @Args('timezone', { nullable: true }) timezone?: string,
    @Context() context: any,
  ): Promise<User> {
    const userId = context.req.user?.id;
    if (!userId || userId !== id) {
      throw new Error('Unauthorized');
    }
    return this.userService.updateUser(id, { name, locale, timezone });
  }
}