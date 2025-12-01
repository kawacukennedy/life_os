import { DomainEvent, EventStoreService } from './event-store.service';
import { v4 as uuidv4 } from 'uuid';

export interface UserState {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  emailVerified: boolean;
  roles: string[];
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export class UserAggregate {
  private state: UserState;
  private uncommittedEvents: DomainEvent[] = [];
  private eventStore: EventStoreService;

  constructor(eventStore: EventStoreService, aggregateId?: string) {
    this.eventStore = eventStore;
    this.state = {
      id: aggregateId || '',
      email: '',
      firstName: '',
      lastName: '',
      isActive: false,
      emailVerified: false,
      roles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 0,
    };
  }

  static async load(eventStore: EventStoreService, aggregateId: string): Promise<UserAggregate> {
    const aggregate = new UserAggregate(eventStore, aggregateId);
    await aggregate.loadFromHistory();
    return aggregate;
  }

  private async loadFromHistory(): Promise<void> {
    const events = await this.eventStore.getEvents(this.state.id);
    this.state = events.reduce(this.applyEvent, this.state);
  }

  private applyEvent(state: UserState, event: DomainEvent): UserState {
    switch (event.eventType) {
      case 'UserCreated':
        return {
          ...state,
          id: event.aggregateId,
          email: event.eventData.email,
          firstName: event.eventData.firstName,
          lastName: event.eventData.lastName,
          isActive: true,
          createdAt: event.metadata.timestamp,
          updatedAt: event.metadata.timestamp,
          version: event.metadata.version,
        };

      case 'UserEmailVerified':
        return {
          ...state,
          emailVerified: true,
          updatedAt: event.metadata.timestamp,
          version: event.metadata.version,
        };

      case 'UserProfileUpdated':
        return {
          ...state,
          firstName: event.eventData.firstName || state.firstName,
          lastName: event.eventData.lastName || state.lastName,
          updatedAt: event.metadata.timestamp,
          version: event.metadata.version,
        };

      case 'UserLoggedIn':
        return {
          ...state,
          lastLoginAt: event.metadata.timestamp,
          updatedAt: event.metadata.timestamp,
          version: event.metadata.version,
        };

      case 'UserDeactivated':
        return {
          ...state,
          isActive: false,
          updatedAt: event.metadata.timestamp,
          version: event.metadata.version,
        };

      case 'UserRoleAdded':
        return {
          ...state,
          roles: [...state.roles, event.eventData.role],
          updatedAt: event.metadata.timestamp,
          version: event.metadata.version,
        };

      default:
        return state;
    }
  }

  createUser(email: string, firstName: string, lastName: string, userId?: string): void {
    if (this.state.version > 0) {
      throw new Error('User already exists');
    }

    const event: DomainEvent = {
      eventId: uuidv4(),
      eventType: 'UserCreated',
      aggregateId: userId || uuidv4(),
      aggregateType: 'User',
      eventData: { email, firstName, lastName },
      metadata: {
        timestamp: new Date(),
        userId,
        version: 1,
      },
    };

    this.state = this.applyEvent(this.state, event);
    this.uncommittedEvents.push(event);
  }

  verifyEmail(): void {
    if (!this.state.emailVerified) {
      const event: DomainEvent = {
        eventId: uuidv4(),
        eventType: 'UserEmailVerified',
        aggregateId: this.state.id,
        aggregateType: 'User',
        eventData: {},
        metadata: {
          timestamp: new Date(),
          userId: this.state.id,
          version: this.state.version + 1,
        },
      };

      this.state = this.applyEvent(this.state, event);
      this.uncommittedEvents.push(event);
    }
  }

  updateProfile(firstName?: string, lastName?: string): void {
    const event: DomainEvent = {
      eventId: uuidv4(),
      eventType: 'UserProfileUpdated',
      aggregateId: this.state.id,
      aggregateType: 'User',
      eventData: { firstName, lastName },
      metadata: {
        timestamp: new Date(),
        userId: this.state.id,
        version: this.state.version + 1,
      },
    };

    this.state = this.applyEvent(this.state, event);
    this.uncommittedEvents.push(event);
  }

  recordLogin(): void {
    const event: DomainEvent = {
      eventId: uuidv4(),
      eventType: 'UserLoggedIn',
      aggregateId: this.state.id,
      aggregateType: 'User',
      eventData: {},
      metadata: {
        timestamp: new Date(),
        userId: this.state.id,
        version: this.state.version + 1,
      },
    };

    this.state = this.applyEvent(this.state, event);
    this.uncommittedEvents.push(event);
  }

  deactivate(): void {
    const event: DomainEvent = {
      eventId: uuidv4(),
      eventType: 'UserDeactivated',
      aggregateId: this.state.id,
      aggregateType: 'User',
      eventData: {},
      metadata: {
        timestamp: new Date(),
        userId: this.state.id,
        version: this.state.version + 1,
      },
    };

    this.state = this.applyEvent(this.state, event);
    this.uncommittedEvents.push(event);
  }

  addRole(role: string): void {
    if (!this.state.roles.includes(role)) {
      const event: DomainEvent = {
        eventId: uuidv4(),
        eventType: 'UserRoleAdded',
        aggregateId: this.state.id,
        aggregateType: 'User',
        eventData: { role },
        metadata: {
          timestamp: new Date(),
          userId: this.state.id,
          version: this.state.version + 1,
        },
      };

      this.state = this.applyEvent(this.state, event);
      this.uncommittedEvents.push(event);
    }
  }

  async commit(): Promise<void> {
    if (this.uncommittedEvents.length > 0) {
      await this.eventStore.saveEvents(this.uncommittedEvents);
      this.uncommittedEvents = [];
    }
  }

  getState(): UserState {
    return { ...this.state };
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  // Temporal query methods
  async getStateAsOf(date: Date): Promise<UserState> {
    const events = await this.eventStore.getTemporalQuery(this.state.id, date);
    return events.reduce(this.applyEvent, {
      id: this.state.id,
      email: '',
      firstName: '',
      lastName: '',
      isActive: false,
      emailVerified: false,
      roles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 0,
    });
  }
}