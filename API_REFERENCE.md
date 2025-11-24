# LifeOS API Reference

Complete API reference for all LifeOS backend services. All endpoints require proper authentication unless specified otherwise.

## Authentication

### JWT Token Usage
Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Token Expiration
- Access tokens expire in 15 minutes
- Refresh tokens expire in 30 days
- Use `/auth/refresh` endpoint to get new tokens

## Core Endpoints

### Authentication Service (Port 3001)

#### User Registration
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "fullName": "John Doe",
  "timezone": "America/New_York"
}
```

**Response (201):**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "fullName": "John Doe",
  "timezone": "America/New_York",
  "isActive": true,
  "role": "user",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### User Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh-token-here",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

#### Get Dashboard
```http
GET /auth/dashboard
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "tiles": [
    {
      "id": "health",
      "type": "health",
      "data": { "score": 78 }
    },
    {
      "id": "finance",
      "type": "finance",
      "data": { "balance": 2500.50 }
    }
  ],
  "suggestions": [
    "Consider reviewing your budget goals",
    "Great job on your step count this week"
  ]
}
```

#### Google OAuth
```http
GET /auth/google
# Redirects to Google OAuth consent screen

GET /auth/google/callback
# Handles OAuth callback (automatic redirect)
```

#### Google Calendar Integration
```http
GET /auth/google/calendar/auth
Authorization: Bearer <token>
# Returns: { "authUrl": "https://accounts.google.com/..." }

GET /auth/google/calendar/callback?code=<code>&state=<userId>
# Handles calendar authorization

GET /auth/google/calendar/events?timeMin=2024-01-01T00:00:00Z&timeMax=2024-01-31T23:59:59Z
Authorization: Bearer <token>
# Returns user's calendar events

POST /auth/google/calendar/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "summary": "Team Meeting",
  "start": { "dateTime": "2024-01-15T10:00:00Z" },
  "end": { "dateTime": "2024-01-15T11:00:00Z" }
}
```

#### File Upload
```http
POST /auth/upload/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

# File field: avatar (image file, max 5MB)
```

**Response (200):**
```json
{
  "filename": "avatar-uuid.jpg",
  "url": "http://localhost:3001/uploads/avatars/avatar-uuid.jpg"
}
```

### Health Service (Port 3002)

#### Get Dashboard
```http
GET /health/dashboard
Authorization: Bearer <token>
```

**Response (200):**
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
    "Consider aiming for 8 hours of sleep tonight."
  ]
}
```

#### Fitbit Integration
```http
GET /health/fitbit/auth
Authorization: Bearer <token>
# Returns: { "authUrl": "https://www.fitbit.com/..." }

GET /health/fitbit/callback?code=<code>&state=<userId>
# Handles Fitbit OAuth callback

GET /health/fitbit/data?date=2024-01-15
Authorization: Bearer <token>
# Returns Fitbit data for specific date

GET /health/fitbit/activities?period=7d
Authorization: Bearer <token>
# Returns activity data for specified period

GET /health/fitbit/sleep?period=30d
Authorization: Bearer <token>
# Returns sleep data for specified period

GET /health/fitbit/heart?period=1d
Authorization: Bearer <token>
# Returns heart rate data
```

#### Vital Signs
```http
GET /health/vitals
Authorization: Bearer <token>
# Returns all vital signs data

POST /health/vitals
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "heart_rate",
  "value": 72,
  "unit": "bpm",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Finance Service (Port 3003)

#### Account Management
```http
GET /finance/accounts
Authorization: Bearer <token>
# Returns linked financial accounts

GET /finance/accounts/:accountId
Authorization: Bearer <token>
# Returns specific account details
```

**Response (200):**
```json
{
  "accounts": [
    {
      "id": "acc_123",
      "name": "Checking Account",
      "type": "checking",
      "subtype": "checking",
      "mask": "1234",
      "balances": {
        "current": 2500.50,
        "available": 2450.50,
        "currency": "USD"
      },
      "institution": {
        "name": "Chase",
        "logo": "https://..."
      }
    }
  ]
}
```

#### Transactions
```http
GET /finance/transactions?page=1&limit=50&start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <token>
# Returns paginated transaction history
```

**Response (200):**
```json
{
  "transactions": [
    {
      "id": "txn_456",
      "amount": -25.99,
      "currency": "USD",
      "date": "2024-01-15",
      "description": "Grocery Store Purchase",
      "merchantName": "Whole Foods",
      "category": "Food & Dining",
      "location": {
        "city": "San Francisco",
        "region": "CA"
      },
      "status": "posted"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1250
  }
}
```

#### Plaid Integration
```http
GET /finance/plaid/auth
Authorization: Bearer <token>
# Returns Plaid Link token

POST /finance/plaid/webhook
# Handles Plaid webhooks (no auth required)

GET /finance/plaid/institutions
Authorization: Bearer <token>
# Returns supported financial institutions
```

### Learning Service (Port 3004)

#### Courses
```http
GET /learning/courses
Authorization: Bearer <token>
# Returns available courses

GET /learning/courses/:courseId
Authorization: Bearer <token>
# Returns course details and content
```

**Response (200):**
```json
{
  "courses": [
    {
      "id": "course-123",
      "title": "Personal Finance Fundamentals",
      "description": "Master the basics of financial planning",
      "category": "Finance",
      "difficulty": "beginner",
      "estimatedHours": 8,
      "thumbnailUrl": "https://...",
      "progress": {
        "percentage": 65,
        "timeSpent": 18000,
        "completedModules": 3,
        "totalModules": 5
      }
    }
  ]
}
```

#### Progress Tracking
```http
GET /learning/progress
Authorization: Bearer <token>
# Returns user's learning progress across all courses

GET /learning/progress/:courseId
Authorization: Bearer <token>
# Returns progress for specific course

POST /learning/progress
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": "course-123",
  "moduleId": "module-456",
  "lessonId": "lesson-789",
  "progress": 100,
  "timeSpent": 1800,
  "completed": true
}
```

#### Analytics
```http
GET /learning/analytics
Authorization: Bearer <token>
# Returns learning analytics and insights

GET /learning/analytics/streaks
Authorization: Bearer <token>
# Returns learning streak information
```

### Notification Service (Port 3005)

#### Notifications
```http
GET /notifications?page=1&limit=20&status=unread
Authorization: Bearer <token>
# Returns user's notifications with pagination

GET /notifications/:notificationId
Authorization: Bearer <token>
# Returns specific notification details

PUT /notifications/:notificationId/read
Authorization: Bearer <token>
# Marks notification as read

DELETE /notifications/:notificationId
Authorization: Bearer <token>
# Deletes a notification
```

**Response (200):**
```json
{
  "notifications": [
    {
      "id": "notif-123",
      "title": "Welcome to LifeOS!",
      "message": "Your account setup is complete.",
      "type": "welcome",
      "priority": "normal",
      "read": false,
      "channels": {
        "in_app": true,
        "email": true
      },
      "deliveryStatus": {
        "in_app": "sent",
        "email": "sent"
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "unreadCount": 12
  }
}
```

#### Notification Management
```http
POST /notifications
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-123",
  "title": "System Update",
  "message": "New features are now available.",
  "type": "system",
  "channels": ["in_app", "email"],
  "priority": "normal"
}
```

#### User Preferences
```http
GET /notifications/preferences
Authorization: Bearer <token>
# Returns user's notification preferences

PUT /notifications/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "channels": {
    "email": {
      "enabled": true,
      "types": {
        "system": true,
        "achievement": true,
        "reminder": true,
        "marketing": false
      }
    },
    "sms": {
      "enabled": false
    },
    "push": {
      "enabled": true,
      "quietHours": {
        "enabled": true,
        "start": "22:00",
        "end": "08:00"
      }
    }
  }
}
```

### API Gateway (Port 3000)

#### Health Check
```http
GET /health
# Returns gateway and service health status

GET /status
# Returns detailed service status and metrics
```

#### Aggregated Dashboard
```http
GET /api/dashboard
Authorization: Bearer <token>
# Aggregates dashboard data from all services

GET /api/profile
Authorization: Bearer <token>
# Returns complete user profile with integrated data
```

## Error Responses

### Common HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (resource already exists)
- **422**: Unprocessable Entity (validation failed)
- **429**: Too Many Requests (rate limited)
- **500**: Internal Server Error
- **502**: Bad Gateway (service unavailable)
- **503**: Service Unavailable

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": {
      "field": "email",
      "value": null
    },
    "timestamp": "2024-01-15T10:00:00Z",
    "requestId": "req-12345"
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_FAILED`: Invalid credentials
- `TOKEN_EXPIRED`: JWT token has expired
- `TOKEN_INVALID`: JWT token is malformed
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `EXTERNAL_API_ERROR`: Third-party service error
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SERVICE_UNAVAILABLE`: Service is temporarily down

## Rate Limiting

### Limits by Endpoint Type
- **Authentication**: 10 requests per minute per IP
- **API Endpoints**: 100 requests per minute per user
- **File Uploads**: 5 uploads per minute per user
- **External APIs**: Varies by provider (Fitbit: 150/hr, Plaid: custom)

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 60
```

## Data Formats

### Date/Time Format
All dates use ISO 8601 format:
```json
"2024-01-15T10:30:00Z"
"2024-01-15T10:30:00.000Z"
```

### Currency Format
Monetary values use decimal format:
```json
{
  "amount": 123.45,
  "currency": "USD"
}
```

### Pagination Format
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Webhooks

### Plaid Webhooks
```http
POST /finance/plaid/webhook
Content-Type: application/json
X-Plaid-Signature: <signature>

{
  "webhook_type": "TRANSACTIONS",
  "webhook_code": "INITIAL_UPDATE",
  "item_id": "item_id",
  "new_transactions": 5
}
```

### Fitbit Webhooks (Future)
```http
POST /health/fitbit/webhook
Content-Type: application/json

{
  "collectionType": "activities",
  "date": "2024-01-15",
  "ownerId": "user_id",
  "ownerType": "user",
  "subscriptionId": "subscription_id"
}
```

## SDKs and Libraries

### JavaScript/TypeScript Client
```typescript
import { LifeOSClient } from '@lifeos/sdk';

const client = new LifeOSClient({
  baseURL: 'http://localhost:3000',
  apiKey: 'your-api-key'
});

// Authenticate
const tokens = await client.auth.login({
  email: 'user@example.com',
  password: 'password'
});

// Use authenticated client
client.setAuthToken(tokens.accessToken);

const dashboard = await client.getDashboard();
const health = await client.health.getDashboard();
```

### Mobile SDKs (Future)
- **React Native**: `npm install @lifeos/react-native-sdk`
- **iOS**: `pod 'LifeOS-iOS'`
- **Android**: `implementation 'com.lifeos:android-sdk'`

## Versioning

### API Versioning Strategy
- **URL Path Versioning**: `/v1/auth/login`
- **Header Versioning**: `Accept: application/vnd.lifeos.v1+json`
- **Backward Compatibility**: Maintain support for 2 major versions

### Breaking Changes
- Major version bumps for breaking changes
- Deprecation warnings 6 months before removal
- Migration guides provided

## Support

### Getting Help
- **API Documentation**: Visit `/api` for interactive docs
- **Status Page**: Check service status and incidents
- **Community Forum**: Ask questions and share solutions
- **Support Tickets**: Create tickets for technical issues

### Service Level Agreements
- **Uptime**: 99.9% availability target
- **Response Time**: <200ms for cached requests, <2s for API calls
- **Support**: 24/7 for critical issues, business hours for general support

This API reference provides comprehensive documentation for integrating with LifeOS services. For the latest updates, always refer to the interactive API documentation at `/api` endpoints.