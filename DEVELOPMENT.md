# Development Guide

Complete guide for setting up and working on the LifeOS backend services during development.

## Prerequisites

### System Requirements
- **Node.js**: Version 20.x or higher
- **npm**: Version 9.x or higher (comes with Node.js)
- **Docker**: Version 24.x or higher
- **Docker Compose**: Version 2.x or higher
- **Git**: Version 2.30 or higher

### Recommended Tools
- **VS Code**: With TypeScript, ESLint, and Prettier extensions
- **Postman/Insomnia**: For API testing
- **DBeaver**: For database management
- **Redis Desktop Manager**: For Redis debugging

## Project Structure

```
backend/
├── services/                    # Microservices
│   ├── api-gateway/            # API Gateway service
│   ├── auth-service/           # Authentication & user management
│   ├── health-service/         # Health & fitness tracking
│   ├── finance-service/        # Financial data management
│   ├── learning-service/       # Learning & course management
│   └── notification-service/   # Notification delivery
├── k8s/                        # Kubernetes manifests
├── docker-compose.yml          # Local development stack
├── .github/workflows/          # CI/CD pipelines
└── docs/                       # Documentation
```

## Quick Start

### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd lifeos/backend

# Install dependencies for all services
for service in services/*/; do
  if [ -f "$service/package.json" ]; then
    echo "Installing dependencies for $(basename $service)"
    cd $service && npm install && cd ../..
  fi
done
```

### 2. Environment Configuration
```bash
# Copy environment files
cp services/auth-service/.env.example services/auth-service/.env
cp services/health-service/.env.example services/health-service/.env
cp services/finance-service/.env.example services/finance-service/.env
cp services/learning-service/.env.example services/learning-service/.env
cp services/notification-service/.env.example services/notification-service/.env

# Edit environment variables (see Environment Variables section below)
```

### 3. Start Infrastructure
```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Wait for services to be ready
docker-compose logs -f postgres redis
```

### 4. Database Setup
```bash
# Run migrations for auth service (main user database)
cd services/auth-service
npm run migration:run

# Other services use synchronize: true for development
```

### 5. Start Services
```bash
# Terminal 1: Auth Service
cd services/auth-service && npm run start:dev

# Terminal 2: Health Service
cd services/health-service && npm run start:dev

# Terminal 3: Finance Service
cd services/finance-service && npm run start:dev

# Terminal 4: Learning Service
cd services/learning-service && npm run start:dev

# Terminal 5: Notification Service
cd services/notification-service && npm run start:dev

# Terminal 6: API Gateway
cd services/api-gateway && npm run start:dev
```

### 6. Verify Setup
```bash
# Check service health
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # Health Service
curl http://localhost:3003/health  # Finance Service
curl http://localhost:3004/health  # Learning Service
curl http://localhost:3005/health  # Notification Service
curl http://localhost:3000/health  # API Gateway

# Access API documentation
open http://localhost:3001/api  # Auth Service API docs
```

## Environment Variables

### Auth Service (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=lifeos

# JWT
JWT_SECRET=your-development-jwt-secret-key

# Google OAuth (Development)
GOOGLE_CLIENT_ID=your-dev-google-client-id
GOOGLE_CLIENT_SECRET=your-dev-google-client-secret
GOOGLE_REDIRECT_URL=http://localhost:3001/auth/google/callback

# Google Calendar
GOOGLE_CALENDAR_CLIENT_ID=your-dev-calendar-client-id
GOOGLE_CALENDAR_CLIENT_SECRET=your-dev-calendar-client-secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (Development - use MailHog or similar)
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_USER=
EMAIL_PASS=

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
HEALTH_SERVICE_URL=http://localhost:3002
FINANCE_SERVICE_URL=http://localhost:3003
LEARNING_SERVICE_URL=http://localhost:3004
NOTIFICATION_SERVICE_URL=http://localhost:3005

# Logging
LOG_LEVEL=debug

# File Uploads
BASE_URL=http://localhost:3001

# Environment
NODE_ENV=development
```

### Health Service (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=lifeos

# JWT
JWT_SECRET=your-development-jwt-secret-key

# Fitbit API (Development)
FITBIT_CLIENT_ID=your-dev-fitbit-client-id
FITBIT_CLIENT_SECRET=your-dev-fitbit-client-secret
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

### Finance Service (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=lifeos

# JWT
JWT_SECRET=your-development-jwt-secret-key

# Plaid API (Sandbox)
PLAID_CLIENT_ID=your-dev-plaid-client-id
PLAID_SECRET=your-dev-plaid-secret
PLAID_ENV=sandbox
PLAID_WEBHOOK_URL=http://localhost:3003/finance/plaid/webhook

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
FINANCE_SERVICE_URL=http://localhost:3003

# Environment
NODE_ENV=development
```

## Development Workflow

### Code Changes
1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow TypeScript best practices
   - Add proper error handling
   - Include input validation
   - Write comprehensive tests

3. **Code Quality**
   ```bash
   # Run linting
   npm run lint

   # Format code
   npm run format

   # Run tests
   npm run test

   # Check coverage
   npm run test:cov
   ```

4. **Database Changes**
   ```bash
   # Generate migration (if needed)
   npm run migration:generate -- -n YourMigrationName

   # Run migrations
   npm run migration:run
   ```

5. **API Testing**
   ```bash
   # Test with curl
   curl -X POST http://localhost:3001/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password","fullName":"Test User","timezone":"UTC"}'

   # Get JWT token
   TOKEN=$(curl -X POST http://localhost:3001/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}' | jq -r '.accessToken')

   # Use token for authenticated requests
   curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/auth/dashboard
   ```

### Testing Strategy

#### Unit Tests
```typescript
// Example: Auth service unit test
describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useClass: MockRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should validate user credentials', async () => {
    // Test implementation
  });
});
```

#### Integration Tests
```typescript
// Example: API integration test
describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password',
        fullName: 'Test User',
        timezone: 'UTC',
      })
      .expect(201);
  });
});
```

#### Running Tests
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test -- auth.service.spec.ts

# Run e2e tests
npm run test:e2e

# Generate coverage report
npm run test:cov
```

## Debugging

### Service Logs
```bash
# View service logs
docker-compose logs -f postgres
docker-compose logs -f redis

# View application logs (from service directory)
npm run start:dev  # Logs appear in terminal
```

### Database Debugging
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d lifeos

# View database schema
\d user;
\d vital;
\d transaction;

# Query data
SELECT * FROM "user" LIMIT 5;
```

### Redis Debugging
```bash
# Connect to Redis
docker-compose exec redis redis-cli

# View keys
KEYS *

# View key value
GET user:123:profile
```

### API Debugging
```bash
# Enable debug logging
DEBUG=* npm run start:dev

# Use Postman/Insomnia with detailed logging
# Check Network tab in browser dev tools
```

## Third-Party Integrations Setup

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - `http://localhost:3001/auth/google/callback`
4. Enable Google Calendar API
5. Add credentials to `.env`

### Fitbit API Setup
1. Register at [Fitbit Developer Portal](https://dev.fitbit.com/)
2. Create an application
3. Set redirect URI: `http://localhost:3002/health/fitbit/callback`
4. Add credentials to `.env`

### Plaid API Setup
1. Sign up at [Plaid Dashboard](https://dashboard.plaid.com/)
2. Create sandbox application
3. Set webhook URL: `http://localhost:3003/finance/plaid/webhook`
4. Add credentials to `.env`

## Performance Monitoring

### Development Metrics
```bash
# Check service response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/health

# Monitor database connections
docker-compose exec postgres psql -U postgres -d lifeos -c "SELECT * FROM pg_stat_activity;"

# Check Redis memory usage
docker-compose exec redis redis-cli INFO memory
```

### Profiling
```bash
# Enable Node.js profiling
node --prof --logfile=profile.log dist/main.js

# Analyze profile
node --prof-process profile.log > profile.txt
```

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check if port is in use
lsof -i :3001

# Check environment variables
cat .env

# Check dependencies
npm list --depth=0
```

#### Database Connection Issues
```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U postgres -d lifeos -c "SELECT 1;"
```

#### Authentication Problems
```bash
# Verify JWT secret is set
echo $JWT_SECRET

# Check token expiration
# Use jwt.io to decode tokens

# Verify user exists in database
docker-compose exec postgres psql -U postgres -d lifeos -c "SELECT * FROM \"user\" WHERE email = 'test@example.com';"
```

#### External API Issues
```bash
# Check API credentials
cat .env | grep -E "(GOOGLE|FITBIT|PLAID)_"

# Verify redirect URIs match
# Check API dashboard for error logs
```

### Reset Development Environment
```bash
# Stop all services
docker-compose down -v

# Remove node_modules
find services -name "node_modules" -type d -exec rm -rf {} +

# Clean Docker
docker system prune -a

# Reinstall dependencies
for service in services/*/; do
  if [ -f "$service/package.json" ]; then
    cd $service && npm install && cd ../..
  fi
done

# Restart infrastructure
docker-compose up -d postgres redis

# Run migrations
cd services/auth-service && npm run migration:run && cd ../..
```

## Contributing

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration with Prettier
- **Prettier**: Consistent code formatting
- **Testing**: Minimum 80% code coverage
- **Documentation**: JSDoc comments for public APIs

### Commit Guidelines
```bash
# Use conventional commits
git commit -m "feat: add user avatar upload functionality"
git commit -m "fix: resolve JWT token validation issue"
git commit -m "docs: update API documentation"
git commit -m "test: add integration tests for auth service"
```

### Pull Request Process
1. Create feature branch from `develop`
2. Implement changes with tests
3. Ensure all tests pass
4. Update documentation if needed
5. Create pull request with description
6. Code review and approval
7. Merge to `develop`
8. Deploy to staging for testing

## Advanced Development

### Working with Multiple Services
```bash
# Use process manager like PM2
npm install -g pm2

# Create ecosystem file
echo '{
  "apps": [
    {
      "name": "auth-service",
      "script": "services/auth-service/dist/main.js",
      "env": { "NODE_ENV": "development" }
    },
    {
      "name": "health-service",
      "script": "services/health-service/dist/main.js",
      "env": { "NODE_ENV": "development" }
    }
  ]
}' > ecosystem.config.json

# Start all services
pm2 start ecosystem.config.json
```

### Hot Reloading Setup
```typescript
// In main.ts for each service
if (process.env.NODE_ENV === 'development') {
  app.useWebSocketAdapter(new WsAdapter(app));
  // Enable hot reloading
}
```

### Custom Scripts
```json
// package.json scripts
{
  "scripts": {
    "dev": "concurrently \"npm run start:dev\" \"npm run watch:docs\"",
    "watch:docs": "nodemon --exec \"npm run build:docs\" --watch src",
    "clean": "rimraf dist coverage",
    "prebuild": "npm run clean && npm run lint",
    "postinstall": "husky install"
  }
}
```

This development guide provides everything needed to work effectively on the LifeOS backend. Follow these practices to maintain code quality and development efficiency.