import { Controller, Post, Get, Body, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HealthCheckService } from '../common/health-check.service';
import { TrackEventDto, TrackEventsDto, UserActivityReportDto, ProductMetricsReportDto, RetentionReportDto } from './analytics.dto';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly healthCheckService: HealthCheckService,
  ) {}

  @Post('events')
  @ApiOperation({ summary: 'Track analytics event' })
  @ApiResponse({ status: 201, description: 'Event tracked successfully' })
  async trackEvent(@Body() eventData: TrackEventDto) {
    return this.analyticsService.trackEvent(eventData);
  }

  @Post('events/batch')
  @ApiOperation({ summary: 'Track batch of analytics events' })
  @ApiResponse({ status: 201, description: 'Events tracked successfully' })
  async trackEvents(@Body() events: TrackEventsDto) {
    return this.analyticsService.trackEvents(events);
  }

  @Get('reports/user-activity')
  @ApiOperation({ summary: 'Get user activity report' })
  @ApiResponse({ status: 200, description: 'User activity data' })
  async getUserActivityReport(@Query() query: UserActivityReportDto) {
    return this.analyticsService.getUserActivityReport(query.userId, query.startDate, query.endDate);
  }

  @Get('reports/product-metrics')
  @ApiOperation({ summary: 'Get product metrics report' })
  @ApiResponse({ status: 200, description: 'Product metrics data' })
  async getProductMetricsReport(@Query() query: ProductMetricsReportDto) {
    return this.analyticsService.getProductMetricsReport(query.startDate, query.endDate);
  }

  @Get('reports/retention')
  @ApiOperation({ summary: 'Get user retention report' })
  @ApiResponse({ status: 200, description: 'Retention data' })
  async getRetentionReport(@Query() query: RetentionReportDto) {
    return this.analyticsService.getRetentionReport(query.cohort, query.periods);
  }

  @Get('health')
  @ApiOperation({ summary: 'Get service health status' })
  @ApiResponse({ status: 200, description: 'Service health information' })
  async getHealth() {
    return this.healthCheckService.getHealthStatus();
  }
}