# Analytics Service

Event processing and analytics service for LifeOS.

## Features

- Event tracking and processing
- Real-time analytics
- BigQuery integration for long-term storage
- Kafka event streaming
- User activity reports
- Product metrics and retention analysis

## API Endpoints

### Track Events

#### POST /api/v1/analytics/events
Track a single analytics event.

**Request Body:**
```json
{
  "userId": "string",
  "eventType": "string",
  "properties": {},
  "sessionId": "string (optional)",
  "deviceInfo": {} (optional)
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "uuid"
}
```

#### POST /api/v1/analytics/events/batch
Track multiple analytics events.

**Request Body:**
```json
[
  {
    "userId": "string",
    "eventType": "string",
    "properties": {}
  }
]
```

**Response:**
```json
{
  "success": true,
  "eventsTracked": 5
}
```

### Reports

#### GET /api/v1/analytics/reports/user-activity
Get user activity report for a date range.

**Query Parameters:**
- `userId` (required): User identifier
- `startDate` (required): Start date (YYYY-MM-DD)
- `endDate` (required): End date (YYYY-MM-DD)

**Response:**
```json
{
  "userId": "string",
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "activity": {
    "2024-01-15": {
      "page_view": 3,
      "button_click": 1
    }
  },
  "totalEvents": 4
}
```

#### GET /api/v1/analytics/reports/product-metrics
Get product-wide metrics report.

**Query Parameters:**
- `startDate` (required): Start date (YYYY-MM-DD)
- `endDate` (required): End date (YYYY-MM-DD)

**Response:**
```json
{
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "metrics": {
    "totalEvents": 1000,
    "uniqueUsers": 150,
    "eventsByType": {
      "page_view": 500,
      "button_click": 300
    }
  }
}
```

#### GET /api/v1/analytics/reports/retention
Get user retention analysis.

**Query Parameters:**
- `cohort` (required): Cohort identifier
- `periods` (required): Number of periods to analyze

**Response:**
```json
{
  "cohort": "2024-01",
  "periods": 3,
  "retention": {
    "day1": 0.85,
    "day7": 0.65,
    "day30": 0.45
  }
}
```

## Environment Variables

- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_USERNAME` - PostgreSQL username
- `DB_PASSWORD` - PostgreSQL password
- `DB_NAME` - Database name
- `KAFKA_BROKER` - Kafka broker URL
- `GCP_PROJECT_ID` - Google Cloud Project ID
- `GCP_KEY_FILE` - Path to GCP service account key file

## Architecture

The analytics service uses a hybrid storage approach:
- **PostgreSQL**: Fast queries for recent data and real-time analytics
- **BigQuery**: Long-term storage and complex analytical queries
- **Kafka**: Event streaming for real-time processing

Events are processed through the following pipeline:
1. Event ingestion via REST API
2. Validation and normalization
3. Storage in PostgreSQL for immediate access
4. Streaming to Kafka for real-time processing
5. Batch export to BigQuery for historical analysis

## Data Retention

- PostgreSQL: 90 days of raw events
- BigQuery: Unlimited historical data with lifecycle policies
- Aggregated reports cached for 24 hours

## Monitoring

The service exposes Prometheus metrics:
- `analytics_events_processed_total`: Total events processed
- `analytics_processing_duration_seconds`: Event processing duration
- `analytics_bigquery_insert_duration_seconds`: BigQuery insert duration