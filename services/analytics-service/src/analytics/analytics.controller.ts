import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('events')
  @ApiOperation({ summary: 'Track analytics event' })
  @ApiResponse({ status: 201, description: 'Event tracked successfully' })
  async trackEvent(@Body() eventData: any) {
    return this.analyticsService.trackEvent(eventData);
  }

  @Post('events/batch')
  @ApiOperation({ summary: 'Track batch of analytics events' })
  @ApiResponse({ status: 201, description: 'Events tracked successfully' })
  async trackEvents(@Body() events: any[]) {
    return this.analyticsService.trackEvents(events);
  }

  @Get('reports/user-activity')
  @ApiOperation({ summary: 'Get user activity report' })
  @ApiResponse({ status: 200, description: 'User activity data' })
  async getUserActivityReport(
    @Query('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getUserActivityReport(userId, startDate, endDate);
  }

  @Get('reports/product-metrics')
  @ApiOperation({ summary: 'Get product metrics report' })
  @ApiResponse({ status: 200, description: 'Product metrics data' })
  async getProductMetricsReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getProductMetricsReport(startDate, endDate);
  }

  @Get('reports/retention')
  @ApiOperation({ summary: 'Get user retention report' })
  @ApiResponse({ status: 200, description: 'Retention data' })
  async getRetentionReport(
    @Query('cohort') cohort: string,
    @Query('periods') periods: number,
  ) {
    return this.analyticsService.getRetentionReport(cohort, periods);
  }
}