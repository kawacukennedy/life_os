import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TierType {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

@Entity()
export class SubscriptionTier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TierType,
    unique: true,
  })
  type: TierType;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column()
  currency: string;

  @Column()
  interval: string; // 'month' or 'year'

  @Column({ type: 'json' })
  features: {
    maxTasks: number;
    maxIntegrations: number;
    aiRequestsPerMonth: number;
    storageLimit: number; // in GB
    supportLevel: 'basic' | 'priority' | 'dedicated';
    customIntegrations: boolean;
    analytics: boolean;
    teamCollaboration: boolean;
    apiAccess: boolean;
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  stripePriceIds: {
    monthly: string;
    yearly: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}