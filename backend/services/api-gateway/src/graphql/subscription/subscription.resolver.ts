import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { SubscriptionGraphQLService } from './subscription.service';
import {
  Subscription,
  SubscriptionTier,
  Invoice,
  UserTierLimits,
  CreateSubscriptionResponse,
  CheckoutSession,
  SubscriptionTierType
} from './subscription.types';

@Resolver()
export class SubscriptionResolver {
  constructor(private subscriptionService: SubscriptionGraphQLService) {}

  @Query(() => Subscription, { nullable: true })
  async getSubscription(@Args('userId') userId: string): Promise<Subscription | null> {
    return this.subscriptionService.getSubscription(userId);
  }

  @Query(() => [SubscriptionTier])
  async getSubscriptionTiers(): Promise<SubscriptionTier[]> {
    return this.subscriptionService.getTiers();
  }

  @Query(() => UserTierLimits)
  async getUserTierLimits(@Args('userId') userId: string): Promise<UserTierLimits> {
    return this.subscriptionService.getUserTierLimits(userId);
  }

  @Query(() => [Invoice])
  async getInvoices(@Args('userId') userId: string): Promise<Invoice[]> {
    return this.subscriptionService.getInvoices(userId);
  }

  @Mutation(() => CreateSubscriptionResponse)
  async createSubscription(
    @Args('userId') userId: string,
    @Args('priceId') priceId: string,
    @Args('paymentMethodId', { nullable: true }) paymentMethodId?: string,
  ): Promise<CreateSubscriptionResponse> {
    return this.subscriptionService.createSubscription(userId, priceId, paymentMethodId);
  }

  @Mutation(() => Subscription)
  async cancelSubscription(
    @Args('userId') userId: string,
    @Args('cancelAtPeriodEnd', { nullable: true }) cancelAtPeriodEnd?: boolean,
  ): Promise<Subscription> {
    return this.subscriptionService.cancelSubscription(userId, cancelAtPeriodEnd);
  }

  @Mutation(() => Subscription)
  async updatePaymentMethod(
    @Args('userId') userId: string,
    @Args('paymentMethodId') paymentMethodId: string,
  ): Promise<Subscription> {
    return this.subscriptionService.updatePaymentMethod(userId, paymentMethodId);
  }

  @Mutation(() => Subscription)
  async upgradeSubscription(
    @Args('userId') userId: string,
    @Args('newTierType') newTierType: SubscriptionTierType,
  ): Promise<Subscription> {
    return this.subscriptionService.upgradeSubscription(userId, newTierType);
  }

  @Mutation(() => CheckoutSession)
  async createCheckoutSession(
    @Args('userId') userId: string,
    @Args('customerId') customerId: string,
    @Args('priceId') priceId: string,
    @Args('successUrl') successUrl: string,
    @Args('cancelUrl') cancelUrl: string,
  ): Promise<CheckoutSession> {
    return this.subscriptionService.createCheckoutSession(userId, customerId, priceId, successUrl, cancelUrl);
  }
}