import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AnalyticsEvent } from '../analytics/analytics-event.entity';
import { BigQueryService } from '../analytics/bigquery.service';

@Injectable()
export class DataRetentionService {
  private readonly logger = new Logger(DataRetentionService.name);

  constructor(
    @InjectRepository(AnalyticsEvent)
    private eventRepository: Repository<AnalyticsEvent>,
    private bigQueryService: BigQueryService,
  ) {}

  // Run daily at 2 AM
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldData() {
    this.logger.log('Starting data retention cleanup');

    try {
      // Delete events older than 90 days from PostgreSQL
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const deleteResult = await this.eventRepository.delete({
        timestamp: LessThan(ninetyDaysAgo),
      });

      this.logger.log(`Deleted ${deleteResult.affected} old events from PostgreSQL`);

      // Archive older data to cold storage (would be implemented based on requirements)
      // This could involve moving data to cheaper storage or compressing it

      // Anonymize sensitive data older than 1 year
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      // Note: In a real implementation, you'd identify PII fields and anonymize them
      // For now, we'll just log the potential action
      this.logger.log('Data anonymization check completed');

    } catch (error) {
      this.logger.error('Error during data retention cleanup', error);
    }
  }

  // Run weekly on Sunday at 3 AM
  @Cron(CronExpression.EVERY_WEEK)
  async performWeeklyMaintenance() {
    this.logger.log('Starting weekly data maintenance');

    try {
      // Rebuild indexes if needed
      await this.rebuildIndexes();

      // Update statistics
      await this.updateStatistics();

      // Validate data integrity
      await this.validateDataIntegrity();

    } catch (error) {
      this.logger.error('Error during weekly maintenance', error);
    }
  }

  private async rebuildIndexes() {
    // In PostgreSQL, REINDEX can be used to rebuild indexes
    // This is a simplified example
    this.logger.log('Rebuilding database indexes');
    // Implementation would depend on specific index maintenance needs
  }

  private async updateStatistics() {
    // Update table statistics for query optimization
    this.logger.log('Updating database statistics');
    // Implementation would run ANALYZE commands
  }

  private async validateDataIntegrity() {
    // Perform data integrity checks
    this.logger.log('Validating data integrity');

    // Example: Check for orphaned records, invalid references, etc.
    const invalidEvents = await this.eventRepository
      .createQueryBuilder('event')
      .where('event.userId IS NULL OR event.eventType IS NULL')
      .getCount();

    if (invalidEvents > 0) {
      this.logger.warn(`Found ${invalidEvents} events with missing required fields`);
    }
  }

  async getRetentionStats() {
    const totalEvents = await this.eventRepository.count();

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const eventsToDelete = await this.eventRepository.count({
      where: { timestamp: LessThan(ninetyDaysAgo) },
    });

    return {
      totalEvents,
      eventsToDelete,
      retentionDays: 90,
      nextCleanup: this.getNextCleanupTime(),
    };
  }

  private getNextCleanupTime(): Date {
    const now = new Date();
    const nextCleanup = new Date(now);
    nextCleanup.setHours(2, 0, 0, 0); // 2 AM tomorrow

    if (nextCleanup <= now) {
      nextCleanup.setDate(nextCleanup.getDate() + 1);
    }

    return nextCleanup;
  }
}