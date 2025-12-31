import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, ParseIntPipe, ParseEnumPipe } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateEventDto } from "./dto/create-event.dto";
import { CreateMetricDto } from "./dto/create-metric.dto";
import { CreateDashboardDto } from "./dto/create-dashboard.dto";
import { EventType } from "./event.entity";
import { MetricGranularity } from "./metric.entity";

@ApiTags("analytics")
@ApiBearerAuth()
@Controller("analytics")
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // Event endpoints
  @Post("events")
  @ApiOperation({ summary: "Create a single event" })
  @ApiResponse({ status: 201, description: "Event created successfully" })
  createEvent(@Body() createEventDto: CreateEventDto) {
    return this.analyticsService.createEvent(createEventDto);
  }

  @Post("events/batch")
  @ApiOperation({ summary: "Create multiple events" })
  @ApiResponse({ status: 201, description: "Events created successfully" })
  createEvents(@Body() createEventsDto: { events: CreateEventDto[] }) {
    return this.analyticsService.createEvents(createEventsDto.events);
  }

  @Get("events")
  @ApiOperation({ summary: "Get events with filtering" })
  @ApiQuery({ name: "userId", required: false })
  @ApiQuery({ name: "eventType", enum: EventType, required: false })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  getEvents(
    @Query("userId") userId?: string,
    @Query("eventType") eventType?: EventType,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("limit", ParseIntPipe) limit?: number,
    @Query("offset", ParseIntPipe) offset?: number,
  ) {
    return this.analyticsService.getEvents(
      userId,
      eventType,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      limit,
      offset
    );
  }

  @Get("events/stats")
  @ApiOperation({ summary: "Get event statistics" })
  @ApiQuery({ name: "userId", required: false })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  getEventStats(
    @Query("userId") userId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.analyticsService.getEventStats(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  // Metric endpoints
  @Post("metrics")
  @ApiOperation({ summary: "Create a metric" })
  @ApiResponse({ status: 201, description: "Metric created successfully" })
  createMetric(@Body() createMetricDto: CreateMetricDto) {
    return this.analyticsService.createMetric(createMetricDto);
  }

  @Get("metrics")
  @ApiOperation({ summary: "Get metrics with filtering" })
  @ApiQuery({ name: "name", required: false })
  @ApiQuery({ name: "category", required: false })
  @ApiQuery({ name: "granularity", enum: MetricGranularity, required: false })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  @ApiQuery({ name: "limit", required: false, type: Number })
  getMetrics(
    @Query("name") name?: string,
    @Query("category") category?: string,
    @Query("granularity") granularity?: MetricGranularity,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("limit", ParseIntPipe) limit?: number,
  ) {
    return this.analyticsService.getMetrics(
      name,
      category,
      granularity,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      limit
    );
  }

  @Get("metrics/aggregate/:name")
  @ApiOperation({ summary: "Get aggregated metrics for a specific metric name" })
  @ApiQuery({ name: "granularity", enum: MetricGranularity, required: true })
  @ApiQuery({ name: "startDate", required: true })
  @ApiQuery({ name: "endDate", required: true })
  getAggregatedMetrics(
    @Param("name") name: string,
    @Query("granularity", new ParseEnumPipe(MetricGranularity)) granularity: MetricGranularity,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.analyticsService.aggregateMetrics(
      name,
      granularity,
      new Date(startDate),
      new Date(endDate)
    );
  }

  // Dashboard endpoints
  @Post("dashboards")
  @ApiOperation({ summary: "Create a dashboard" })
  @ApiResponse({ status: 201, description: "Dashboard created successfully" })
  createDashboard(@Request() req, @Body() createDashboardDto: CreateDashboardDto) {
    return this.analyticsService.createDashboard(req.user.userId, createDashboardDto);
  }

  @Get("dashboards")
  @ApiOperation({ summary: "Get user's dashboards" })
  getUserDashboards(@Request() req) {
    return this.analyticsService.getUserDashboards(req.user.userId);
  }

  @Get("dashboards/:id")
  @ApiOperation({ summary: "Get dashboard by ID" })
  getDashboardById(@Param("id") id: string) {
    return this.analyticsService.getDashboardById(id);
  }

  @Put("dashboards/:id")
  @ApiOperation({ summary: "Update dashboard" })
  updateDashboard(@Param("id") id: string, @Body() updateData: Partial<CreateDashboardDto>) {
    return this.analyticsService.updateDashboard(id, updateData);
  }

  @Delete("dashboards/:id")
  @ApiOperation({ summary: "Delete dashboard" })
  deleteDashboard(@Param("id") id: string) {
    return this.analyticsService.deleteDashboard(id);
  }

  // Analytics endpoints
  @Get("activity-timeline")
  @ApiOperation({ summary: "Get user activity timeline" })
  @ApiQuery({ name: "days", required: false, type: Number })
  getUserActivityTimeline(@Request() req, @Query("days", ParseIntPipe) days?: number) {
    return this.analyticsService.getUserActivityTimeline(req.user.userId, days);
  }

  @Get("system-health")
  @ApiOperation({ summary: "Get system health metrics" })
  @ApiQuery({ name: "hours", required: false, type: Number })
  getSystemHealthMetrics(@Query("hours", ParseIntPipe) hours?: number) {
    return this.analyticsService.getSystemHealthMetrics(hours);
  }

  @Get("top-events")
  @ApiOperation({ summary: "Get top events" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "days", required: false, type: Number })
  getTopEvents(
    @Query("limit", ParseIntPipe) limit?: number,
    @Query("days", ParseIntPipe) days?: number,
  ) {
    return this.analyticsService.getTopEvents(limit, days);
  }
}