# API Gateway

The central entry point for LifeOS microservices, providing routing, authentication, rate limiting, and API orchestration.

## Features

- **Request Routing**: Intelligent routing to appropriate microservices
- **Authentication**: JWT token validation and user context propagation
- **Rate Limiting**: Global and per-user request throttling
- **Load Balancing**: Distribution of requests across service instances
- **API Orchestration**: Aggregation of data from multiple services
- **Logging & Monitoring**: Centralized request logging and metrics
- **CORS Handling**: Cross-origin request management
- **Health Checks**: Service health monitoring and circuit breakers

## Architecture

The API Gateway acts as a single entry point for all client requests, implementing the following patterns:

- **API Composition**: Aggregates responses from multiple services
- **Gateway Routing**: Routes requests to appropriate microservices
- **Authentication Gateway**: Validates tokens and enriches requests
- **Rate Limiting**: Prevents abuse and ensures fair usage
- **Circuit Breaker**: Handles service failures gracefully

## API Endpoints

### Health & Status
```http
GET /health
# Returns gateway and service health status

GET /status
# Returns detailed service status and metrics
```

### Authentication Proxy
```http
POST /auth/login
POST /auth/register
GET /auth/google
GET /auth/dashboard
# All auth endpoints are proxied to auth-service
```

### Service Proxies
```http
# Health Service
GET /health/* → http://health-service:3002/health/*

# Finance Service
GET /finance/* → http://finance-service:3003/finance/*

# Learning Service
GET /learning/* → http://learning-service:3004/learning/*

# Notification Service
GET /notifications/* → http://notification-service:3005/notifications/*
```

### Aggregated Endpoints
```http
GET /api/dashboard
Authorization: Bearer <jwt-token>
# Aggregates dashboard data from all services

GET /api/profile
Authorization: Bearer <jwt-token>
# Returns complete user profile with integrated data
```

## Request Flow

```
Client Request
    ↓
API Gateway (Port 3000)
    ↓ Authentication & Rate Limiting
    ↓
Service Routing
    ↓
Target Microservice (Port 3001-3005)
    ↓
Response Aggregation (if needed)
    ↓
Client Response
```

## Configuration

### Service Discovery
The gateway uses static configuration for service locations:

```typescript
const services = {
  auth: 'http://auth-service:3001',
  health: 'http://health-service:3002',
  finance: 'http://finance-service:3003',
  learning: 'http://learning-service:3004',
  notification: 'http://notification-service:3005',
};
```

### Rate Limiting
- **Global Limit**: 1000 requests per minute
- **Per User**: 100 requests per minute
- **Per IP**: 50 requests per minute
- **Burst Handling**: Token bucket algorithm

### Authentication
- **JWT Validation**: Validates tokens from Authorization header
- **User Context**: Adds user information to request headers
- **Service Tokens**: Internal service-to-service authentication

## Development

### Running the Gateway
```bash
npm install
npm run start:dev
```

### Environment Variables
```env
# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
HEALTH_SERVICE_URL=http://localhost:3002
FINANCE_SERVICE_URL=http://localhost:3003
LEARNING_SERVICE_URL=http://localhost:3004
NOTIFICATION_SERVICE_URL=http://localhost:3005

# JWT
JWT_SECRET=your-jwt-secret

# Rate Limiting
RATE_LIMIT_GLOBAL=1000
RATE_LIMIT_USER=100
RATE_LIMIT_IP=50

# Redis (for rate limiting)
REDIS_HOST=localhost
REDIS_PORT=6379

# Environment
NODE_ENV=development
```

## Monitoring & Observability

### Health Checks
```json
{
  "status": "healthy",
  "services": {
    "auth-service": {
      "status": "healthy",
      "responseTime": 45,
      "lastChecked": "2024-01-15T10:00:00Z"
    },
    "health-service": {
      "status": "healthy",
      "responseTime": 32,
      "lastChecked": "2024-01-15T10:00:00Z"
    }
  },
  "metrics": {
    "totalRequests": 15420,
    "activeConnections": 23,
    "averageResponseTime": 67
  }
}
```

### Logging
- **Request Logging**: All requests with method, URL, status, duration
- **Error Logging**: Failed requests with stack traces
- **Performance Metrics**: Response times and throughput
- **Security Events**: Authentication failures and suspicious activity

## Error Handling

### Circuit Breaker Pattern
- **Failure Threshold**: 5 failures in 10 seconds
- **Recovery Timeout**: 30 seconds
- **Fallback Responses**: Cached data or error messages

### Error Responses
```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Auth service is temporarily unavailable",
    "timestamp": "2024-01-15T10:00:00Z",
    "requestId": "req-12345"
  }
}
```

## Security Features

- **Input Validation**: Comprehensive request validation
- **CORS Configuration**: Proper cross-origin handling
- **Helmet Security**: Security headers and protections
- **Request Sanitization**: XSS and injection prevention
- **Audit Logging**: Security event tracking

## Performance Optimization

### Caching Strategy
- **Response Caching**: Frequently accessed data
- **Rate Limit Caching**: Redis-based rate limiting
- **Session Caching**: User session data

### Load Balancing
- **Round Robin**: Default load distribution
- **Health Checks**: Automatic unhealthy instance removal
- **Connection Pooling**: Efficient connection management

## Development Guidelines

### Adding New Routes
1. Define route in gateway controller
2. Implement service discovery logic
3. Add authentication guards if needed
4. Update rate limiting rules
5. Add comprehensive logging

### Service Communication
```typescript
// Example: Proxy to auth service
@Get('auth/*')
@UseGuards(JwtAuthGuard)
async proxyAuth(@Req() req, @Res() res) {
  const response = await this.httpService
    .get(`${this.config.authServiceUrl}${req.path}`)
    .toPromise();
  return res.json(response.data);
}
```

## Architecture

```
API Gateway
├── Controllers
│   ├── GatewayController
│   └── ProxyController
├── Guards
│   ├── JwtAuthGuard
│   └── RateLimitGuard
├── Interceptors
│   ├── LoggingInterceptor
│   └── ResponseInterceptor
├── Services
│   ├── GatewayService
│   └── HealthCheckService
├── Middleware
│   ├── CorsMiddleware
│   └── SecurityMiddleware
└── DTOs
    ├── GatewayDto
    └── HealthDto
```

## Deployment

### Docker Configuration
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api-gateway
        image: lifeos/api-gateway:latest
        ports:
        - containerPort: 3000
        env:
        - name: AUTH_SERVICE_URL
          value: "http://auth-service:3001"
```

## Troubleshooting

### Common Issues
- **Service Unavailable**: Check service health endpoints
- **Authentication Errors**: Verify JWT token validity
- **Rate Limiting**: Monitor Redis connection and keys
- **Performance Issues**: Check response times and logs

### Debug Mode
```bash
DEBUG=api-gateway:* npm run start:dev
```

This enables detailed request/response logging for debugging.## API Documentation

Comprehensive API documentation is available at `/api` when running the gateway in development mode. The documentation includes:

- Interactive API explorer
- Request/response examples
- Authentication instructions
- Error code reference
- Service health status