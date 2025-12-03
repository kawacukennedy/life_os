import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { GatewayService } from '../gateway.service';

export class Subscription {
  id: string;
  userId: string;
  plan: string;
  status: string;
  billingCustomerId?: string;
  startedAt: string;
  endsAt?: string;
}

@Resolver(() => Subscription)
export class SubscriptionResolver {
  constructor(private gatewayService: GatewayService) {}

  @Query(() => Subscription)
  async subscription(@Args('userId') userId: string) {
    const serviceUrl = this.gatewayService.getServiceUrl('subscription');
    return this.gatewayService.proxyToService(`${serviceUrl}/subscriptions/${userId}`, 'GET');
  }

  @Mutation(() => Subscription)
  async createSubscription(@Args('userId') userId: string, @Args('plan') plan: string) {
    const serviceUrl = this.gatewayService.getServiceUrl('subscription');
    return this.gatewayService.proxyToService(`${serviceUrl}/subscriptions`, 'POST', {
      userId,
      plan
    });
  }

  @Mutation(() => Subscription)
  async updateSubscription(@Args('userId') userId: string, @Args('plan') plan: string) {
    const serviceUrl = this.gatewayService.getServiceUrl('subscription');
    return this.gatewayService.proxyToService(`${serviceUrl}/subscriptions/${userId}`, 'PATCH', {
      plan
    });
  }

  @Mutation(() => Boolean)
  async cancelSubscription(@Args('userId') userId: string) {
    const serviceUrl = this.gatewayService.getServiceUrl('subscription');
    await this.gatewayService.proxyToService(`${serviceUrl}/subscriptions/${userId}/cancel`, 'POST');
    return true;
  }
}