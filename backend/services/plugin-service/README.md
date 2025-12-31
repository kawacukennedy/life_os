# Plugin Service

The Plugin Service provides a comprehensive plugin marketplace and management system for LifeOS, enabling third-party developers to extend platform functionality.

## Features

- **Plugin Marketplace**: Browse, search, and discover plugins
- **Plugin Management**: Create, publish, and manage plugins
- **Installation System**: Install, uninstall, and configure plugins
- **Developer Tools**: Plugin validation, statistics, and analytics
- **Monetization**: Support for paid plugins and subscriptions
- **Categories & Tags**: Organized plugin discovery
- **Ratings & Reviews**: Community feedback system

## Architecture

### Components

- **Plugin Service**: Core plugin CRUD operations and user installations
- **Marketplace Service**: Discovery, recommendations, and statistics
- **Plugin Entity**: Plugin metadata and manifest storage
- **User Plugin Entity**: Installation tracking and settings

### Plugin Manifest

Plugins are defined by a manifest file that specifies:

```json
{
  "version": "1.0.0",
  "apiVersion": "1.0",
  "permissions": ["read:tasks", "write:tasks"],
  "hooks": ["onTaskCreate", "onTaskUpdate"],
  "settings": [...],
  "entryPoints": {
    "main": "index.js",
    "settings": "settings.js"
  }
}
```

## API Endpoints

### Plugin Management

- `POST /plugins` - Create a new plugin
- `GET /plugins` - List plugins with filtering
- `GET /plugins/:id` - Get plugin details
- `PATCH /plugins/:id` - Update plugin
- `DELETE /plugins/:id` - Delete plugin
- `POST /plugins/:id/publish` - Publish plugin

### Installation

- `POST /plugins/:id/install` - Install plugin
- `POST /plugins/:id/uninstall` - Uninstall plugin
- `GET /plugins/user/installed` - Get user installed plugins
- `PATCH /plugins/:id/settings` - Update plugin settings
- `POST /plugins/:id/toggle` - Enable/disable plugin

### Marketplace

- `GET /marketplace/stats` - Get marketplace statistics
- `GET /marketplace/recommendations` - Get personalized recommendations
- `GET /plugins/popular` - Get popular plugins
- `GET /plugins/featured` - Get featured plugins
- `GET /plugins/search` - Search plugins

## Plugin Categories

- **productivity**: Task management, time tracking, automation
- **health**: Fitness tracking, health monitoring, wellness
- **finance**: Budgeting, expense tracking, financial insights
- **social**: Social features, networking, communication
- **integration**: Third-party service integrations
- **utility**: General utilities and tools
- **customization**: Themes, layouts, personalization

## Permissions System

Plugins can request the following permissions:

- `read:user` - Read user profile data
- `write:user` - Modify user profile
- `read:tasks` - Access task data
- `write:tasks` - Create/modify tasks
- `read:health` - Access health data
- `write:health` - Modify health data
- `read:finance` - Access financial data
- `write:finance` - Modify financial data
- `read:calendar` - Access calendar data
- `write:calendar` - Modify calendar events
- `notifications` - Send notifications
- `storage` - Persistent storage access

## Development Workflow

### Creating a Plugin

1. **Define Manifest**: Create plugin manifest with permissions and hooks
2. **Implement Code**: Write plugin logic using LifeOS SDK
3. **Test Locally**: Test plugin in development environment
4. **Submit for Review**: Upload to marketplace for approval
5. **Publish**: Make plugin available to users

### Plugin Lifecycle

1. **Draft**: Plugin in development
2. **Pending Review**: Submitted for marketplace approval
3. **Approved**: Passed review, ready for publishing
4. **Published**: Available in marketplace
5. **Deprecated**: Marked for removal

## Installation Process

1. User discovers plugin in marketplace
2. Clicks install button
3. System validates permissions and compatibility
4. Downloads and installs plugin code
5. Initializes plugin with user settings
6. Registers hooks and integrations
7. Marks as installed and ready to use

## Monetization

### Pricing Models

- **Free**: No cost plugins
- **One-time**: Single purchase
- **Subscription**: Recurring payments

### Revenue Sharing

- Platform takes percentage of sales
- Developers receive majority of revenue
- Premium features and enterprise tiers

## Security

- **Permission Validation**: Strict permission checking
- **Code Review**: Manual review for published plugins
- **Sandboxing**: Isolated execution environment
- **Update Validation**: Secure update process
- **Audit Logging**: Comprehensive activity logging

## Analytics

### Plugin Metrics

- Install count and trends
- Usage statistics and engagement
- Rating and review analytics
- Revenue and conversion metrics

### Developer Dashboard

- Plugin performance metrics
- User feedback and reviews
- Installation analytics
- Revenue reporting

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Run tests
npm test

# Validate plugin manifest
curl -X POST http://localhost:3009/marketplace/validate-manifest \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

## Environment Variables

- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_USERNAME` - PostgreSQL username
- `DB_PASSWORD` - PostgreSQL password
- `DB_NAME` - Database name (default: lifeos_plugins)
- `JWT_SECRET` - JWT signing secret
- `PLUGIN_STORAGE_PATH` - Plugin file storage path

## API Versioning

Plugins specify API version compatibility in their manifest. Breaking changes require manifest updates and re-approval.