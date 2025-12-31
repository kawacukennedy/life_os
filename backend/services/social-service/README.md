# Social Service

The Social Service provides user connection management, social networking features, and intelligent user recommendations for LifeOS.

## Features

- **Connection Management**: Send, accept, and manage connection requests
- **Social Networking**: Friend connections, professional networking, mentoring
- **User Recommendations**: AI-powered suggestions for meaningful connections
- **Privacy Controls**: Block/unblock users, connection visibility settings
- **Activity Sharing**: Share goals and achievements with connections
- **Compatibility Matching**: Find users with similar goals and interests

## Architecture

### Components

- **Connections Service**: Manages user relationships and connection requests
- **Recommendations Service**: Provides intelligent user matching algorithms
- **Connection Entity**: Stores relationship data and metadata

### Connection Types

- **friend**: Personal friendships
- **colleague**: Professional work connections
- **mentor**: Mentorship relationships
- **mentee**: Learning relationships
- **family**: Family connections
- **acquaintance**: Casual connections

### Connection States

- **pending**: Request sent, awaiting response
- **accepted**: Mutual connection established
- **blocked**: User blocked, no interaction allowed
- **muted**: Connection muted, limited visibility

## API Endpoints

### Connections

- `POST /connections` - Send connection request
- `GET /connections` - Get user connections
- `GET /connections/pending` - Get pending requests
- `GET /connections/accepted` - Get accepted connections
- `GET /connections/stats` - Get connection statistics
- `PATCH /connections/:id` - Update connection (accept/reject)
- `DELETE /connections/:id` - Remove connection
- `POST /connections/:userId/block` - Block user
- `POST /connections/:userId/unblock` - Unblock user

### Recommendations

- `POST /recommendations` - Get personalized recommendations
- `GET /recommendations/similar` - Get similar users
- `POST /recommendations/goals` - Get goal-based recommendations
- `POST /recommendations/activity` - Get activity-based recommendations

## Recommendation Algorithm

### Compatibility Scoring

The recommendation system calculates compatibility based on:

- **Goals (20 points each)**: Shared objectives and aspirations
- **Interests (15 points each)**: Common hobbies and activities
- **Location (10 points)**: Same geographic area
- **Timezone (3-8 points)**: Time zone compatibility
- **Fitness Level (5 points)**: Similar activity levels
- **Work Type (5 points)**: Compatible work styles

### Recommendation Types

- **Personalized**: Overall compatibility matching
- **Goal-based**: Users with similar objectives
- **Interest-based**: Users with shared hobbies
- **Location-based**: Users in same area
- **Lifestyle-based**: Similar daily patterns

## Privacy & Safety

### Connection Privacy

- Users control who can see their connections
- Private profiles hide connection information
- Blocked users cannot interact or view profile

### Data Protection

- Connection data encrypted at rest
- User consent required for recommendations
- Audit logging for safety monitoring
- Data export and deletion capabilities

## Usage Examples

### Send Connection Request

```typescript
const response = await fetch('/connections', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    addresseeId: 'user123',
    type: 'colleague',
    message: 'I saw we work in similar fields',
    sharedGoals: ['career_growth', 'skill_development'],
  }),
});
```

### Get Recommendations

```typescript
const response = await fetch('/recommendations', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userProfile: {
      userId: 'currentUser',
      goals: ['fitness', 'learning'],
      interests: ['technology', 'health'],
      location: 'San Francisco',
      fitnessLevel: 'intermediate',
    },
    allUsers: [...], // Array of all user profiles
    limit: 10,
  }),
});
```

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
- `DB_NAME` - Database name (default: lifeos_social)
- `JWT_SECRET` - JWT signing secret

## Future Enhancements

- **Groups & Communities**: Interest-based groups
- **Events & Meetups**: Social event coordination
- **Messaging**: In-app messaging system
- **Activity Feeds**: Social activity sharing
- **Gamification**: Connection milestones and badges
- **Advanced Matching**: ML-powered compatibility algorithms