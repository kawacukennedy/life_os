# LifeOS

LifeOS is a unified, AI-driven personal operating system that centralizes health, productivity, finances, learning, social coordination and daily automation into a single, privacy-first web & mobile application.

## Features

- **AI Personal Assistant**: Multi-turn conversational assistant for planning, reminders, and suggestions
- **Unified Dashboard**: Health, finance, learning and tasks in one view
- **Autonomous Routines**: User-defined & AI-suggested routines that run automatically
- **Secure Integrations**: Calendar (Google/Apple), wearables (Fitbit/Apple Watch), banks (Plaid), messaging
- **Continuous Learning Engine**: Personalized micro-courses and skill recommendations
- **Privacy Controls**: Export, delete, selective sharing, on-device model options
- **Plugin Marketplace**: Extensible plugin/API marketplace for third-party integrations
- **Developer Platform**: REST/GraphQL APIs, webhooks, SDKs

## Architecture

This is a microservices architecture with:

- **Frontend**: Next.js 13+ with React 18, TypeScript, Tailwind CSS
- **Mobile App**: React Native with shared components
- **Backend Services**:
  - API Gateway (GraphQL) - Port 3001
  - Auth Service - Port 3000
  - User Profile Service - Port 3002
  - Health Service - Port 3003
  - Finance Service - Port 3004
  - Learning Service - Port 3005
  - Notification Service - Port 3005
  - AI Inference Service - Port 3006
  - Analytics Service - Port 3007
  - Task Service - Port 3008
  - Plugin Service - Port 3009
  - Social Service - Port 3010
  - Subscription Service - Port 3011
- **Database**: PostgreSQL with TypeORM, Redis for caching, Kafka for events
- **AI/ML**: Milvus vector database, LLM inference services
- **Deployment**: Docker + Docker Compose, Kubernetes ready

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL, Redis, Kafka (or use Docker)

### Quick Start with Docker

1. Clone the repository:
    ```bash
    git clone <repository-url>
    cd lifeos
    ```

2. Start all services:
    ```bash
    docker-compose up --build
    ```

3. Open the application:
    - Frontend: [http://localhost:3000](http://localhost:3000)
    - GraphQL Playground: [http://localhost:3001/graphql](http://localhost:3001/graphql)

### Manual Development Setup

1. Start infrastructure services:
    ```bash
    docker-compose up -d postgres redis kafka zookeeper milvus-standalone milvus-etcd milvus-minio
    ```

2. Install dependencies for all services:
    ```bash
    # Frontend
    cd frontend && npm install

    # API Gateway
    cd ../backend/services/api-gateway && npm install

    # All microservices
    for service in auth-service user-profile-service health-service finance-service learning-service notification-service ai-inference-service analytics-service plugin-service social-service subscription-service; do
      cd ../services/$service && npm install
    done
    ```

3. Start services in separate terminals:
    ```bash
    # API Gateway
    cd backend/services/api-gateway && npm run start:dev

    # Auth Service
    cd services/auth-service && npm run start:dev

    # Other services...
    # (See docker-compose.yml for port mappings)
    ```

4. Start frontend:
    ```bash
    cd frontend && npm run dev
    ```

## API Documentation

LifeOS uses GraphQL as the primary API with REST endpoints for specific services. Access the GraphQL playground at `http://localhost:3001/graphql`.

### Core GraphQL Operations

#### Authentication & User Management
```graphql
query GetUser($userId: String!) {
  getUser(userId: $userId) {
    id
    email
    fullName
    preferences
  }
}

mutation UpdateProfile($userId: String!, $data: UpdateProfileInput!) {
  updateProfile(userId: $userId, data: $data) {
    id
    fullName
    preferences
  }
}
```

#### Tasks & Productivity
```graphql
query GetUserTasks($userId: String!) {
  getUserTasks(userId: $userId) {
    id
    title
    status
    priority
    dueDate
  }
}

mutation CreateTask($userId: String!, $task: CreateTaskInput!) {
  createTask(userId: $userId, task: $task) {
    id
    title
    status
  }
}
```

#### Health & Fitness
```graphql
query GetHealthDashboard($userId: String!) {
  getHealthDashboard(userId: $userId) {
    todayStats {
      steps
      calories
      activeMinutes
    }
    weeklyTrends {
      date
      steps
      sleepHours
    }
  }
}
```

#### Finance
```graphql
query GetFinanceOverview($userId: String!) {
  getFinanceOverview(userId: $userId) {
    totalBalance
    monthlySpending
    budgetStatus
    recentTransactions {
      id
      amount
      description
      category
    }
  }
}
```

#### Learning
```graphql
query GetLearningProgress($userId: String!) {
  getLearningProgress(userId: $userId) {
    totalCourses
    completedCourses
    currentStreak
    courses {
      id
      title
      progress
      category
    }
  }
}
```

#### AI Assistant
```graphql
mutation SendMessage($userId: String!, $message: String!) {
  sendMessage(userId: $userId, message: $message) {
    id
    content
    role
    timestamp
  }
}
```

#### Plugin Marketplace
```graphql
query GetPlugins($category: PluginCategory, $limit: Int) {
  getPlugins(category: $category, limit: $limit) {
    id
    name
    description
    category
    installCount
    averageRating
  }
}

mutation InstallPlugin($userId: String!, $pluginId: String!) {
  installPlugin(userId: $userId, pluginId: $pluginId) {
    success
    message
  }
}
```

#### Privacy & Settings
```graphql
query GetPrivacySettings($userId: String!) {
  getPrivacySettings(userId: $userId) {
    dataSharing
    analyticsTracking
    aiPersonalization
    dataRetention
  }
}

mutation UpdatePrivacySettings($userId: String!, $settings: PrivacySettingsInput!) {
  updatePrivacySettings(userId: $userId, settings: $settings) {
    success
    message
  }
}
```

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