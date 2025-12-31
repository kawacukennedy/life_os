import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { UserPlugin } from "./user-plugin.entity";

export enum PluginCategory {
  PRODUCTIVITY = 'productivity',
  HEALTH = 'health',
  FINANCE = 'finance',
  SOCIAL = 'social',
  INTEGRATION = 'integration',
  UTILITY = 'utility',
  CUSTOMIZATION = 'customization',
}

export enum PluginStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
  DEPRECATED = 'deprecated',
}

@Entity('plugins')
export class Plugin {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  longDescription: string;

  @Column()
  version: string;

  @Column()
  authorId: string;

  @Column()
  authorName: string;

  @Column({
    type: 'enum',
    enum: PluginCategory,
  })
  category: PluginCategory;

  @Column({
    type: 'enum',
    enum: PluginStatus,
    default: PluginStatus.DRAFT,
  })
  status: PluginStatus;

  @Column({ type: 'json' })
  manifest: {
    version: string;
    apiVersion: string;
    permissions: string[];
    hooks: string[];
    settings: any[];
    entryPoints: {
      main?: string;
      settings?: string;
      background?: string;
    };
  };

  @Column({ type: 'json', nullable: true })
  screenshots: string[];

  @Column({ nullable: true })
  iconUrl: string;

  @Column({ nullable: true })
  bannerUrl: string;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ default: 0 })
  totalReviews: number;

  @Column({ default: 0 })
  installCount: number;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ type: 'json', nullable: true })
  pricing: {
    type: 'one-time' | 'subscription';
    amount: number;
    currency: string;
    interval?: 'month' | 'year';
  };

  @Column({ nullable: true })
  repositoryUrl: string;

  @Column({ nullable: true })
  documentationUrl: string;

  @Column({ nullable: true })
  supportUrl: string;

  @Column({ type: 'text', nullable: true })
  changelog: string;

  @Column({ type: 'json', nullable: true })
  compatibility: {
    minLifeOSVersion: string;
    maxLifeOSVersion?: string;
    requiredPermissions: string[];
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => UserPlugin, userPlugin => userPlugin.plugin)
  userPlugins: UserPlugin[];
}