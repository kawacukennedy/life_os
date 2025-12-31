# Task Service

The Task Service provides comprehensive task management functionality for LifeOS, including CRUD operations, scheduling, prioritization, and AI-powered suggestions.

## Features

- **Task CRUD Operations**: Create, read, update, and delete tasks
- **Advanced Filtering**: Filter tasks by status, priority, date ranges
- **Task Scheduling**: Due dates, duration tracking, and reminders
- **Priority Management**: Low, medium, high, and urgent priority levels
- **Bulk Operations**: Update multiple tasks at once
- **Metadata Support**: Tags, context, and custom metadata
- **Recurring Tasks**: Support for recurring task patterns

## API Endpoints

### Tasks

- `POST /tasks` - Create a new task
- `GET /tasks` - Get all tasks with optional filtering
- `GET /tasks/:id` - Get a specific task
- `PATCH /tasks/:id` - Update a task
- `DELETE /tasks/:id` - Delete a task
- `POST /tasks/bulk-update` - Bulk update tasks

### Specialized Queries

- `GET /tasks/overdue` - Get overdue tasks
- `GET /tasks/upcoming` - Get upcoming tasks
- `GET /tasks/date-range` - Get tasks within a date range

## Data Model

```typescript
interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueAt?: Date;
  durationMinutes?: number;
  completedAt?: Date;
  tags?: string[];
  metadata?: {
    context?: string;
    aiGenerated?: boolean;
    source?: string;
    recurrence?: {
      frequency: string;
      interval: number;
      endDate?: Date;
    };
  };
  reminderAt?: Date;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Environment Variables

- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_USERNAME` - PostgreSQL username
- `DB_PASSWORD` - PostgreSQL password
- `DB_NAME` - Database name (default: lifeos_tasks)
- `JWT_SECRET` - JWT signing secret

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Run tests
npm test

# Run linting
npm run lint
```

## Database Migrations

```bash
# Generate migration
npm run migration:generate -- CreateTaskTable

# Run migrations
npm run migration:run
```