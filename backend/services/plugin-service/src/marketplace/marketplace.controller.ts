import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { PluginCategory } from '../plugins/plugin.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('marketplace')
@ApiBearerAuth()
@Controller('marketplace')
@UseGuards(JwtAuthGuard)
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get marketplace statistics' })
  @ApiResponse({ status: 200, description: 'Marketplace stats retrieved successfully' })
  getStats() {
    return this.marketplaceService.getMarketplaceStats();
  }

  @Get('categories/:category/stats')
  @ApiOperation({ summary: 'Get category statistics' })
  @ApiResponse({ status: 200, description: 'Category stats retrieved successfully' })
  getCategoryStats(@Query('category') category: PluginCategory) {
    return this.marketplaceService.getCategoryStats(category);
  }

  @Get('developers/:developerId/stats')
  @ApiOperation({ summary: 'Get developer statistics' })
  @ApiResponse({ status: 200, description: 'Developer stats retrieved successfully' })
  getDeveloperStats(@Query('developerId') developerId: string) {
    return this.marketplaceService.getDeveloperStats(developerId);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get personalized plugin recommendations' })
  @ApiResponse({ status: 200, description: 'Recommendations retrieved successfully' })
  getRecommendations(@Request() req) {
    return this.marketplaceService.getRecommendations(req.user.userId);
  }

  @Post('validate-manifest')
  @ApiOperation({ summary: 'Validate plugin manifest' })
  @ApiResponse({ status: 200, description: 'Manifest validation completed' })
  validateManifest(@Body() manifest: any) {
    return this.marketplaceService.validatePluginManifest(manifest);
  }
}