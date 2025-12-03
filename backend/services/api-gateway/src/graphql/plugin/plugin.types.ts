import { ObjectType, Field, ID, Float, registerEnumType } from '@nestjs/graphql';

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

export enum InstallationStatus {
  INSTALLING = 'installing',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  UNINSTALLED = 'uninstalled',
}

registerEnumType(PluginCategory, {
  name: 'PluginCategory',
});

registerEnumType(PluginStatus, {
  name: 'PluginStatus',
});

registerEnumType(InstallationStatus, {
  name: 'InstallationStatus',
});

@ObjectType()
export class Plugin {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field()
  description: string;

  @Field()
  version: string;

  @Field()
  author: string;

  @Field(() => PluginCategory)
  category: PluginCategory;

  @Field(() => PluginStatus)
  status: PluginStatus;

  @Field({ nullable: true })
  iconUrl?: string;

  @Field({ nullable: true })
  documentationUrl?: string;

  @Field(() => String)
  configurationSchema: any;

  @Field(() => String)
  capabilities: any;

  @Field(() => String, { nullable: true })
  pricing?: any;

  @Field(() => Float)
  installCount: number;

  @Field(() => Float)
  averageRating: number;

  @Field()
  reviewCount: number;

  @Field({ nullable: true })
  repositoryUrl?: string;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class UserPlugin {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  pluginId: string;

  @Field(() => InstallationStatus)
  status: InstallationStatus;

  @Field(() => String, { nullable: true })
  configuration?: any;

  @Field(() => String, { nullable: true })
  credentials?: any;

  @Field({ nullable: true })
  lastSyncAt?: Date;

  @Field(() => String, { nullable: true })
  syncStatus?: any;

  @Field()
  installedAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => Plugin, { nullable: true })
  plugin?: Plugin;
}

@ObjectType()
export class PluginStats {
  @Field()
  totalPlugins: number;

  @Field()
  totalInstallations: number;

  @Field(() => [CategoryStats])
  categoryBreakdown: CategoryStats[];
}

@ObjectType()
export class CategoryStats {
  @Field()
  category: string;

  @Field()
  count: number;
}

@ObjectType()
export class InstallPluginResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => UserPlugin, { nullable: true })
  userPlugin?: UserPlugin;
}