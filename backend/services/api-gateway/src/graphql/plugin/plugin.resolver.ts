import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { PluginGraphQLService } from './plugin.service';
import {
  Plugin,
  UserPlugin,
  PluginStats,
  InstallPluginResponse,
  PluginCategory,
  PluginStatus
} from './plugin.types';

@Resolver()
export class PluginResolver {
  constructor(private pluginService: PluginGraphQLService) {}

  @Query(() => [Plugin])
  async getPlugins(
    @Args('category', { type: () => PluginCategory, nullable: true }) category?: PluginCategory,
    @Args('status', { type: () => PluginStatus, nullable: true }) status?: PluginStatus,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<Plugin[]> {
    return this.pluginService.getPlugins({ category, status, limit, offset });
  }

  @Query(() => Plugin)
  async getPlugin(@Args('id') id: string): Promise<Plugin> {
    return this.pluginService.getPlugin(id);
  }

  @Query(() => [Plugin])
  async searchPlugins(
    @Args('query') query: string,
    @Args('category', { type: () => PluginCategory, nullable: true }) category?: PluginCategory,
  ): Promise<Plugin[]> {
    return this.pluginService.searchPlugins(query, category);
  }

  @Query(() => [UserPlugin])
  async getUserPlugins(@Args('userId') userId: string): Promise<UserPlugin[]> {
    return this.pluginService.getUserPlugins(userId);
  }

  @Query(() => PluginStats)
  async getPluginStats(): Promise<PluginStats> {
    return this.pluginService.getPluginStats();
  }

  @Mutation(() => InstallPluginResponse)
  async installPlugin(
    @Args('userId') userId: string,
    @Args('pluginId') pluginId: string,
    @Args('configuration', { nullable: true }) configuration?: any,
  ): Promise<InstallPluginResponse> {
    return this.pluginService.installPlugin(userId, pluginId, configuration);
  }

  @Mutation(() => InstallPluginResponse)
  async uninstallPlugin(
    @Args('userId') userId: string,
    @Args('pluginId') pluginId: string,
  ): Promise<InstallPluginResponse> {
    return this.pluginService.uninstallPlugin(userId, pluginId);
  }

  @Mutation(() => UserPlugin)
  async updatePluginConfiguration(
    @Args('userId') userId: string,
    @Args('pluginId') pluginId: string,
    @Args('configuration') configuration: any,
  ): Promise<UserPlugin> {
    return this.pluginService.updatePluginConfiguration(userId, pluginId, configuration);
  }
}