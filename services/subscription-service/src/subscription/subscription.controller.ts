import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, RawBodyRequest, Req } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createSubscription(
    @Body() body: { priceId: string; paymentMethodId?: string },
    @Req() req: any,
  ) {
    return this.subscriptionService.createSubscription(
      req.user.id,
      body.priceId,
      body.paymentMethodId,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getSubscription(@Req() req: any) {
    return this.subscriptionService.getSubscription(req.user.id);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  async cancelSubscription(
    @Body() body: { cancelAtPeriodEnd?: boolean },
    @Req() req: any,
  ) {
    return this.subscriptionService.cancelSubscription(
      req.user.id,
      body.cancelAtPeriodEnd ?? true,
    );
  }

  @Put('payment-method')
  @UseGuards(JwtAuthGuard)
  async updatePaymentMethod(
    @Body() body: { paymentMethodId: string },
    @Req() req: any,
  ) {
    return this.subscriptionService.updatePaymentMethod(
      req.user.id,
      body.paymentMethodId,
    );
  }

  @Get('invoices')
  @UseGuards(JwtAuthGuard)
  async getInvoices(@Req() req: any) {
    return this.subscriptionService.getInvoices(req.user.id);
  }

  @Post('webhook')
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    return this.subscriptionService.handleWebhook(req);
  }

  // Stripe-specific endpoints
  @Post('stripe/customer')
  @UseGuards(JwtAuthGuard)
  async createStripeCustomer(
    @Body() body: { email: string; name?: string },
    @Req() req: any,
  ) {
    return this.stripeService.createCustomer(req.user.id, body.email, body.name);
  }

  @Post('stripe/subscription')
  @UseGuards(JwtAuthGuard)
  async createStripeSubscription(
    @Body() body: { customerId: string; priceId: string },
    @Req() req: any,
  ) {
    return this.stripeService.createSubscription(body.customerId, body.priceId, req.user.id);
  }

  @Post('stripe/checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckoutSession(
    @Body() body: { customerId: string; priceId: string; successUrl: string; cancelUrl: string },
  ) {
    return this.stripeService.createCheckoutSession(
      body.customerId,
      body.priceId,
      body.successUrl,
      body.cancelUrl,
    );
  }

  @Get('stripe/prices')
  async getStripePrices() {
    return this.stripeService.getPrices();
  }

  @Post('stripe/webhook')
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: any,
  ) {
    const signature = req.headers['stripe-signature'] as string;
    return this.stripeService.handleWebhook(req.rawBody, signature);
  }

  // Tier management endpoints
  @Post('tiers')
  async createTier(@Body() body: Partial<SubscriptionTier>) {
    return this.subscriptionService.createTier(body);
  }

  @Get('tiers')
  async getTiers() {
    return this.subscriptionService.getTiers();
  }

  @Get('tiers/:type')
  async getTierByType(@Param('type') type: string) {
    return this.subscriptionService.getTierByType(type as any);
  }

  @Put('tiers/:id')
  async updateTier(@Param('id') id: string, @Body() body: Partial<SubscriptionTier>) {
    return this.subscriptionService.updateTier(id, body);
  }

  @Get('user/limits')
  @UseGuards(JwtAuthGuard)
  async getUserTierLimits(@Req() req: any) {
    return this.subscriptionService.getUserTierLimits(req.user.id);
  }

  @Post('upgrade')
  @UseGuards(JwtAuthGuard)
  async upgradeSubscription(
    @Body() body: { newTierType: string },
    @Req() req: any,
  ) {
    return this.subscriptionService.upgradeSubscription(req.user.id, body.newTierType as any);
  }
}