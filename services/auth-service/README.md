# Auth Service

The authentication and user management service for LifeOS, handling user registration, login, profile management, and third-party integrations.

## Features

- **User Authentication**: JWT-based authentication with secure password hashing
- **Google OAuth**: Social login integration with Google
- **Profile Management**: User profile updates and avatar uploads
- **Google Calendar Integration**: OAuth flow and event management
- **Background Processing**: Email and notification job queues
- **Caching**: Redis-based caching for performance
- **Rate Limiting**: Request throttling for security

## API Endpoints

### Authentication
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "fullName": "John Doe",
  "timezone": "America/New_York"
}
```

### Google OAuth
```http
GET /auth/google
# Redirects to Google OAuth consent screen

GET /auth/google/callback
# Handles OAuth callback and redirects with tokens
```

### Profile Management
```http
GET /auth/dashboard
Authorization: Bearer <jwt-token>
# Returns user dashboard with integrated data preview
```

```http
POST /auth/upload/avatar
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data

# File: avatar (image file)
```

```http
DELETE /auth/upload/avatar
Authorization: Bearer <jwt-token>
# Deletes user avatar
```

### Google Calendar Integration
```http
GET /auth/google/calendar/auth
Authorization: Bearer <jwt-token>
# Returns Google Calendar authorization URL

GET /auth/google/calendar/callback?code=<auth-code>&state=<user-id>
# Handles calendar authorization callback

GET /auth/google/calendar/events?timeMin=2024-01-01T00:00:00Z&timeMax=2024-01-31T23:59:59Z
Authorization: Bearer <jwt-token>
# Returns user's calendar events

POST /auth/google/calendar/events
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "summary": "Meeting with Team",
  "start": {
    "dateTime": "2024-01-15T10:00:00Z"
  },
  "end": {
    "dateTime": "2024-01-15T11:00:00Z"
  }
}
```

## Database Schema

### User Entity
```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  timezone: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 'user' })
  role: string;

  // Integration tokens stored as JSON
  @Column({ type: 'json', nullable: true })
  googleTokens: {
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
  };

  @Column({ type: 'json', nullable: true })
  fitbitTokens: {
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
  };

  @Column({ type: 'json', nullable: true })
  plaidTokens: {
    accessToken: string;
    itemId: string;
  };

  @Column({ type: 'json', nullable: true })
  preferences: {
    notifications: boolean;
    theme: string;
    language: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastActiveAt: Date;
}
```

## Third-Party Integrations

### Google OAuth Setup
1. Create OAuth 2.0 credentials in Google Cloud Console
2. Configure authorized redirect URIs:
   - `http://localhost:3001/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)
3. Set environment variables:
   ```env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URL=http://localhost:3001/auth/google/callback
   ```

### Google Calendar Integration
Uses separate OAuth flow for calendar access with these scopes:
- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/calendar.events`

## Background Jobs

### Email Processing
- **Queue**: `email`
- **Processor**: `EmailProcessor`
- **Jobs**: Welcome emails, password resets, notifications

### Notification Processing
- **Queue**: `notification`
- **Processor**: `NotificationProcessor`
- **Channels**: In-app, email, push, SMS

## Caching Strategy

Redis caching is implemented for:
- User profile data (5-minute TTL)
- API responses (5-minute TTL)
- Third-party API responses (varies by endpoint)

Cache keys follow the pattern:
- `user:{userId}:profile`
- `user:{userId}:dashboard`
- `thirdparty:google:{userId}:calendar`

## Security Features

- **Password Hashing**: bcrypt with salt rounds of 12
- **JWT Tokens**: 15-minute expiration with refresh tokens
- **Rate Limiting**: 10 requests per minute per IP
- **Input Validation**: Comprehensive DTOs with class-validator
- **CORS**: Configured for cross-origin requests

## Development

### Running the Service
```bash
# Install dependencies
npm install

# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

### Database Operations
```bash
# Run migrations
npm run migration:run

# Generate migration
npm run migration:generate -- -n AddNewField

# Revert migration
npm run migration:revert
```

### Testing
```bash
# Unit tests
npm run test

# Test coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=lifeos

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URL=http://localhost:3001/auth/google/callback

# Google Calendar
GOOGLE_CALENDAR_CLIENT_ID=your-calendar-client-id
GOOGLE_CALENDAR_CLIENT_SECRET=your-calendar-client-secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
HEALTH_SERVICE_URL=http://localhost:3002
FINANCE_SERVICE_URL=http://localhost:3003
LEARNING_SERVICE_URL=http://localhost:3004
NOTIFICATION_SERVICE_URL=http://localhost:3005

# Logging
LOG_LEVEL=info

# File Uploads
BASE_URL=http://localhost:3001

# Environment
NODE_ENV=development
```

## API Documentation

Access Swagger documentation at: `http://localhost:3001/api`

## Error Handling

The service implements comprehensive error handling with:
- Structured error responses
- Proper HTTP status codes
- Detailed error logging
- Graceful degradation for external service failures

## Monitoring

- **Health Checks**: `/health` endpoint
- **Metrics**: Request counts, response times, error rates
- **Logs**: Structured JSON logging with Winston
- **Performance**: Response time monitoring

## Architecture

```
Auth Service
├── Controllers (API endpoints)
├── Services (business logic)
│   ├── AuthService (authentication)
│   ├── GoogleCalendarService (calendar integration)
│   ├── FileService (file uploads)
│   ├── CacheService (Redis caching)
│   └── BackgroundJobService (queue management)
├── Processors (Bull queue workers)
│   ├── EmailProcessor
│   └── NotificationProcessor
├── Guards (authentication/authorization)
├── Strategies (Passport.js strategies)
└── Entities (database models)
```