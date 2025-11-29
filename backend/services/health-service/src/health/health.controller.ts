import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HealthService } from './health.service';
import { FitbitService } from './fitbit.service';

@Controller('health')
@UseGuards(JwtAuthGuard)
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly fitbitService: FitbitService,
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

  // Data Ingestion
  @Post('ingest/fitbit')
  async ingestFitbitData(@Body() body: { userId: string; accessToken: string }) {
    return this.healthService.ingestFitbitData(body.userId, body.accessToken);
  }

  @Post('ingest/apple-health')
  async ingestAppleHealthData(@Body() body: { userId: string; healthData: any }) {
    return this.healthService.ingestAppleHealthData(body.userId, body.healthData);
  }

  // Wearable Auth
  @Get('wearable/auth')
  async getWearableAuthUrl(@Query('provider') provider: string, @Query('userId') userId: string) {
    return this.healthService.getWearableAuthUrl(provider, userId);
  }

  @Post('wearable/callback')
  async handleWearableCallback(@Body() body: { provider: string; code: string; state: string }) {
    return this.healthService.handleWearableCallback(body.provider, body.code, body.state);
  }
}