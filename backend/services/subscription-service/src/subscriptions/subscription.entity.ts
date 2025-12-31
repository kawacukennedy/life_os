import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Plan } from "./plan.entity";
import { Payment } from "./payment.entity";

export enum SubscriptionStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  CANCELLED = "cancelled",
  PAST_DUE = "past_due",
  UNPAID = "unpaid",
  TRIALING = "trialing"
}

@Entity("subscriptions")
export class Subscription {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  userId: string;

  @ManyToOne(() => Plan)
  @JoinColumn({ name: "planId" })
  plan: Plan;

  @Column({ type: "uuid" })
  planId: string;

  @Column({
    type: "enum",
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE
  })
  status: SubscriptionStatus;

  @Column({ type: "timestamp", nullable: true })
  currentPeriodStart: Date;

  @Column({ type: "timestamp", nullable: true })
  currentPeriodEnd: Date;

  @Column({ type: "timestamp", nullable: true })
  trialEnd: Date;

  @Column({ type: "timestamp", nullable: true })
  cancelAtPeriodEnd: Date;

  @Column({ nullable: true })
  stripeSubscriptionId: string;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => Payment, payment => payment.subscription)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}