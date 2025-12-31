import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Subscription } from "./subscription.entity";

export enum PlanType {
  FREE = "free",
  PREMIUM = "premium",
  ENTERPRISE = "enterprise"
}

export enum BillingInterval {
  MONTHLY = "monthly",
  YEARLY = "yearly"
}

@Entity("plans")
export class Plan {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({
    type: "enum",
    enum: PlanType,
    default: PlanType.FREE
  })
  type: PlanType;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @Column({
    type: "enum",
    enum: BillingInterval,
    default: BillingInterval.MONTHLY
  })
  billingInterval: BillingInterval;

  @Column({ type: "jsonb", nullable: true })
  features: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: "int", default: 0 })
  maxUsers: number;

  @Column({ type: "int", default: 0 })
  maxProjects: number;

  @Column({ type: "int", default: 0 })
  storageLimitGb: number;

  @Column({ nullable: true })
  stripePriceId: string;

  @OneToMany(() => Subscription, subscription => subscription.plan)
  subscriptions: Subscription[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}