import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { EventProcessorService } from './event-processor.service';
import { BigQueryService } from './bigquery.service';
import { AnalyticsEvent } from './analytics-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEvent])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, EventProcessorService, BigQueryService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}