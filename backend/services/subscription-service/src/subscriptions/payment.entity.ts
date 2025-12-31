import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Subscription } from "./subscription.entity";

export enum PaymentStatus {
  PENDING = "pending",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded"
}

export enum PaymentMethod {
  CARD = "card",
  BANK_ACCOUNT = "bank_account",
  PAYPAL = "paypal"
}

@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Subscription)
  @JoinColumn({ name: "subscriptionId" })
  subscription: Subscription;

  @Column({ type: "uuid" })
  subscriptionId: string;

  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3, default: "USD" })
  currency: string;

  @Column({
    type: "enum",
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  status: PaymentStatus;

  @Column({
    type: "enum",
    enum: PaymentMethod,
    default: PaymentMethod.CARD
  })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  stripePaymentIntentId: string;

  @Column({ nullable: true })
  stripeChargeId: string;

  @Column({ type: "text", nullable: true })
  failureReason: string;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, any>;

  @Column({ type: "timestamp", nullable: true })
  paidAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}