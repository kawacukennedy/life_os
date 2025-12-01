import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { MonitoringService } from './monitoring.service';
import { LoggingService } from './logging.service';
import { SubscriptionTier, TierType } from './tier.entity';

@Injectable()
export class SubscriptionService {
  private prisma = new PrismaClient();
  private stripe: Stripe;

  constructor(
    @InjectRepository(SubscriptionTier)
    private tierRepository: Repository<SubscriptionTier>,
    private readonly monitoringService: MonitoringService,
    private readonly loggingService: LoggingService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
  }

  async createSubscription(userId: string, priceId: string, paymentMethodId?: string) {
    const startTime = Date.now();
    try {
      // Get or create Stripe customer
      const customerStartTime = Date.now();
      let customer = await this.getOrCreateStripeCustomer(userId);
      this.monitoringService.recordStripeApiCall('customers_retrieve_or_create', 'POST', Date.now() - customerStartTime, true);

      // Attach payment method if provided
      if (paymentMethodId) {
        const attachStartTime = Date.now();
        await this.stripe.paymentMethods.attach(paymentMethodId, {
          customer: customer.id,
        });
        this.monitoringService.recordStripeApiCall('payment_methods_attach', 'POST', Date.now() - attachStartTime, true);

        const updateStartTime = Date.now();
        await this.stripe.customers.update(customer.id, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
        this.monitoringService.recordStripeApiCall('customers_update', 'POST', Date.now() - updateStartTime, true);
      }

      // Create subscription
      const subStartTime = Date.now();
      const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });
      this.monitoringService.recordStripeApiCall('subscriptions_create', 'POST', Date.now() - subStartTime, true);

      // Store subscription in database
      const dbStartTime = Date.now();
      const dbSubscription = await this.prisma.subscription.create({
        data: {
          userId,
          plan: this.getPlanFromPriceId(priceId),
          status: subscription.status,
          stripeCustomerId: customer.id,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          billingCycle: this.getBillingCycleFromPriceId(priceId),
          amount: subscription.items.data[0].price.unit_amount,
          currency: subscription.items.data[0].price.currency,
        },
      });
      this.monitoringService.recordDbQuery('create', 'subscription', Date.now() - dbStartTime);

      this.monitoringService.recordSubscriptionEvent('subscription_created', 'pending');
      this.loggingService.logSubscriptionEvent('subscription_created', dbSubscription.id, userId, { plan: dbSubscription.plan, priceId });

      return {
        subscription: dbSubscription,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      };
    } catch (error) {
      this.monitoringService.recordSubscriptionEvent('subscription_creation_failed', 'error');
      this.loggingService.logError(error, 'createSubscription', userId);
      throw error;
    }
  }

  async cancelSubscription(userId: string, cancelAtPeriodEnd = true) {
    const startTime = Date.now();
    try {
      const dbStartTime = Date.now();
      const subscription = await this.prisma.subscription.findFirst({
        where: { userId, status: 'active' },
      });
      this.monitoringService.recordDbQuery('findFirst', 'subscription', Date.now() - dbStartTime);

      if (!subscription?.stripeSubscriptionId) {
        this.loggingService.logSecurityEvent('cancel_subscription_not_found', { userId });
        throw new Error('No active subscription found');
      }

      if (cancelAtPeriodEnd) {
        const stripeStartTime = Date.now();
        await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
        this.monitoringService.recordStripeApiCall('subscriptions_update', 'POST', Date.now() - stripeStartTime, true);

        const dbUpdateStartTime = Date.now();
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { cancelAtPeriodEnd: true },
        });
        this.monitoringService.recordDbQuery('update', 'subscription', Date.now() - dbUpdateStartTime);
      } else {
        const stripeStartTime = Date.now();
        await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        this.monitoringService.recordStripeApiCall('subscriptions_cancel', 'DELETE', Date.now() - stripeStartTime, true);

        const dbUpdateStartTime = Date.now();
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'canceled' },
        });
        this.monitoringService.recordDbQuery('update', 'subscription', Date.now() - dbUpdateStartTime);
      }

      this.monitoringService.recordSubscriptionEvent('subscription_cancelled', cancelAtPeriodEnd ? 'scheduled' : 'immediate');
      this.loggingService.logSubscriptionEvent('subscription_cancelled', subscription.id, userId, { cancelAtPeriodEnd });

      return { message: 'Subscription canceled successfully' };
    } catch (error) {
      this.monitoringService.recordSubscriptionEvent('subscription_cancellation_failed', 'error');
      this.loggingService.logError(error, 'cancelSubscription', userId);
      throw error;
    }
  }

  async getSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePaymentMethod(userId: string, paymentMethodId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId },
    });

    if (!subscription?.stripeCustomerId) {
      throw new Error('No subscription found');
    }

    // Attach new payment method
    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: subscription.stripeCustomerId,
    });

    // Update customer's default payment method
    await this.stripe.customers.update(subscription.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Store payment method in database
    const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);
    await this.prisma.paymentMethod.upsert({
      where: { stripePaymentMethodId: paymentMethodId },
      update: {
        isDefault: true,
      },
      create: {
        userId,
        stripePaymentMethodId: paymentMethodId,
        type: paymentMethod.type,
        last4: (paymentMethod as any).card?.last4,
        brand: (paymentMethod as any).card?.brand,
        expiryMonth: (paymentMethod as any).card?.exp_month,
        expiryYear: (paymentMethod as any).card?.exp_year,
        isDefault: true,
      },
    });

    return { message: 'Payment method updated successfully' };
  }

  async getInvoices(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId },
    });

    if (!subscription?.stripeCustomerId) {
      return [];
    }

    const invoices = await this.stripe.invoices.list({
      customer: subscription.stripeCustomerId,
    });

    // Store invoices in database
    for (const invoice of invoices.data) {
      await this.prisma.invoice.upsert({
        where: { stripeInvoiceId: invoice.id },
        update: {},
        create: {
          userId,
          subscriptionId: subscription.id,
          stripeInvoiceId: invoice.id,
          amount: invoice.amount_due,
          currency: invoice.currency,
          status: invoice.status || 'draft',
          invoicePdf: invoice.invoice_pdf || undefined,
          hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
          periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : undefined,
          periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : undefined,
        },
      });
    }

    return this.prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async handleWebhook(event: Stripe.Event) {
    try {
      this.loggingService.logSubscriptionEvent('webhook_received', event.id, undefined, { type: event.type });

      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          this.monitoringService.recordSubscriptionEvent('payment_succeeded', 'completed');
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          this.monitoringService.recordSubscriptionEvent('payment_failed', 'failed');
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          this.monitoringService.recordSubscriptionEvent('subscription_updated', 'updated');
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          this.monitoringService.recordSubscriptionEvent('subscription_deleted', 'cancelled');
          break;
      }

      this.loggingService.logSubscriptionEvent('webhook_processed', event.id, undefined, { type: event.type, success: true });
    } catch (error) {
      this.loggingService.logError(error, 'handleWebhook');
      this.monitoringService.recordSubscriptionEvent('webhook_processing_failed', 'error');
      throw error;
    }
  }

  private async getOrCreateStripeCustomer(userId: string) {
    // First check if we already have a customer ID
    const existingSub = await this.prisma.subscription.findFirst({
      where: { userId },
    });

    if (existingSub?.stripeCustomerId) {
      return await this.stripe.customers.retrieve(existingSub.stripeCustomerId);
    }

    // Get user details (assuming we have a way to get user info)
    // For now, create with minimal info
    const customer = await this.stripe.customers.create({
      metadata: { userId },
    });

    return customer;
  }

  private getPlanFromPriceId(priceId: string): string {
    // Map price IDs to plans - this should be configurable
    const planMap: { [key: string]: string } = {
      'price_premium_monthly': 'premium',
      'price_premium_yearly': 'premium',
      'price_enterprise_monthly': 'enterprise',
      'price_enterprise_yearly': 'enterprise',
    };
    return planMap[priceId] || 'premium';
  }

  private getBillingCycleFromPriceId(priceId: string): string {
    return priceId.includes('yearly') ? 'yearly' : 'monthly';
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    // Update subscription status
    if (invoice.subscription) {
      await this.prisma.subscription.updateMany({
        where: { stripeSubscriptionId: invoice.subscription as string },
        data: { status: 'active' },
      });
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    // Mark subscription as past due
    if (invoice.subscription) {
      await this.prisma.subscription.updateMany({
        where: { stripeSubscriptionId: invoice.subscription as string },
        data: { status: 'past_due' },
      });
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: { status: 'canceled' },
    });
  }

  // Tier management methods
  async createTier(tierData: Partial<SubscriptionTier>): Promise<SubscriptionTier> {
    const tier = this.tierRepository.create(tierData);
    return this.tierRepository.save(tier);
  }

  async getTiers(): Promise<SubscriptionTier[]> {
    return this.tierRepository.find({
      where: { isActive: true },
      order: { price: 'ASC' },
    });
  }

  async getTierByType(type: TierType): Promise<SubscriptionTier> {
    const tier = await this.tierRepository.findOne({ where: { type, isActive: true } });
    if (!tier) {
      throw new Error('Tier not found');
    }
    return tier;
  }

  async updateTier(id: string, updateData: Partial<SubscriptionTier>): Promise<SubscriptionTier> {
    await this.tierRepository.update(id, updateData);
    return this.tierRepository.findOne({ where: { id } });
  }

  async getUserTierLimits(userId: string): Promise<any> {
    // Get user's current subscription
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: 'active' },
    });

    if (!subscription) {
      // Return free tier limits
      const freeTier = await this.getTierByType(TierType.FREE);
      return freeTier.features;
    }

    // Map plan to tier type
    const tierType = this.mapPlanToTierType(subscription.plan);
    const tier = await this.getTierByType(tierType);

    return tier.features;
  }

  async checkUserLimits(userId: string, resource: string, currentUsage: number): Promise<boolean> {
    const limits = await this.getUserTierLimits(userId);
    const limit = limits[resource];

    if (limit === undefined) return true; // No limit defined
    return currentUsage < limit;
  }

  private mapPlanToTierType(plan: string): TierType {
    const planMap = {
      'free': TierType.FREE,
      'basic': TierType.BASIC,
      'premium': TierType.PRO,
      'enterprise': TierType.ENTERPRISE,
    };
    return planMap[plan] || TierType.FREE;
  }

  async upgradeSubscription(userId: string, newTierType: TierType): Promise<any> {
    const currentSub = await this.prisma.subscription.findFirst({
      where: { userId, status: 'active' },
    });

    if (!currentSub) {
      throw new Error('No active subscription found');
    }

    const newTier = await this.getTierByType(newTierType);
    const stripePriceId = newTier.stripePriceIds?.monthly; // Default to monthly

    if (!stripePriceId) {
      throw new Error('No Stripe price configured for this tier');
    }

    // Update subscription in Stripe
    const subscription = await this.stripe.subscriptions.retrieve(currentSub.stripeSubscriptionId!);
    await this.stripe.subscriptions.update(currentSub.stripeSubscriptionId!, {
      items: [{
        id: subscription.items.data[0].id,
        price: stripePriceId,
      }],
      proration_behavior: 'create_prorations',
    });

    // Update local record
    await this.prisma.subscription.update({
      where: { id: currentSub.id },
      data: { plan: newTierType },
    });

    return { success: true, newTier: newTierType };
  }
}