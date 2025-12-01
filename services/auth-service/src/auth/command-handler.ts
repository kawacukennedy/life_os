import { DomainEvent, EventStoreService } from './event-store.service';

export interface Command {
  commandId: string;
  commandType: string;
  aggregateId: string;
  payload: any;
  metadata: {
    userId?: string;
    correlationId?: string;
    timestamp: Date;
  };
}

export abstract class CommandHandler<TAggregate> {
  constructor(protected eventStore: EventStoreService) {}

  async handle(command: Command): Promise<void> {
    // Load aggregate
    const aggregate = await this.loadAggregate(command.aggregateId);

    // Execute command
    const events = await this.execute(aggregate, command);

    // Save events
    if (events.length > 0) {
      await this.eventStore.saveEvents(events);
    }

    // Publish events (in a real implementation, you'd have an event bus)
    for (const event of events) {
      await this.publishEvent(event);
    }
  }

  protected abstract loadAggregate(aggregateId: string): Promise<TAggregate>;
  protected abstract execute(aggregate: TAggregate, command: Command): Promise<DomainEvent[]>;

  protected async publishEvent(event: DomainEvent): Promise<void> {
    // In a real implementation, this would publish to an event bus
    console.log(`Event published: ${event.eventType} for aggregate ${event.aggregateId}`);
  }
}

// CQRS Query Handler base class
export abstract class QueryHandler<TResult> {
  constructor(protected eventStore: EventStoreService) {}

  async handle(query: any): Promise<TResult> {
    return this.execute(query);
  }

  protected abstract execute(query: any): Promise<TResult>;
}