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

- `POST /api/v1/analytics/events` - Track single event
- `POST /api/v1/analytics/events/batch` - Track multiple events
- `GET /api/v1/analytics/reports/user-activity` - User activity report
- `GET /api/v1/analytics/reports/product-metrics` - Product metrics report
- `GET /api/v1/analytics/reports/retention` - Retention analysis

## Environment Variables

- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_USERNAME` - PostgreSQL username
- `DB_PASSWORD` - PostgreSQL password
- `DB_NAME` - Database name
- `KAFKA_BROKER` - Kafka broker URL
- `GCP_PROJECT_ID` - Google Cloud Project ID
- `GCP_KEY_FILE` - Path to GCP service account key file