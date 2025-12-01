import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEntity } from './event.entity';

export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  eventData: any;
  metadata: {
    timestamp: Date;
    userId?: string;
    correlationId?: string;
    causationId?: string;
    version: number;
  };
}

export interface Snapshot {
  aggregateId: string;
  aggregateType: string;
  version: number;
  state: any;
  timestamp: Date;
}

@Injectable()
export class EventStoreService {
  constructor(
    @InjectRepository(EventEntity)
    private eventRepository: Repository<EventEntity>,
  ) {}

  async saveEvent(event: DomainEvent): Promise<void> {
    const eventEntity = this.eventRepository.create({
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      eventData: event.eventData,
      metadata: event.metadata,
    });

    await this.eventRepository.save(eventEntity);
  }

  async saveEvents(events: DomainEvent[]): Promise<void> {
    const eventEntities = events.map(event => this.eventRepository.create({
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      eventData: event.eventData,
      metadata: event.metadata,
    }));

    await this.eventRepository.save(eventEntities);
  }

  async getEvents(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]> {
    const query = this.eventRepository
      .createQueryBuilder('event')
      .where('event.aggregateId = :aggregateId', { aggregateId })
      .orderBy('event.metadata.version', 'ASC');

    if (fromVersion !== undefined) {
      query.andWhere('event.metadata.version > :fromVersion', { fromVersion });
    }

    const eventEntities = await query.getMany();

    return eventEntities.map(entity => ({
      eventId: entity.eventId,
      eventType: entity.eventType,
      aggregateId: entity.aggregateId,
      aggregateType: entity.aggregateType,
      eventData: entity.eventData,
      metadata: entity.metadata,
    }));
  }

  async getAllEvents(eventTypes?: string[], fromTimestamp?: Date): Promise<DomainEvent[]> {
    const query = this.eventRepository
      .createQueryBuilder('event')
      .orderBy('event.metadata.timestamp', 'ASC');

    if (eventTypes && eventTypes.length > 0) {
      query.andWhere('event.eventType IN (:...eventTypes)', { eventTypes });
    }

    if (fromTimestamp) {
      query.andWhere('event.metadata.timestamp >= :fromTimestamp', { fromTimestamp });
    }

    const eventEntities = await query.getMany();

    return eventEntities.map(entity => ({
      eventId: entity.eventId,
      eventType: entity.eventType,
      aggregateId: entity.aggregateId,
      aggregateType: entity.aggregateType,
      eventData: entity.eventData,
      metadata: entity.metadata,
    }));
  }

  async getAggregateVersion(aggregateId: string): Promise<number> {
    const result = await this.eventRepository
      .createQueryBuilder('event')
      .select('MAX(event.metadata.version)', 'maxVersion')
      .where('event.aggregateId = :aggregateId', { aggregateId })
      .getRawOne();

    return result?.maxVersion || 0;
  }

  async saveSnapshot(snapshot: Snapshot): Promise<void> {
    // In a real implementation, you'd have a separate snapshots table
    // For now, we'll store snapshots as special events
    const snapshotEvent: DomainEvent = {
      eventId: `snapshot-${snapshot.aggregateId}-${snapshot.version}`,
      eventType: 'SnapshotCreated',
      aggregateId: snapshot.aggregateId,
      aggregateType: snapshot.aggregateType,
      eventData: {
        version: snapshot.version,
        state: snapshot.state,
      },
      metadata: {
        timestamp: snapshot.timestamp,
        version: snapshot.version,
      },
    };

    await this.saveEvent(snapshotEvent);
  }

  async getLatestSnapshot(aggregateId: string): Promise<Snapshot | null> {
    const snapshotEvent = await this.eventRepository
      .createQueryBuilder('event')
      .where('event.aggregateId = :aggregateId', { aggregateId })
      .andWhere('event.eventType = :eventType', { eventType: 'SnapshotCreated' })
      .orderBy('event.metadata.version', 'DESC')
      .getOne();

    if (!snapshotEvent) {
      return null;
    }

    return {
      aggregateId: snapshotEvent.aggregateId,
      aggregateType: snapshotEvent.aggregateType,
      version: snapshotEvent.eventData.version,
      state: snapshotEvent.eventData.state,
      timestamp: snapshotEvent.metadata.timestamp,
    };
  }

  async rebuildAggregateState<T>(
    aggregateId: string,
    eventHandlers: { [eventType: string]: (state: T, event: DomainEvent) => T },
    initialState: T,
  ): Promise<T> {
    const events = await this.getEvents(aggregateId);
    let state = { ...initialState };

    for (const event of events) {
      const handler = eventHandlers[event.eventType];
      if (handler) {
        state = handler(state, event);
      }
    }

    return state;
  }

  async getEventStream(fromEventId?: string, limit?: number): Promise<DomainEvent[]> {
    const query = this.eventRepository
      .createQueryBuilder('event')
      .orderBy('event.metadata.timestamp', 'ASC')
      .addOrderBy('event.eventId', 'ASC');

    if (fromEventId) {
      query.andWhere('event.eventId > :fromEventId', { fromEventId });
    }

    if (limit) {
      query.limit(limit);
    }

    const eventEntities = await query.getMany();

    return eventEntities.map(entity => ({
      eventId: entity.eventId,
      eventType: entity.eventType,
      aggregateId: entity.aggregateId,
      aggregateType: entity.aggregateType,
      eventData: entity.eventData,
      metadata: entity.metadata,
    }));
  }

  async getTemporalQuery(
    aggregateId: string,
    asOf: Date,
  ): Promise<DomainEvent[]> {
    const events = await this.eventRepository
      .createQueryBuilder('event')
      .where('event.aggregateId = :aggregateId', { aggregateId })
      .andWhere('event.metadata.timestamp <= :asOf', { asOf })
      .orderBy('event.metadata.version', 'ASC')
      .getMany();

    return events.map(entity => ({
      eventId: entity.eventId,
      eventType: entity.eventType,
      aggregateId: entity.aggregateId,
      aggregateType: entity.aggregateType,
      eventData: entity.eventData,
      metadata: entity.metadata,
    }));
  }
}