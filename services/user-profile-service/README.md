# User Profile Service

This service manages user profiles, preferences, privacy settings, and connected integrations.

## Features

- User profile management
- Preferences and settings
- Privacy controls
- Integration status tracking
- Data export and anonymization

## API Endpoints

- `GET /api/profile/:userId` - Get user profile
- `POST /api/profile/:userId` - Create user profile
- `PUT /api/profile/:userId` - Update user profile
- `PUT /api/profile/:userId/preferences` - Update preferences
- `PUT /api/profile/:userId/privacy` - Update privacy settings
- `PUT /api/profile/:userId/integrations` - Update integrations
- `GET /api/profile/:userId/export` - Export profile data
- `POST /api/profile/:userId/anonymize` - Anonymize profile
- `DELETE /api/profile/:userId` - Delete profile

## Environment Variables

- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_USERNAME` - PostgreSQL username
- `DB_PASSWORD` - PostgreSQL password
- `DB_NAME` - PostgreSQL database name
- `JWT_SECRET` - JWT secret key

## Development

```bash
npm install
npm run start:dev
```