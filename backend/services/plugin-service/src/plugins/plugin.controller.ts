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
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PluginService } from './plugin.service';
import { CreatePluginDto } from './dto/create-plugin.dto';
import { UpdatePluginDto } from './dto/update-plugin.dto';
import { Plugin, PluginCategory, PluginStatus } from './plugin.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('plugins')
@ApiBearerAuth()
@Controller('plugins')
@UseGuards(JwtAuthGuard)
export class PluginController {
  constructor(private readonly pluginService: PluginService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new plugin' })
  @ApiResponse({ status: 201, description: 'Plugin created successfully', type: Plugin })
  create(@Body() createPluginDto: CreatePluginDto, @Request() req) {
    return this.pluginService.create(createPluginDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all plugins with optional filtering' })
  @ApiResponse({ status: 200, description: 'Plugins retrieved successfully', type: [Plugin] })
  findAll(
    @Query('category') category?: PluginCategory,
    @Query('status') status?: PluginStatus,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const options: any = {};
    if (category) options.category = category;
    if (status) options.status = status;
    if (search) options.search = search;
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);

    return this.pluginService.findAll(options);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular plugins' })
  @ApiResponse({ status: 200, description: 'Popular plugins retrieved successfully', type: [Plugin] })
  getPopular(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 10;
    return this.pluginService.getPopularPlugins(limitNum);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured plugins' })
  @ApiResponse({ status: 200, description: 'Featured plugins retrieved successfully', type: [Plugin] })
  getFeatured(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 6;
    return this.pluginService.getFeaturedPlugins(limitNum);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search plugins' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully', type: [Plugin] })
  search(
    @Query('q') query: string,
    @Query('category') category?: PluginCategory,
    @Query('limit') limit?: string,
  ) {
    if (!query) {
      throw new BadRequestException('Search query is required');
    }
    const limitNum = limit ? parseInt(limit) : 20;
    return this.pluginService.searchPlugins(query, category, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a plugin by ID' })
  @ApiResponse({ status: 200, description: 'Plugin retrieved successfully', type: Plugin })
  findOne(@Param('id') id: string) {
    return this.pluginService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a plugin by slug' })
  @ApiResponse({ status: 200, description: 'Plugin retrieved successfully', type: Plugin })
  findBySlug(@Param('slug') slug: string) {
    return this.pluginService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a plugin' })
  @ApiResponse({ status: 200, description: 'Plugin updated successfully', type: Plugin })
  update(@Param('id') id: string, @Body() updatePluginDto: UpdatePluginDto, @Request() req) {
    return this.pluginService.update(id, updatePluginDto, req.user.userId);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish a plugin' })
  @ApiResponse({ status: 200, description: 'Plugin published successfully', type: Plugin })
  publish(@Param('id') id: string, @Request() req) {
    return this.pluginService.publish(id, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a plugin' })
  @ApiResponse({ status: 200, description: 'Plugin deleted successfully' })
  remove(@Param('id') id: string, @Request() req) {
    return this.pluginService.remove(id, req.user.userId);
  }

  @Post(':id/install')
  @ApiOperation({ summary: 'Install a plugin' })
  @ApiResponse({ status: 200, description: 'Plugin installation initiated' })
  install(@Param('id') id: string, @Request() req) {
    return this.pluginService.install(id, req.user.userId);
  }

  @Post(':id/uninstall')
  @ApiOperation({ summary: 'Uninstall a plugin' })
  @ApiResponse({ status: 200, description: 'Plugin uninstallation initiated' })
  uninstall(@Param('id') id: string, @Request() req) {
    return this.pluginService.uninstall(id, req.user.userId);
  }

  @Get('user/installed')
  @ApiOperation({ summary: 'Get user installed plugins' })
  @ApiResponse({ status: 200, description: 'User plugins retrieved successfully' })
  getUserPlugins(@Request() req) {
    return this.pluginService.getUserPlugins(req.user.userId);
  }

  @Patch(':id/settings')
  @ApiOperation({ summary: 'Update plugin settings' })
  @ApiResponse({ status: 200, description: 'Plugin settings updated successfully' })
  updateSettings(@Param('id') id: string, @Body() settings: Record<string, any>, @Request() req) {
    return this.pluginService.updatePluginSettings(id, req.user.userId, settings);
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: 'Toggle plugin enabled/disabled' })
  @ApiResponse({ status: 200, description: 'Plugin toggled successfully' })
  toggle(@Param('id') id: string, @Body('enabled') enabled: boolean, @Request() req) {
    return this.pluginService.togglePlugin(id, req.user.userId, enabled);
  }
}