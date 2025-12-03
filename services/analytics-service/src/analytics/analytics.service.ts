import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AnalyticsEvent } from './analytics-event.entity';
import { EventProcessorService } from './event-processor.service';
import { BigQueryService } from './bigquery.service';
import { CacheService } from '../common/cache.service';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private eventRepository: Repository<AnalyticsEvent>,
    private eventProcessor: EventProcessorService,
    private bigQueryService: BigQueryService,
    private cacheService: CacheService,
  ) {}

  async trackEvent(eventData: any) {
    // Process and store event
    const processedEvent = await this.eventProcessor.processEvent(eventData);

    // Store in PostgreSQL
    const event = this.eventRepository.create(processedEvent);
    await this.eventRepository.save(event);

    // Send to BigQuery for long-term storage
    await this.bigQueryService.insertEvent(processedEvent);

    return { success: true, eventId: event.id };
  }

  async trackEvents(events: any[]) {
    const processedEvents = await Promise.all(
      events.map(event => this.eventProcessor.processEvent(event))
    );

    // Batch insert to PostgreSQL
    const savedEvents = await this.eventRepository.save(
      processedEvents.map(event => this.eventRepository.create(event))
    );

    // Batch insert to BigQuery
    await this.bigQueryService.insertEvents(processedEvents);

    return { success: true, eventsTracked: savedEvents.length };
  }

  async getUserActivityReport(userId: string, startDate: string, endDate: string) {
    const cacheKey = this.cacheService.generateKey('user-activity', { userId, startDate, endDate });

    // Check cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const events = await this.eventRepository.find({
      where: {
        userId,
        timestamp: Between(new Date(startDate), new Date(endDate)),
      },
      order: { timestamp: 'ASC' },
    });

    // Aggregate by event type and date
    const aggregated = events.reduce((acc, event) => {
      const date = event.timestamp.toISOString().split('T')[0];
      const type = event.eventType;

      if (!acc[date]) acc[date] = {};
      if (!acc[date][type]) acc[date][type] = 0;
      acc[date][type]++;

      return acc;
    }, {});

    const result = {
      userId,
      period: { startDate, endDate },
      activity: aggregated,
      totalEvents: events.length,
    };

    // Cache for 1 hour
    await this.cacheService.set(cacheKey, result, 3600);

    return result;
  }

  async getProductMetricsReport(startDate: string, endDate: string) {
    const cacheKey = this.cacheService.generateKey('product-metrics', { startDate, endDate });

    // Check cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const events = await this.eventRepository.find({
      where: {
        timestamp: Between(new Date(startDate), new Date(endDate)),
      },
    });

    // Calculate key metrics
    const metrics = {
      totalEvents: events.length,
      uniqueUsers: new Set(events.map(e => e.userId)).size,
      eventsByType: events.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {}),
      eventsByDate: events.reduce((acc, event) => {
        const date = event.timestamp.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {}),
    };

    const result = {
      period: { startDate, endDate },
      metrics,
    };

    // Cache for 30 minutes
    await this.cacheService.set(cacheKey, result, 1800);

    return result;
  }

  async getRetentionReport(cohort: string, periods: number) {
    // This would typically query BigQuery for complex retention analysis
    // For now, return mock data structure
    return {
      cohort,
      periods,
      retention: {
        day1: 0.85,
        day7: 0.65,
        day30: 0.45,
        day90: 0.35,
      },
    };
  }
}