import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { GatewayService } from '../gateway.service';

export class Plugin {
  id: string;
  name: string;
  description?: string;
  version: string;
  author: string;
  category: string;
  isActive: boolean;
  installedAt?: string;
}

@Resolver(() => Plugin)
export class PluginResolver {
  constructor(private gatewayService: GatewayService) {}

  @Query(() => [Plugin])
  async plugins() {
    const serviceUrl = this.gatewayService.getServiceUrl('plugin');
    return this.gatewayService.proxyToService(`${serviceUrl}/plugins`, 'GET');
  }

  @Query(() => [Plugin])
  async userPlugins(@Args('userId') userId: string) {
    const serviceUrl = this.gatewayService.getServiceUrl('plugin');
    return this.gatewayService.proxyToService(`${serviceUrl}/plugins/user/${userId}`, 'GET');
  }

  @Mutation(() => Plugin)
  async installPlugin(@Args('userId') userId: string, @Args('pluginId') pluginId: string) {
    const serviceUrl = this.gatewayService.getServiceUrl('plugin');
    return this.gatewayService.proxyToService(`${serviceUrl}/plugins/install`, 'POST', {
      userId,
      pluginId
    });
  }

  @Mutation(() => Boolean)
  async uninstallPlugin(@Args('userId') userId: string, @Args('pluginId') pluginId: string) {
    const serviceUrl = this.gatewayService.getServiceUrl('plugin');
    await this.gatewayService.proxyToService(`${serviceUrl}/plugins/uninstall`, 'POST', {
      userId,
      pluginId
    });
    return true;
  }
}