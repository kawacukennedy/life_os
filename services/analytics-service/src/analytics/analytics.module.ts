import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { EventProcessorService } from './event-processor.service';
import { BigQueryService } from './bigquery.service';
import { HealthCheckService } from '../common/health-check.service';
import { CacheService } from '../common/cache.service';
import { PerformanceService } from '../common/performance.service';
import { DataRetentionService } from '../common/data-retention.service';
import { AnalyticsEvent } from './analytics-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEvent])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, EventProcessorService, BigQueryService, HealthCheckService, CacheService, PerformanceService, DataRetentionService],
  exports: [AnalyticsService, HealthCheckService],
})
export class AnalyticsModule {}