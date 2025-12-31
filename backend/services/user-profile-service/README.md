# User Profile Service

The User Profile Service manages user profiles, preferences, privacy settings, and account management for LifeOS.

## Features

- **Profile Management**: Complete user profile CRUD operations
- **Privacy Controls**: Granular privacy settings and data sharing controls
- **Preferences**: Theme, language, notification, and custom preferences
- **Avatar Upload**: Profile picture management
- **Onboarding**: User onboarding flow and progress tracking
- **Data Export/Deletion**: GDPR-compliant data export and account deletion
- **Profile Search**: Search public profiles with privacy respect

## API Endpoints

### Profile Management

- `POST /profiles` - Create a new profile
- `GET /profiles/me` - Get current user profile
- `PATCH /profiles/me` - Update profile
- `DELETE /profiles/me` - Delete profile

### Preferences

- `GET /profiles/me/preferences` - Get user preferences
- `PATCH /profiles/me/preferences` - Update preferences
- `GET /profiles/me/notifications` - Get notification settings

### Privacy

- `GET /profiles/me/privacy` - Get privacy settings
- `PATCH /profiles/me/privacy` - Update privacy settings
- `POST /profiles/me/export` - Export user data

### Public Features

- `GET /profiles/public/:userId` - Get public profile
- `GET /profiles/search` - Search public profiles

### Media

- `POST /profiles/me/avatar` - Upload avatar

### Onboarding

- `POST /profiles/me/onboarding/complete` - Complete onboarding
- `PATCH /profiles/me/onboarding/progress` - Update progress

## Data Model

```typescript
interface UserProfile {
  userId: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  dateOfBirth?: Date;
  timezone?: string;
  location?: string;
  language: Language;
  theme: Theme;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  aiSuggestions: boolean;
  dataSharing: boolean;
  analyticsTracking: boolean;
  profilePrivacy: PrivacyLevel;
  activityPrivacy: PrivacyLevel;
  customPreferences?: any;
  notificationSettings?: any;
  privacySettings?: any;
  onboardingCompleted: boolean;
  onboardingProgress?: any;
}
```

## Privacy Levels

- **Public**: Profile visible to everyone
- **Friends**: Profile visible to connections (future feature)
- **Private**: Profile hidden from public

## Preferences

### Themes
- Light
- Dark
- System (follows device setting)

### Languages
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Russian (ru)
- Chinese (zh)
- Japanese (ja)
- Korean (ko)

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

## Environment Variables

- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_USERNAME` - PostgreSQL username
- `DB_PASSWORD` - PostgreSQL password
- `DB_NAME` - Database name (default: lifeos_profiles)
- `JWT_SECRET` - JWT signing secret
- `UPLOAD_PATH` - Avatar upload path (default: ./uploads/avatars)

## File Upload

Avatars are stored locally in the `uploads/avatars` directory. In production, consider using cloud storage like AWS S3.

## GDPR Compliance

- Data export functionality for user data portability
- Account deletion with complete data removal
- Granular privacy controls
- Consent management for data processing
- Audit logging for privacy-related actions