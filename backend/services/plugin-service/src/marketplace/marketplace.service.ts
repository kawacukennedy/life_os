import { Injectable, Logger } from "@nestjs/common";
import { PluginService } from "../plugins/plugin.service";
import { Plugin, PluginCategory } from "../plugins/plugin.entity";

export interface MarketplaceStats {
  totalPlugins: number;
  totalInstalls: number;
  totalDevelopers: number;
  categoryBreakdown: Record<PluginCategory, number>;
  trendingPlugins: Plugin[];
  newReleases: Plugin[];
}

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(private readonly pluginService: PluginService) {}

  async getMarketplaceStats(): Promise<MarketplaceStats> {
    try {
      // Get all published plugins
      const plugins = await this.pluginService.findAll({
        status: 'published' as any,
      });

      const totalPlugins = plugins.length;
      const totalInstalls = plugins.reduce((sum, plugin) => sum + plugin.installCount, 0);
      const totalDevelopers = new Set(plugins.map(p => p.authorId)).size;

      // Category breakdown
      const categoryBreakdown = plugins.reduce((acc, plugin) => {
        acc[plugin.category] = (acc[plugin.category] || 0) + 1;
        return acc;
      }, {} as Record<PluginCategory, number>);

      // Trending plugins (highest installs in last 30 days)
      const trendingPlugins = plugins
        .sort((a, b) => b.installCount - a.installCount)
        .slice(0, 10);

      // New releases (most recently published)
      const newReleases = plugins
        .filter(p => p.publishedAt)
        .sort((a, b) => b.publishedAt!.getTime() - a.publishedAt!.getTime())
        .slice(0, 10);

      return {
        totalPlugins,
        totalInstalls,
        totalDevelopers,
        categoryBreakdown,
        trendingPlugins,
        newReleases,
      };
    } catch (error) {
      this.logger.error("Failed to get marketplace stats", error);
      return {
        totalPlugins: 0,
        totalInstalls: 0,
        totalDevelopers: 0,
        categoryBreakdown: {} as Record<PluginCategory, number>,
        trendingPlugins: [],
        newReleases: [],
      };
    }
  }

  async getCategoryStats(category: PluginCategory): Promise<{
    totalPlugins: number;
    averageRating: number;
    totalInstalls: number;
    topPlugins: Plugin[];
  }> {
    try {
      const plugins = await this.pluginService.findAll({
        category,
        status: 'published' as any,
      });

      const totalPlugins = plugins.length;
      const totalInstalls = plugins.reduce((sum, plugin) => sum + plugin.installCount, 0);
      const averageRating = plugins.length > 0
        ? plugins.reduce((sum, plugin) => sum + Number(plugin.averageRating), 0) / plugins.length
        : 0;

      const topPlugins = plugins
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 5);

      return {
        totalPlugins,
        averageRating: Math.round(averageRating * 100) / 100,
        totalInstalls,
        topPlugins,
      };
    } catch (error) {
      this.logger.error(`Failed to get category stats for ${category}`, error);
      return {
        totalPlugins: 0,
        averageRating: 0,
        totalInstalls: 0,
        topPlugins: [],
      };
    }
  }

  async getDeveloperStats(developerId: string): Promise<{
    totalPlugins: number;
    totalInstalls: number;
    averageRating: number;
    plugins: Plugin[];
  }> {
    try {
      const plugins = await this.pluginService.findAll({
        authorId: developerId,
        status: 'published' as any,
      });

      const totalPlugins = plugins.length;
      const totalInstalls = plugins.reduce((sum, plugin) => sum + plugin.installCount, 0);
      const averageRating = plugins.length > 0
        ? plugins.reduce((sum, plugin) => sum + Number(plugin.averageRating), 0) / plugins.length
        : 0;

      return {
        totalPlugins,
        totalInstalls,
        averageRating: Math.round(averageRating * 100) / 100,
        plugins,
      };
    } catch (error) {
      this.logger.error(`Failed to get developer stats for ${developerId}`, error);
      return {
        totalPlugins: 0,
        totalInstalls: 0,
        averageRating: 0,
        plugins: [],
      };
    }
  }

  async getRecommendations(userId: string): Promise<{
    personalized: Plugin[];
    trending: Plugin[];
    similarUsers: Plugin[];
  }> {
    try {
      // Get user's installed plugins
      const userPlugins = await this.pluginService.getUserPlugins(userId);
      const installedCategories = new Set(
        userPlugins
          .filter(up => up.plugin)
          .map(up => up.plugin.category)
      );

      // Get all published plugins
      const allPlugins = await this.pluginService.findAll({
        status: 'published' as any,
      });

      // Personalized recommendations (same categories, not installed)
      const personalized = allPlugins
        .filter(plugin =>
          installedCategories.has(plugin.category) &&
          !userPlugins.some(up => up.pluginId === plugin.id)
        )
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 5);

      // Trending plugins
      const trending = allPlugins
        .sort((a, b) => b.installCount - a.installCount)
        .slice(0, 5);

      // For similar users, we'd need user behavior analysis
      // For now, return popular plugins from user's categories
      const similarUsers = allPlugins
        .filter(plugin => installedCategories.has(plugin.category))
        .sort((a, b) => b.installCount - a.installCount)
        .slice(0, 5);

      return {
        personalized,
        trending,
        similarUsers,
      };
    } catch (error) {
      this.logger.error(`Failed to get recommendations for ${userId}`, error);
      return {
        personalized: [],
        trending: [],
        similarUsers: [],
      };
    }
  }

  async validatePluginManifest(manifest: any): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Required fields
    if (!manifest.version) errors.push('version is required');
    if (!manifest.apiVersion) errors.push('apiVersion is required');
    if (!manifest.permissions || !Array.isArray(manifest.permissions)) {
      errors.push('permissions array is required');
    }
    if (!manifest.hooks || !Array.isArray(manifest.hooks)) {
      errors.push('hooks array is required');
    }
    if (!manifest.entryPoints || typeof manifest.entryPoints !== 'object') {
      errors.push('entryPoints object is required');
    }

    // Validate permissions
    if (manifest.permissions) {
      const validPermissions = [
        'read:user', 'write:user', 'read:tasks', 'write:tasks',
        'read:health', 'write:health', 'read:finance', 'write:finance',
        'read:calendar', 'write:calendar', 'notifications', 'storage'
      ];

      for (const permission of manifest.permissions) {
        if (!validPermissions.includes(permission)) {
          errors.push(`Invalid permission: ${permission}`);
        }
      }
    }

    // Validate hooks
    if (manifest.hooks) {
      const validHooks = [
        'onInstall', 'onUninstall', 'onEnable', 'onDisable',
        'onTaskCreate', 'onTaskUpdate', 'onHealthSync', 'onFinanceSync'
      ];

      for (const hook of manifest.hooks) {
        if (!validHooks.includes(hook)) {
          errors.push(`Invalid hook: ${hook}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}