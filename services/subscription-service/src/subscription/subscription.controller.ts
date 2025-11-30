import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, RawBodyRequest, Req } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

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
  async handleWebhook(@Req() req: RawBodyRequest<any>) {
    const event = req.body;
    return this.subscriptionService.handleWebhook(event);
  }
}