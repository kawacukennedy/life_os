# Analytics Service

The Analytics Service provides comprehensive event ingestion, metric aggregation, and analytics capabilities for LifeOS using PostgreSQL for metadata and ClickHouse for high-performance analytics data.

## Features

- **Event Ingestion**: Real-time event collection with batch processing support
- **Metric Aggregation**: Time-series data aggregation with multiple granularities
- **Dashboard Management**: Customizable analytics dashboards
- **Query Analytics**: Advanced querying capabilities for user behavior and system metrics
- **Data Warehousing**: High-performance analytics with ClickHouse integration
- **Real-time Processing**: Kafka integration for event streaming

## API Endpoints

### Events
- `POST /analytics/events` - Create a single event
- `POST /analytics/events/batch` - Create multiple events
- `GET /analytics/events` - Get events with filtering
- `GET /analytics/events/stats` - Get event statistics

### Metrics
- `POST /analytics/metrics` - Create a metric
- `GET /analytics/metrics` - Get metrics with filtering
- `GET /analytics/metrics/aggregate/:name` - Get aggregated metrics

### Dashboards
- `POST /analytics/dashboards` - Create a dashboard
- `GET /analytics/dashboards` - Get user's dashboards
- `GET /analytics/dashboards/:id` - Get dashboard by ID
- `PUT /analytics/dashboards/:id` - Update dashboard
- `DELETE /analytics/dashboards/:id` - Delete dashboard

### Analytics
- `GET /analytics/activity-timeline` - Get user activity timeline
- `GET /analytics/system-health` - Get system health metrics
- `GET /analytics/top-events` - Get top events

## Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=lifeos_analytics

# ClickHouse Configuration (for data warehouse)
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_USERNAME=default
CLICKHOUSE_PASSWORD=

# Kafka Configuration (for event ingestion)
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=analytics-service
KAFKA_GROUP_ID=analytics-group

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Redis Configuration (for caching and queues)
REDIS_HOST=localhost
REDIS_PORT=6379

# Environment
NODE_ENV=development
```

## Database Schema

### Events Table
- `id` (UUID, Primary Key)
- `userId` (UUID, Indexed)
- `sessionId` (UUID)
- `eventType` (Enum: user_action, system_event, business_metric, error, performance)
- `eventName` (String)
- `properties` (JSONB)
- `context` (JSONB)
- `ipAddress` (String)
- `userAgent` (String)
- `timestamp` (Timestamp, Indexed)
- `timezone` (String)

### Metrics Table
- `id` (UUID, Primary Key)
- `name` (String, Indexed)
- `description` (String)
- `type` (Enum: counter, gauge, histogram, summary)
- `granularity` (Enum: minute, hour, day, week, month)
- `category` (String, Indexed)
- `value` (Decimal)
- `tags` (JSONB)
- `metadata` (JSONB)
- `timestamp` (Timestamp, Indexed)

### Dashboards Table
- `id` (UUID, Primary Key)
- `userId` (UUID)
- `name` (String)
- `description` (Text)
- `type` (Enum: user, system, public)
- `config` (JSONB)
- `isActive` (Boolean)
- `permissions` (JSONB)

## Event Types

- **USER_ACTION**: User interactions (clicks, navigation, form submissions)
- **SYSTEM_EVENT**: System-level events (service starts, deployments)
- **BUSINESS_METRIC**: Business KPIs (revenue, conversions)
- **ERROR**: Error events and exceptions
- **PERFORMANCE**: Performance metrics (response times, throughput)

## Metric Types

- **COUNTER**: Monotonically increasing values
- **GAUGE**: Values that can increase or decrease
- **HISTOGRAM**: Distribution of values over time
- **SUMMARY**: Quantiles and sums over sliding time windows

## ClickHouse Integration

For high-performance analytics, events and metrics are also stored in ClickHouse:

```sql
CREATE TABLE events (
  id String,
  userId Nullable(String),
  sessionId Nullable(String),
  eventType Enum('user_action', 'system_event', 'business_metric', 'error', 'performance'),
  eventName String,
  properties String,
  context Nullable(String),
  ipAddress Nullable(String),
  userAgent Nullable(String),
  timestamp DateTime,
  timezone String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (userId, timestamp);
```

## Kafka Integration

Events are streamed through Kafka for real-time processing:

- **Topic**: `lifeos-events`
- **Partitions**: Based on userId for efficient routing
- **Consumer Groups**: Separate groups for different processing needs

## Development

```bash
# Install dependencies
npm install

# Run migrations
npm run migration:run

# Start development server
npm run start:dev

# Run tests
npm run test
```

## Usage Examples

### Creating an Event
```json
{
  "eventType": "user_action",
  "eventName": "task_completed",
  "properties": {
    "taskId": "123",
    "duration": 3600
  },
  "context": {
    "userAgent": "Mozilla/5.0...",
    "ipAddress": "192.168.1.1"
  }
}
```

### Creating a Metric
```json
{
  "name": "api_response_time",
  "type": "histogram",
  "granularity": "minute",
  "category": "performance",
  "value": 245.67,
  "tags": {
    "endpoint": "/api/tasks",
    "method": "GET"
  }
}
```

### Creating a Dashboard
```json
{
  "name": "User Activity Dashboard",
  "description": "Monitor user engagement and activity",
  "config": {
    "widgets": [
      {
        "id": "activity-chart",
        "type": "chart",
        "title": "Daily Active Users",
        "position": { "x": 0, "y": 0, "w": 6, "h": 4 },
        "config": {
          "metric": "daily_active_users",
          "chartType": "line"
        }
      }
    ],
    "layout": "grid",
    "filters": {
      "dateRange": "last_30_days"
    }
  }
}
```

## Security

- JWT authentication for all endpoints
- Rate limiting (100 requests/minute)
- Input validation with class-validator
- Data anonymization for sensitive events
- Row-level security for multi-tenant data

## Performance

- Indexed queries for fast event retrieval
- Time-based partitioning in ClickHouse
- Redis caching for frequently accessed metrics
- Batch processing for high-throughput event ingestion
- Asynchronous metric aggregation