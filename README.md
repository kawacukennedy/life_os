# LifeOS

LifeOS is a unified, AI-driven personal operating system that centralizes health, productivity, finances, learning, social coordination and daily automation into a single, privacy-first web & mobile application.

## Features

- **AI Personal Assistant**: Multi-turn conversational assistant for planning, reminders, and suggestions
- **Unified Dashboard**: Health, finance, learning and tasks in one view
- **Autonomous Routines**: User-defined & AI-suggested routines that run automatically
- **Secure Integrations**: Calendar (Google/Apple), wearables (Fitbit/Apple Watch), banks (Plaid), messaging
- **Continuous Learning Engine**: Personalized micro-courses and skill recommendations
- **Privacy Controls**: Export, delete, selective sharing, on-device model options
- **Developer Platform**: REST/GraphQL APIs, webhooks, SDKs

## Architecture

This is a microservices architecture with:

- **Frontend**: Next.js 13+ with React 18, TypeScript, Tailwind CSS
- **Backend Services**:
  - API Gateway (Port 3001)
  - Auth Service (Port 3001, proxied)
  - Health Service (Port 3002)
  - Finance Service (Port 3003)
  - Learning Service (Port 3004)
  - Notification Service (Port 3005)
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis
- **Deployment**: Docker + Docker Compose

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (or use Docker)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd lifeos
   ```

2. Start the infrastructure:
   ```bash
   docker-compose up -d postgres redis
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

4. Install backend dependencies:
   ```bash
   cd ../backend/services/auth-service && npm install
   cd ../health-service && npm install
   cd ../finance-service && npm install
   cd ../learning-service && npm install
   cd ../notification-service && npm install
   cd ../api-gateway && npm install
   ```

5. Start the services:
   ```bash
   # Terminal 1: API Gateway
   cd backend/services/api-gateway && npm run start:dev

   # Terminal 2: Auth Service
   cd backend/services/auth-service && npm run start:dev

   # Terminal 3: Health Service
   cd backend/services/health-service && npm run start:dev

   # Terminal 4: Finance Service
   cd backend/services/finance-service && npm run start:dev

   # Terminal 5: Learning Service
   cd backend/services/learning-service && npm run start:dev

   # Terminal 6: Notification Service
   cd backend/services/notification-service && npm run start:dev

   # Terminal 7: Frontend
   cd frontend && npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

### Using Docker

```bash
docker-compose up --build
```

## API Documentation

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/dashboard` - Get user dashboard

### Health
- `GET /health/summary` - Get health summary
- `GET /health/vitals` - Get health vitals
- `POST /health/vitals` - Add health vital

### Finance
- `GET /finance/summary` - Get finance summary
- `GET /finance/transactions` - Get transactions
- `POST /finance/transactions` - Add transaction

### Learning
- `GET /learning/courses` - Get available courses
- `GET /learning/progress` - Get user progress
- `POST /learning/courses/:id/start` - Start a course
- `PATCH /learning/progress` - Update progress
- `GET /learning/recommendations` - Get course recommendations
- `GET /learning/stats` - Get learning statistics

### Notifications
- `POST /notifications` - Create notification
- `GET /notifications` - Get user notifications
- `GET /notifications/unread-count` - Get unread count
- `PATCH /notifications/:id/read` - Mark as read
- `PATCH /notifications/mark-all-read` - Mark all as read
- `DELETE /notifications/:id` - Delete notification

## Development

### Testing

```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend/services/<service> && npm test
```

### Linting

```bash
# Frontend
cd frontend && npm run lint

# Backend
cd backend/services/<service> && npm run lint
```

### Building

```bash
# Frontend
cd frontend && npm run build

# Backend
cd backend/services/<service> && npm run build
```

## Deployment

The application includes CI/CD pipeline with GitHub Actions for automated testing, building, and deployment.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.