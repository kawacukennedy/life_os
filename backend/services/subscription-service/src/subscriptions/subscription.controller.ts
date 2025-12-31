import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, BadRequestException } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { SubscriptionService } from "./subscription.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";
import { UpdateSubscriptionDto } from "./dto/update-subscription.dto";
import { CreatePlanDto } from "./dto/create-plan.dto";
import { UpdatePlanDto } from "./dto/update-plan.dto";
import { CreatePaymentDto } from "./dto/create-payment.dto";

@ApiTags("subscriptions")
@ApiBearerAuth()
@Controller("subscriptions")
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // Plan endpoints
  @Post("plans")
  @ApiOperation({ summary: "Create a new subscription plan" })
  @ApiResponse({ status: 201, description: "Plan created successfully" })
  createPlan(@Body() createPlanDto: CreatePlanDto) {
    return this.subscriptionService.createPlan(createPlanDto);
  }

  @Get("plans")
  @ApiOperation({ summary: "Get all active plans" })
  findAllPlans() {
    return this.subscriptionService.findAllPlans();
  }

  @Get("plans/:id")
  @ApiOperation({ summary: "Get plan by ID" })
  findPlanById(@Param("id") id: string) {
    return this.subscriptionService.findPlanById(id);
  }

  @Put("plans/:id")
  @ApiOperation({ summary: "Update plan" })
  updatePlan(@Param("id") id: string, @Body() updatePlanDto: UpdatePlanDto) {
    return this.subscriptionService.updatePlan(id, updatePlanDto);
  }

  @Delete("plans/:id")
  @ApiOperation({ summary: "Delete plan (soft delete)" })
  deletePlan(@Param("id") id: string) {
    return this.subscriptionService.deletePlan(id);
  }

  // Subscription endpoints
  @Post()
  @ApiOperation({ summary: "Create a new subscription" })
  createSubscription(@Request() req, @Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionService.createSubscription(req.user.userId, createSubscriptionDto);
  }

  @Get("my")
  @ApiOperation({ summary: "Get current user's subscription" })
  getMySubscription(@Request() req) {
    return this.subscriptionService.findUserSubscription(req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: "Get all subscriptions (admin)" })
  findAllSubscriptions() {
    return this.subscriptionService.findAllSubscriptions();
  }

  @Put(":id")
  @ApiOperation({ summary: "Update subscription" })
  updateSubscription(@Param("id") id: string, @Body() updateSubscriptionDto: UpdateSubscriptionDto) {
    return this.subscriptionService.updateSubscription(id, updateSubscriptionDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Cancel subscription" })
  cancelSubscription(@Param("id") id: string) {
    return this.subscriptionService.cancelSubscription(id);
  }

  // Payment endpoints
  @Post("payments")
  @ApiOperation({ summary: "Create a payment" })
  createPayment(@Request() req, @Body() createPaymentDto: CreatePaymentDto) {
    return this.subscriptionService.createPayment(req.user.userId, createPaymentDto);
  }

  @Get("payments/my")
  @ApiOperation({ summary: "Get current user's payments" })
  getMyPayments(@Request() req) {
    return this.subscriptionService.findUserPayments(req.user.userId);
  }

  @Post("webhook/stripe")
  @ApiOperation({ summary: "Handle Stripe webhooks" })
  async handleStripeWebhook(@Body() event: any) {
    await this.subscriptionService.handleStripeWebhook(event);
    return { received: true };
  }
}