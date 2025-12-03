import { ObjectType, Field, ID, Float, registerEnumType } from '@nestjs/graphql';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  TRIALING = 'trialing',
}

export enum SubscriptionTierType {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

registerEnumType(SubscriptionStatus, {
  name: 'SubscriptionStatus',
});

registerEnumType(SubscriptionTierType, {
  name: 'SubscriptionTierType',
});

@ObjectType()
export class SubscriptionTier {
  @Field(() => ID)
  id: string;

  @Field(() => SubscriptionTierType)
  type: SubscriptionTierType;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => Float)
  price: number;

  @Field()
  currency: string;

  @Field()
  interval: string; // 'month' or 'year'

  @Field(() => String)
  features: any; // JSON array of features

  @Field(() => String)
  limits: any; // JSON object with limits

  @Field()
  isActive: boolean;

  @Field()
  stripePriceId: string;
}

@ObjectType()
export class Subscription {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field(() => SubscriptionTier)
  tier: SubscriptionTier;

  @Field(() => SubscriptionStatus)
  status: SubscriptionStatus;

  @Field()
  currentPeriodStart: Date;

  @Field()
  currentPeriodEnd: Date;

  @Field({ nullable: true })
  canceledAt?: Date;

  @Field({ nullable: true })
  cancelAtPeriodEnd?: boolean;

  @Field()
  stripeSubscriptionId: string;

  @Field()
  stripeCustomerId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class Invoice {
  @Field(() => ID)
  id: string;

  @Field()
  subscriptionId: string;

  @Field(() => Float)
  amount: number;

  @Field()
  currency: string;

  @Field(() => SubscriptionStatus)
  status: string;

  @Field()
  invoicePdf: string;

  @Field()
  hostedInvoiceUrl: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class UserTierLimits {
  @Field(() => SubscriptionTierType)
  tierType: SubscriptionTierType;

  @Field(() => String)
  limits: any;

  @Field(() => String)
  features: any;
}

@ObjectType()
export class CreateSubscriptionResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => Subscription, { nullable: true })
  subscription?: Subscription;

  @Field({ nullable: true })
  clientSecret?: string;
}

@ObjectType()
export class CheckoutSession {
  @Field()
  id: string;

  @Field()
  url: string;
}