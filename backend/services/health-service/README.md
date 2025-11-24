# Health Service

The health and fitness data management service for LifeOS, providing integration with Fitbit and comprehensive health tracking.

## Features

- **Fitbit Integration**: OAuth-based connection to Fitbit API
- **Health Data Sync**: Automatic synchronization of fitness data
- **Vital Signs Tracking**: Heart rate, sleep, activity, and weight data
- **Data Aggregation**: Combined health dashboard and insights
- **Background Processing**: Automated data synchronization jobs
- **Caching**: Redis-based caching for performance

## API Endpoints

### Dashboard
```http
GET /health/dashboard
Authorization: Bearer <jwt-token>
# Returns aggregated health data and insights
```

### Fitbit Integration
```http
GET /health/fitbit/auth
Authorization: Bearer <jwt-token>
# Returns Fitbit authorization URL

GET /health/fitbit/callback?code=<auth-code>&state=<user-id>
# Handles Fitbit OAuth callback

GET /health/fitbit/data?date=2024-01-15
Authorization: Bearer <jwt-token>
# Returns Fitbit data for specific date

GET /health/fitbit/activities?period=7d
Authorization: Bearer <jwt-token>
# Returns activity data for specified period

GET /health/fitbit/sleep?period=30d
Authorization: Bearer <jwt-token>
# Returns sleep data for specified period

GET /health/fitbit/heart?period=1d
Authorization: Bearer <jwt-token>
# Returns heart rate data
```

### Vital Signs
```http
GET /health/vitals
Authorization: Bearer <jwt-token>
# Returns all vital signs data

POST /health/vitals
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "type": "heart_rate",
  "value": 72,
  "unit": "bpm",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Database Schema

### Vital Entity
```typescript
@Entity()
export class Vital {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column()
  type: string; // 'heart_rate', 'sleep', 'weight', 'steps', etc.

  @Column('decimal', { precision: 10, scale: 2 })
  value: number;

  @Column()
  unit: string; // 'bpm', 'hours', 'kg', 'steps', etc.

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ nullable: true })
  source: string; // 'fitbit', 'manual', 'device'

  @Column({ type: 'json', nullable: true })
  metadata: any; // Additional data like sleep stages, activity details

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

## Fitbit Integration

### Setup Process
1. Register application at [Fitbit Developer Portal](https://dev.fitbit.com/)
2. Configure OAuth 2.0 settings:
   - Redirect URI: `http://localhost:3002/health/fitbit/callback`
   - Scopes: `activity`, `heartrate`, `sleep`, `weight`
3. Set environment variables:
   ```env
   FITBIT_CLIENT_ID=your-client-id
   FITBIT_CLIENT_SECRET=your-client-secret
   FITBIT_REDIRECT_URL=http://localhost:3002/health/fitbit/callback
   ```

### Data Synchronization
- **Automatic Sync**: Background jobs run every 6 hours
- **Manual Sync**: API endpoints for on-demand synchronization
- **Data Types**:
  - Daily activity (steps, distance, calories)
  - Heart rate (resting, active, fat burn zones)
  - Sleep (duration, stages, efficiency)
  - Weight and body measurements

### Rate Limiting
Fitbit API has strict rate limits:
- 150 requests per hour per user
- 1,500 requests per day per user
- Automatic retry with exponential backoff

## Background Jobs

### Data Synchronization
- **Queue**: `sync`
- **Processor**: `FitbitSyncProcessor`
- **Schedule**: Every 6 hours for active users
- **Data Types**: Activities, sleep, heart rate, weight

## Caching Strategy

Redis caching for:
- Fitbit API responses (1-hour TTL)
- Aggregated health data (30-minute TTL)
- User dashboard data (15-minute TTL)

Cache keys:
- `health:{userId}:dashboard`
- `fitbit:{userId}:activities:{date}`
- `fitbit:{userId}:sleep:{period}`

## Health Metrics

### Supported Vital Types
- **Heart Rate**: Resting, maximum, average
- **Sleep**: Duration, efficiency, stages (deep, light, REM)
- **Activity**: Steps, distance, calories burned, active minutes
- **Weight**: Weight, BMI, body fat percentage
- **Nutrition**: Water intake, food logging (future)

### Data Aggregation
- **Daily Summaries**: 24-hour health snapshots
- **Weekly Reports**: Trends and patterns
- **Monthly Insights**: Long-term health analysis
- **Goals Tracking**: Progress toward health objectives

## API Response Examples

### Health Dashboard
```json
{
  "today": {
    "steps": 8432,
    "activeMinutes": 67,
    "caloriesBurned": 2450,
    "sleepHours": 7.5,
    "heartRate": {
      "resting": 62,
      "average": 78
    }
  },
  "week": {
    "averageSteps": 9210,
    "averageSleep": 7.8,
    "trends": {
      "steps": "increasing",
      "sleep": "stable"
    }
  },
  "insights": [
    "Great job on your step count this week!",
    "Consider aiming for 8 hours of sleep tonight.",
    "Your resting heart rate is in the optimal range."
  ]
}
```

### Fitbit Data
```json
{
  "activities": {
    "steps": 8432,
    "distance": 6.7,
    "calories": 2450,
    "activeMinutes": 67
  },
  "sleep": {
    "totalMinutesAsleep": 450,
    "efficiency": 92,
    "stages": {
      "deep": 78,
      "light": 245,
      "rem": 89,
      "wake": 38
    }
  },
  "heartRate": {
    "resting": 62,
    "fatBurn": 110,
    "cardio": 140,
    "peak": 170
  }
}
```

## Error Handling

### Fitbit API Errors
- **Token Expired**: Automatic token refresh
- **Rate Limited**: Exponential backoff retry
- **Data Unavailable**: Graceful fallback to cached data
- **Service Down**: Error logging and user notification

### Validation Errors
- **Invalid Dates**: Proper date format validation
- **Missing Permissions**: Clear error messages for required scopes
- **Data Range Limits**: Fitbit API constraints handling

## Development

### Running the Service
```bash
npm install
npm run start:dev
```

### Testing Fitbit Integration
```bash
# Mock Fitbit responses for testing
npm run test:fitbit
```

### Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=lifeos

# JWT
JWT_SECRET=your-jwt-secret

# Fitbit API
FITBIT_CLIENT_ID=your-fitbit-client-id
FITBIT_CLIENT_SECRET=your-fitbit-client-secret
FITBIT_REDIRECT_URL=http://localhost:3002/health/fitbit/callback

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
HEALTH_SERVICE_URL=http://localhost:3002

# Environment
NODE_ENV=development
```

## Monitoring

- **Health Checks**: `/health` endpoint
- **Sync Status**: Track data synchronization success/failure
- **API Usage**: Monitor Fitbit API call patterns
- **Performance**: Response times and cache hit rates

## Architecture

```
Health Service
├── Controllers
│   └── HealthController
├── Services
│   ├── HealthService
│   └── FitbitService
├── Entities
│   └── Vital
├── Processors
│   └── FitbitSyncProcessor
└── DTOs
    ├── FitbitAuthDto
    └── HealthDataDto
```