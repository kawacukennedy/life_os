# Notification Service

Multi-channel notification delivery service for LifeOS, providing real-time notifications across email, SMS, push, and in-app channels.

## Features

- **Multi-Channel Delivery**: Email, SMS, push notifications, and in-app messages
- **Real-time Notifications**: WebSocket-based real-time delivery
- **Template System**: Customizable notification templates
- **Delivery Tracking**: Message status and delivery confirmation
- **User Preferences**: Channel preferences and notification settings
- **Background Processing**: Asynchronous notification queuing

## API Endpoints

### Notifications
```http
GET /notifications?page=1&limit=20&status=unread
Authorization: Bearer <jwt-token>
# Returns user's notifications with pagination

GET /notifications/:notificationId
Authorization: Bearer <jwt-token>
# Returns specific notification details

PUT /notifications/:notificationId/read
Authorization: Bearer <jwt-token>
# Marks notification as read

DELETE /notifications/:notificationId
Authorization: Bearer <jwt-token>
# Deletes a notification
```

### Notification Management
```http
POST /notifications
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "userId": "user-123",
  "title": "Welcome to LifeOS!",
  "message": "Your account has been created successfully.",
  "type": "welcome",
  "channels": ["in_app", "email"],
  "priority": "normal"
}
```

### User Preferences
```http
GET /notifications/preferences
Authorization: Bearer <jwt-token>
# Returns user's notification preferences

PUT /notifications/preferences
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "email": true,
  "sms": false,
  "push": true,
  "marketing": false
}
```

## Database Schema

### Notification Entity
```typescript
@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column()
  type: string; // 'welcome', 'reminder', 'achievement', 'system', etc.

  @Column({ default: 'normal' })
  priority: 'low' | 'normal' | 'high' | 'urgent';

  @Column({ default: false })
  read: boolean;

  @Column({ nullable: true })
  readAt: Date;

  @Column({ type: 'json', nullable: true })
  channels: {
    in_app: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  };

  @Column({ type: 'json', nullable: true })
  deliveryStatus: {
    in_app?: 'pending' | 'sent' | 'failed';
    email?: 'pending' | 'sent' | 'failed';
    sms?: 'pending' | 'sent' | 'failed';
    push?: 'pending' | 'sent' | 'failed';
  };

  @Column({ type: 'json', nullable: true })
  metadata: any; // Additional context data

  @Column({ nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

## Notification Channels

### In-App Notifications
- **Delivery**: Real-time via WebSocket
- **Storage**: Database persistence
- **Retention**: Configurable expiration (default: 30 days)
- **Features**: Read/unread status, categorization

### Email Notifications
- **Provider**: Nodemailer with SMTP
- **Templates**: Handlebars-based templates
- **Tracking**: Delivery status and open tracking
- **Features**: HTML content, attachments support

### SMS Notifications
- **Provider**: Twilio integration
- **Features**: Text-only messages, delivery receipts
- **Limitations**: 160 characters per message
- **Cost**: Pay-per-message pricing

### Push Notifications
- **Platform**: Firebase Cloud Messaging (FCM)
- **Features**: Rich notifications, deep linking
- **Targeting**: Device-specific delivery
- **Analytics**: Open rates and engagement tracking

## Background Jobs

### Notification Processing
- **Queue**: `notification`
- **Processor**: `NotificationProcessor`
- **Channels**: Processes notifications for each delivery channel
- **Retry Logic**: Failed deliveries with exponential backoff

## WebSocket Integration

### Real-time Delivery
```typescript
// Client connection
const socket = io('http://localhost:3005');

// Authentication
socket.emit('authenticate', { token: jwtToken });

// Listen for notifications
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
});

// Mark as read
socket.emit('mark-read', { notificationId: '123' });
```

### Gateway Configuration
- **Namespace**: `/notifications`
- **Authentication**: JWT token validation
- **Rooms**: User-specific notification rooms
- **Events**: `notification`, `mark-read`, `preferences-updated`

## Template System

### Email Templates
```handlebars
<!-- welcome.hbs -->
<h1>Welcome to LifeOS, {{userName}}!</h1>
<p>Your account has been successfully created.</p>
<p>Get started by exploring your personalized dashboard.</p>
<a href="{{dashboardUrl}}" class="btn">Go to Dashboard</a>
```

### Notification Types
- **System**: Account changes, security alerts
- **Achievement**: Goal completion, milestones
- **Reminder**: Scheduled tasks, appointments
- **Marketing**: Feature updates, tips
- **Social**: Friend activities, mentions

## API Response Examples

### Notification List
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

### User Preferences
```json
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
      "enabled": false,
      "types": {
        "system": true,
        "achievement": false
      }
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

## Error Handling

### Delivery Failures
- **Retry Logic**: Up to 3 attempts with exponential backoff
- **Fallback Channels**: Alternative delivery methods
- **Error Logging**: Detailed failure analysis
- **User Alerts**: Notification of delivery issues

### Validation Errors
- **Channel Validation**: Ensure supported channels
- **Template Errors**: Template rendering failures
- **Rate Limiting**: Prevent spam and abuse

## Development

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

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Push Notifications (Firebase)
FCM_SERVER_KEY=your-fcm-server-key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
NOTIFICATION_SERVICE_URL=http://localhost:3005

# Environment
NODE_ENV=development
```

## Monitoring

- **Delivery Metrics**: Success rates by channel
- **Performance**: Processing times and queue depths
- **User Engagement**: Open rates and interaction tracking
- **System Health**: WebSocket connections and service status

## Architecture

```
Notification Service
├── Controllers
│   └── NotificationController
├── Services
│   ├── NotificationService
│   └── NotificationGateway (WebSocket)
├── Entities
│   └── Notification
├── Processors
│   └── NotificationProcessor
├── Templates
│   ├── email/
│   └── sms/
└── DTOs
    ├── NotificationDto
    └── PreferencesDto
```