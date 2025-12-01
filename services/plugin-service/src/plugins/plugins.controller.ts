import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PluginsService } from './plugins.service';
import { Plugin, PluginCategory, PluginStatus } from './plugin.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('plugins')
@UseGuards(JwtAuthGuard)
export class PluginsController {
  constructor(private readonly pluginsService: PluginsService) {}

  // Plugin management (admin)
  @Post()
  create(@Body() createPluginDto: Partial<Plugin>): Promise<Plugin> {
    return this.pluginsService.create(createPluginDto);
  }

  @Get()
  findAll(
    @Query('category') category?: PluginCategory,
    @Query('status') status?: PluginStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<Plugin[]> {
    return this.pluginsService.findAll({ category, status, limit: limit ? +limit : undefined, offset: offset ? +offset : undefined });
  }

  @Get('search')
  search(@Query('q') query: string, @Query('category') category?: PluginCategory): Promise<Plugin[]> {
    return this.pluginsService.searchPlugins(query, category);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Plugin> {
    return this.pluginsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePluginDto: Partial<Plugin>): Promise<Plugin> {
    return this.pluginsService.update(id, updatePluginDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.pluginsService.remove(id);
  }

  // User plugin installations
  @Post('install')
  installPlugin(@Body() body: { userId: string; pluginId: string; configuration?: any }): Promise<any> {
    return this.pluginsService.installPlugin(body.userId, body.pluginId, body.configuration);
  }

  @Post('uninstall')
  uninstallPlugin(@Body() body: { userId: string; pluginId: string }): Promise<void> {
    return this.pluginsService.uninstallPlugin(body.userId, body.pluginId);
  }

  @Get('user/:userId')
  getUserPlugins(@Param('userId') userId: string): Promise<any[]> {
    return this.pluginsService.getUserPlugins(userId);
  }

  @Patch('user/:userId/:pluginId/config')
  updateConfiguration(
    @Param('userId') userId: string,
    @Param('pluginId') pluginId: string,
    @Body() configuration: any,
  ): Promise<any> {
    return this.pluginsService.updatePluginConfiguration(userId, pluginId, configuration);
  }

  // Stats
  @Get('stats/overview')
  getPluginStats(): Promise<any> {
    return this.pluginsService.getPluginStats();
  }
}