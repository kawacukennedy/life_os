import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { GatewayService } from '../gateway.service';

export class Connection {
  id: string;
  userId: string;
  connectedUserId: string;
  status: string;
  createdAt: string;
}

export class SharedGoal {
  id: string;
  title: string;
  description?: string;
  participants: string[];
  progress: number;
  createdAt: string;
}

@Resolver()
export class SocialResolver {
  constructor(private gatewayService: GatewayService) {}

  @Query(() => [Connection])
  async connections(@Args('userId') userId: string) {
    const serviceUrl = this.gatewayService.getServiceUrl('social');
    return this.gatewayService.proxyToService(`${serviceUrl}/social/connections/${userId}`, 'GET');
  }

  @Query(() => [SharedGoal])
  async sharedGoals(@Args('userId') userId: string) {
    const serviceUrl = this.gatewayService.getServiceUrl('social');
    return this.gatewayService.proxyToService(`${serviceUrl}/social/goals/${userId}`, 'GET');
  }

  @Mutation(() => Connection)
  async sendConnectionRequest(@Args('userId') userId: string, @Args('targetUserId') targetUserId: string) {
    const serviceUrl = this.gatewayService.getServiceUrl('social');
    return this.gatewayService.proxyToService(`${serviceUrl}/social/connections`, 'POST', {
      userId,
      targetUserId
    });
  }

  @Mutation(() => Boolean)
  async acceptConnection(@Args('connectionId') connectionId: string) {
    const serviceUrl = this.gatewayService.getServiceUrl('social');
    await this.gatewayService.proxyToService(`${serviceUrl}/social/connections/${connectionId}/accept`, 'POST');
    return true;
  }
}