import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Subscription, SubscriptionStatus } from "./subscription.entity";
import { Plan } from "./plan.entity";
import { Payment, PaymentStatus } from "./payment.entity";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";
import { UpdateSubscriptionDto } from "./dto/update-subscription.dto";
import { CreatePlanDto } from "./dto/create-plan.dto";
import { UpdatePlanDto } from "./dto/update-plan.dto";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import Stripe from "stripe";

@Injectable()
export class SubscriptionService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2023-10-16",
    });
  }

  // Plan management
  async createPlan(createPlanDto: CreatePlanDto): Promise<Plan> {
    const plan = this.planRepository.create(createPlanDto);
    return this.planRepository.save(plan);
  }

  async findAllPlans(): Promise<Plan[]> {
    return this.planRepository.find({ where: { isActive: true } });
  }

  async findPlanById(id: string): Promise<Plan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException("Plan not found");
    }
    return plan;
  }

  async updatePlan(id: string, updatePlanDto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.findPlanById(id);
    Object.assign(plan, updatePlanDto);
    return this.planRepository.save(plan);
  }

  async deletePlan(id: string): Promise<void> {
    const plan = await this.findPlanById(id);
    plan.isActive = false;
    await this.planRepository.save(plan);
  }

  // Subscription management
  async createSubscription(userId: string, createSubscriptionDto: CreateSubscriptionDto): Promise<Subscription> {
    const plan = await this.findPlanById(createSubscriptionDto.planId);

    // Check if user already has an active subscription
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE }
    });

    if (existingSubscription) {
      throw new BadRequestException("User already has an active subscription");
    }

    const subscription = this.subscriptionRepository.create({
      userId,
      planId: plan.id,
      plan,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      metadata: createSubscriptionDto.metadata,
    });

    return this.subscriptionRepository.save(subscription);
  }

  async findUserSubscription(userId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { userId },
      relations: ["plan"],
      order: { createdAt: "DESC" }
    });
  }

  async findAllSubscriptions(): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      relations: ["plan"],
      order: { createdAt: "DESC" }
    });
  }

  async updateSubscription(id: string, updateSubscriptionDto: UpdateSubscriptionDto): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({ where: { id } });
    if (!subscription) {
      throw new NotFoundException("Subscription not found");
    }

    Object.assign(subscription, updateSubscriptionDto);
    return this.subscriptionRepository.save(subscription);
  }

  async cancelSubscription(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({ where: { id } });
    if (!subscription) {
      throw new NotFoundException("Subscription not found");
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelAtPeriodEnd = new Date();
    return this.subscriptionRepository.save(subscription);
  }

  // Payment management
  async createPayment(userId: string, createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: createPaymentDto.subscriptionId, userId }
    });

    if (!subscription) {
      throw new NotFoundException("Subscription not found");
    }

    const payment = this.paymentRepository.create({
      subscriptionId: createPaymentDto.subscriptionId,
      subscription,
      userId,
      amount: createPaymentDto.amount,
      currency: createPaymentDto.currency || "USD",
      paymentMethod: createPaymentDto.paymentMethod,
      status: PaymentStatus.PENDING,
      metadata: createPaymentDto.metadata,
    });

    return this.paymentRepository.save(payment);
  }

  async findUserPayments(userId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { userId },
      relations: ["subscription"],
      order: { createdAt: "DESC" }
    });
  }

  async processStripePayment(paymentId: string, stripePaymentIntentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundException("Payment not found");
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(stripePaymentIntentId);

      if (paymentIntent.status === "succeeded") {
        payment.status = PaymentStatus.SUCCEEDED;
        payment.stripeChargeId = paymentIntent.charges.data[0]?.id;
        payment.paidAt = new Date();
      } else if (paymentIntent.status === "failed") {
        payment.status = PaymentStatus.FAILED;
        payment.failureReason = paymentIntent.last_payment_error?.message;
      }

      return this.paymentRepository.save(payment);
    } catch (error) {
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = error.message;
      return this.paymentRepository.save(payment);
    }
  }

  // Webhook handling
  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // Handle successful payment
        break;
      case "invoice.payment_succeeded":
        const invoice = event.data.object as Stripe.Invoice;
        // Handle successful invoice payment
        break;
      case "customer.subscription.deleted":
        const subscription = event.data.object as Stripe.Subscription;
        // Handle subscription cancellation
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }
}