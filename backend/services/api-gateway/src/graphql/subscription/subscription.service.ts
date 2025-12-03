import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SubscriptionGraphQLService {
  constructor(private httpService: HttpService) {}

  async getSubscription(userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:3009'}/subscription`, {
          headers: { 'x-user-id': userId },
        })
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch subscription');
    }
  }

  async createSubscription(userId: string, priceId: string, paymentMethodId?: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:3009'}/subscription/create`, {
          priceId,
          paymentMethodId,
        }, {
          headers: { 'x-user-id': userId },
        })
      );
      return {
        success: true,
        message: 'Subscription created successfully',
        subscription: response.data.subscription,
        clientSecret: response.data.clientSecret,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create subscription',
      };
    }
  }

  async cancelSubscription(userId: string, cancelAtPeriodEnd?: boolean) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:3009'}/subscription/cancel`, {
          cancelAtPeriodEnd,
        }, {
          headers: { 'x-user-id': userId },
        })
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to cancel subscription');
    }
  }

  async updatePaymentMethod(userId: string, paymentMethodId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.put(`${process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:3009'}/subscription/payment-method`, {
          paymentMethodId,
        }, {
          headers: { 'x-user-id': userId },
        })
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to update payment method');
    }
  }

  async getInvoices(userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:3009'}/subscription/invoices`, {
          headers: { 'x-user-id': userId },
        })
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch invoices');
    }
  }

  async getTiers() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:3009'}/subscription/tiers`)
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch subscription tiers');
    }
  }

  async getUserTierLimits(userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:3009'}/subscription/user/limits`, {
          headers: { 'x-user-id': userId },
        })
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch user tier limits');
    }
  }

  async upgradeSubscription(userId: string, newTierType: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:3009'}/subscription/upgrade`, {
          newTierType,
        }, {
          headers: { 'x-user-id': userId },
        })
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to upgrade subscription');
    }
  }

  async createCheckoutSession(userId: string, customerId: string, priceId: string, successUrl: string, cancelUrl: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:3009'}/subscription/stripe/checkout`, {
          customerId,
          priceId,
          successUrl,
          cancelUrl,
        }, {
          headers: { 'x-user-id': userId },
        })
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to create checkout session');
    }
  }
}