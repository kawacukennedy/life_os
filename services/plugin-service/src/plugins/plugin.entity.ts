import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PluginCategory {
  PRODUCTIVITY = 'productivity',
  HEALTH = 'health',
  FINANCE = 'finance',
  SOCIAL = 'social',
  COMMUNICATION = 'communication',
  UTILITIES = 'utilities',
}

export enum PluginStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  DEPRECATED = 'deprecated',
  SUSPENDED = 'suspended',
}

@Entity()
export class Plugin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  version: string;

  @Column()
  author: string;

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

  @Column({ type: 'text', nullable: true })
  iconUrl: string;

  @Column({ type: 'text', nullable: true })
  documentationUrl: string;

  @Column({ type: 'json' })
  configurationSchema: any; // JSON Schema for plugin configuration

  @Column({ type: 'json' })
  capabilities: any; // What the plugin can do

  @Column({ type: 'json', nullable: true })
  pricing: any; // Pricing tiers

  @Column({ default: 0 })
  installCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ type: 'text', nullable: true })
  repositoryUrl: string;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}