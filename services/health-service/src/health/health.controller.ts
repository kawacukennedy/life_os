import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HealthService } from './health.service';
import { FitbitService } from './fitbit.service';
import { AppleHealthService, AppleHealthData } from './apple-health.service';
import { HealthAnomalyDetectorService } from './health-anomaly-detector.service';

@Controller('health')
@UseGuards(JwtAuthGuard)
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly fitbitService: FitbitService,
    private readonly appleHealthService: AppleHealthService,
    private readonly anomalyDetector: HealthAnomalyDetectorService,
  ) {}

  @Get('summary')
  async getHealthSummary(@Query('userId') userId: string) {
    return this.healthService.getHealthSummary(userId);
  }

  @Get('vitals')
  async getVitals(
    @Query('userId') userId: string,
    @Query('metricType') metricType?: string,
    @Query('limit') limit?: number,
  ) {
    return this.healthService.getVitals(userId, metricType, limit);
  }

  @Post('vitals')
  async addVital(
    @Body() body: { userId: string; metricType: string; value: number; unit: string },
  ) {
    return this.healthService.addVital(body.userId, body.metricType, body.value, body.unit);
  }

  // Fitbit Integration
  @Get('fitbit/auth')
  async getFitbitAuthUrl(@Query('userId') userId: string) {
    const authUrl = this.fitbitService.getAuthUrl(userId);
    return { authUrl };
  }

  @Get('fitbit/callback')
  async fitbitCallback(@Query('code') code: string, @Query('state') userId: string) {
    const tokens = await this.fitbitService.exchangeCodeForToken(code);
    // Store tokens in user record (would need to call auth service)
    return { message: 'Fitbit connected successfully', tokens };
  }

  @Get('fitbit/profile')
  async getFitbitProfile(@Query('accessToken') accessToken: string) {
    return this.fitbitService.getUserProfile(accessToken);
  }

  @Get('fitbit/activity')
  async getFitbitActivity(@Query('accessToken') accessToken: string, @Query('date') date: string) {
    return this.fitbitService.getActivityData(accessToken, date);
  }

  @Get('fitbit/heartrate')
  async getFitbitHeartRate(@Query('accessToken') accessToken: string, @Query('date') date: string) {
    return this.fitbitService.getHeartRateData(accessToken, date);
  }

  @Get('fitbit/sleep')
  async getFitbitSleep(@Query('accessToken') accessToken: string, @Query('date') date: string) {
    return this.fitbitService.getSleepData(accessToken, date);
  }

  @Get('fitbit/sync')
  async syncFitbitData(@Query('accessToken') accessToken: string, @Query('userId') userId: string) {
    return this.fitbitService.syncHealthData(accessToken, userId);
  }

  // Apple Health Integration
  @Post('apple-health/sync')
  async syncAppleHealthData(@Body() body: { userId: string; healthData: AppleHealthData[] }) {
    await this.appleHealthService.processHealthData(body.healthData);
    return { message: 'Apple Health data synced successfully' };
  }

  @Get('apple-health/data')
  async getAppleHealthData(
    @Query('userId') userId: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.appleHealthService.getHealthData(userId, type, start, end);
  }

  @Get('apple-health/latest')
  async getLatestAppleHealthVitals(@Query('userId') userId: string) {
    return this.appleHealthService.getLatestVitals(userId);
  }

  // Health Anomaly Detection
  @Post('anomalies/detect')
  async detectAnomaly(
    @Body() body: { userId: string; vitalType: string; value: number },
  ) {
    return this.anomalyDetector.detectAnomalies(body.userId, body.vitalType, body.value);
  }

  @Get('anomalies/user/:userId')
  async detectAnomaliesForUser(@Param('userId') userId: string) {
    return this.anomalyDetector.detectAnomaliesForUser(userId);
  }
}