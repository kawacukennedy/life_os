import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionService {
  private prisma = new PrismaClient();
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
  }

  async createSubscription(userId: string, priceId: string, paymentMethodId?: string) {
    // Get or create Stripe customer
    let customer = await this.getOrCreateStripeCustomer(userId);

    // Attach payment method if provided
    if (paymentMethodId) {
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });
      await this.stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Create subscription
    const subscription = await this.stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    // Store subscription in database
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

    return {
      subscription: dbSubscription,
      clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
    };
  }

  async cancelSubscription(userId: string, cancelAtPeriodEnd = true) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: 'active' },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    if (cancelAtPeriodEnd) {
      await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { cancelAtPeriodEnd: true },
      });
    } else {
      await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'canceled' },
      });
    }

    return { message: 'Subscription canceled successfully' };
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
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
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
}