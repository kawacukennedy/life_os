import { Command, CommandHandler } from './command-handler';
import { DomainEvent, EventStoreService } from './event-store.service';
import { UserAggregate } from './user.aggregate';
import { v4 as uuidv4 } from 'uuid';

export class CreateUserCommand implements Command {
  commandId: string;
  commandType = 'CreateUser';
  aggregateId: string;
  payload: {
    email: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
  };
  metadata: {
    userId?: string;
    correlationId?: string;
    timestamp: Date;
  };

  constructor(payload: CreateUserCommand['payload'], metadata?: Partial<CreateUserCommand['metadata']>) {
    this.commandId = uuidv4();
    this.aggregateId = uuidv4(); // New user gets new ID
    this.payload = payload;
    this.metadata = {
      timestamp: new Date(),
      ...metadata,
    };
  }
}

export class UpdateUserProfileCommand implements Command {
  commandId: string;
  commandType = 'UpdateUserProfile';
  aggregateId: string;
  payload: {
    firstName?: string;
    lastName?: string;
  };
  metadata: {
    userId?: string;
    correlationId?: string;
    timestamp: Date;
  };

  constructor(aggregateId: string, payload: UpdateUserProfileCommand['payload'], metadata?: Partial<UpdateUserProfileCommand['metadata']>) {
    this.commandId = uuidv4();
    this.aggregateId = aggregateId;
    this.payload = payload;
    this.metadata = {
      timestamp: new Date(),
      ...metadata,
    };
  }
}

export class UserCommandHandler extends CommandHandler<UserAggregate> {
  protected async loadAggregate(aggregateId: string): Promise<UserAggregate> {
    return await UserAggregate.load(this.eventStore, aggregateId);
  }

  protected async execute(aggregate: UserAggregate, command: Command): Promise<DomainEvent[]> {
    switch (command.commandType) {
      case 'CreateUser':
        const createCommand = command as CreateUserCommand;
        aggregate.createUser(
          createCommand.payload.email,
          createCommand.payload.firstName,
          createCommand.payload.lastName,
          createCommand.aggregateId
        );
        break;

      case 'UpdateUserProfile':
        const updateCommand = command as UpdateUserProfileCommand;
        aggregate.updateProfile(
          updateCommand.payload.firstName,
          updateCommand.payload.lastName
        );
        break;

      default:
        throw new Error(`Unknown command type: ${command.commandType}`);
    }

    return aggregate.getUncommittedEvents();
  }
}