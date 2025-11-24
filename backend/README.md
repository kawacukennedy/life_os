# LifeOS Backend

A comprehensive microservices-based backend for LifeOS, providing integrated health, finance, learning, and notification management with third-party API integrations.

## Architecture

LifeOS Backend follows a microservices architecture with the following services:

- **API Gateway**: Entry point for all client requests, handles routing and authentication
- **Auth Service**: User authentication, authorization, and profile management
- **Health Service**: Fitness tracking and health data integration (Fitbit)
- **Finance Service**: Financial data management and banking integration (Plaid)
- **Learning Service**: Course management and progress tracking
- **Notification Service**: Multi-channel notification delivery

## Tech Stack

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis
- **Message Queue**: Bull (Redis-based)
- **Authentication**: JWT with Passport.js
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Google OAuth integration
- Role-based access control
- Secure password hashing

### 📊 Data Integration
- **Google Calendar**: Event management and scheduling
- **Fitbit**: Health and fitness data sync
- **Plaid**: Bank account and transaction data
- Real-time data synchronization

### 🚀 Performance & Scalability
- Redis caching for API responses
- Background job processing with Bull queues
- Rate limiting and throttling
- Structured logging with Winston

### 📱 API Features
- RESTful API design
- Comprehensive Swagger documentation
- File upload support (avatars)
- Multi-channel notifications (email, SMS, push, in-app)

### 🛠 DevOps
- Docker containerization
- Kubernetes deployment manifests
- Automated CI/CD pipelines
- Health checks and monitoring

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lifeos/backend
   ```

2. **Environment Setup**
   ```bash
   cp services/auth-service/.env.example services/auth-service/.env
   # Edit .env files for each service with your configuration
   ```

3. **Start Infrastructure**
   ```bash
   docker-compose up -d postgres redis
   ```

4. **Install Dependencies**
   ```bash
   # For each service
   cd services/auth-service
   npm install
   ```

5. **Run Migrations**
   ```bash
   npm run migration:run
   ```

6. **Start Services**
   ```bash
   # Terminal 1 - Auth Service
   cd services/auth-service && npm run start:dev

   # Terminal 2 - Health Service
   cd services/health-service && npm run start:dev

   # And so on for other services...
   ```

7. **Access API Documentation**
   - Auth Service: http://localhost:3001/api
   - Health Service: http://localhost:3002/api
   - Finance Service: http://localhost:3003/api
   - Learning Service: http://localhost:3004/api
   - Notification Service: http://localhost:3005/api

### Docker Development

```bash
# Build and start all services
docker-compose up --build

# View logs
docker-compose logs -f
```

## API Endpoints

### Authentication Service (Port 3001)
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/google` - Google OAuth initiation
- `GET /auth/dashboard` - User dashboard data
- `POST /auth/upload/avatar` - Upload user avatar
- `GET /auth/google/calendar/auth` - Google Calendar authorization
- `GET /auth/google/calendar/events` - Get calendar events

### Health Service (Port 3002)
- `GET /health/dashboard` - Health dashboard
- `GET /health/fitbit/auth` - Fitbit authorization
- `GET /health/fitbit/data` - Get Fitbit health data

### Finance Service (Port 3003)
- `GET /finance/accounts` - Get financial accounts
- `GET /finance/transactions` - Get transactions
- `GET /finance/plaid/auth` - Plaid authorization

### Learning Service (Port 3004)
- `GET /learning/courses` - Get available courses
- `GET /learning/progress` - Get learning progress
- `POST /learning/progress` - Update progress

### Notification Service (Port 3005)
- `GET /notifications` - Get user notifications
- `POST /notifications` - Create notification
- `PUT /notifications/:id/read` - Mark as read

## Configuration

### Environment Variables

Each service requires specific environment variables. See `.env.example` files in each service directory.

**Common Variables:**
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
- `REDIS_HOST`, `REDIS_PORT`
- `NODE_ENV`

**Service-Specific Variables:**
- Auth Service: Google OAuth credentials, email settings
- Health Service: Fitbit API credentials
- Finance Service: Plaid API credentials

## Database Schema

### User Entity
```typescript
{
  id: string (UUID)
  email: string (unique)
  passwordHash: string
  fullName: string
  timezone?: string
  avatar?: string
  phoneNumber?: string
  isActive: boolean
  role: string
  googleTokens?: JSON
  fitbitTokens?: JSON
  plaidTokens?: JSON
  preferences?: JSON
  createdAt: Date
  updatedAt: Date
  lastActiveAt?: Date
}
```

## Development

### Code Quality
```bash
# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm run test

# Run tests with coverage
npm run test:cov
```

### Database Operations
```bash
# Generate migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

### API Testing
```bash
# Using curl
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

## Deployment

### Docker Production
```bash
# Build production images
docker build -t lifeos/auth-service ./services/auth-service

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes
```bash
# Apply manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods
kubectl get services
```

### CI/CD
The project includes GitHub Actions workflows for:
- Automated testing on pull requests
- Docker image building and pushing
- Kubernetes deployment to staging/production

## Monitoring & Logging

- **Structured Logging**: Winston-based logging with JSON output
- **Health Checks**: Built-in health endpoints for each service
- **Metrics**: Prometheus-compatible metrics (future enhancement)
- **Error Tracking**: Centralized error logging and monitoring

## Security

- **Authentication**: JWT tokens with expiration
- **Authorization**: Role-based access control
- **Rate Limiting**: Configurable request throttling
- **Data Validation**: Comprehensive input validation
- **Secure Headers**: Helmet.js for security headers
- **Environment Secrets**: Secure credential management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Standards
- TypeScript strict mode enabled
- ESLint configuration for code quality
- Prettier for code formatting
- Comprehensive test coverage required

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the API documentation at `/api` endpoints
- Review the logs for debugging information

## Documentation

### 📚 Complete Documentation
- **[Architecture Guide](ARCHITECTURE.md)** - System design and technical architecture
- **[API Reference](API_REFERENCE.md)** - Complete API endpoint documentation
- **[Development Guide](DEVELOPMENT.md)** - Setup and development workflow
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment instructions

### 🔧 Service Documentation
- **[Auth Service](services/auth-service/README.md)** - Authentication and user management
- **[Health Service](services/health-service/README.md)** - Fitness tracking and health data
- **[Finance Service](services/finance-service/README.md)** - Financial data and banking integration
- **[Learning Service](services/learning-service/README.md)** - Course management and progress tracking
- **[Notification Service](services/notification-service/README.md)** - Multi-channel notification delivery
- **[API Gateway](services/api-gateway/README.md)** - Request routing and orchestration

### 🚀 Quick Links
- **Interactive API Docs**: `http://localhost:3001/api` (when running)
- **Health Checks**: `GET /health` on each service
- **Status Monitoring**: `GET /status` on API Gateway

## Roadmap

- [ ] Real-time WebSocket connections
- [ ] Advanced analytics and reporting
- [ ] Mobile app API optimization
- [ ] Multi-tenant architecture
- [ ] Advanced caching strategies
- [ ] GraphQL API support
- [ ] Machine learning integrations