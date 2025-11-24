# Deployment Guide

Complete guide for deploying LifeOS backend services to production environments.

## Prerequisites

### Infrastructure Requirements
- **Kubernetes Cluster**: Version 1.24+ with ingress controller
- **PostgreSQL Database**: Version 15+ with persistent storage
- **Redis Cluster**: Version 7+ with persistence
- **Docker Registry**: For storing container images
- **SSL Certificates**: For HTTPS encryption
- **Load Balancer**: For traffic distribution

### System Requirements
- **CPU**: 2+ cores per service instance
- **Memory**: 1GB+ RAM per service instance
- **Storage**: 10GB+ for databases and file uploads
- **Network**: Internal service communication allowed

## Environment Setup

### 1. Infrastructure Provisioning

#### Kubernetes Cluster
```bash
# Create namespace
kubectl create namespace lifeos

# Apply storage classes (if needed)
kubectl apply -f k8s/storage-classes.yaml
```

#### PostgreSQL Setup
```bash
# Deploy PostgreSQL
kubectl apply -f k8s/postgresql/
# Wait for pod to be ready
kubectl wait --for=condition=ready pod -l app=postgresql -n lifeos

# Create databases
kubectl exec -it postgresql-0 -n lifeos -- psql -U postgres -c "
CREATE DATABASE lifeos_auth;
CREATE DATABASE lifeos_health;
CREATE DATABASE lifeos_finance;
CREATE DATABASE lifeos_learning;
CREATE DATABASE lifeos_notification;
"
```

#### Redis Setup
```bash
# Deploy Redis
kubectl apply -f k8s/redis/
kubectl wait --for=condition=ready pod -l app=redis -n lifeos
```

### 2. Secrets Management

#### Create Kubernetes Secrets
```bash
# Database credentials
kubectl create secret generic db-secret \
  --from-literal=username=lifeos \
  --from-literal=password=your-secure-db-password \
  -n lifeos

# JWT secret
kubectl create secret generic jwt-secret \
  --from-literal=secret=your-super-secure-jwt-secret \
  -n lifeos

# OAuth credentials
kubectl create secret generic oauth-secret \
  --from-literal=google-client-id=your-google-client-id \
  --from-literal=google-client-secret=your-google-client-secret \
  --from-literal=fitbit-client-id=your-fitbit-client-id \
  --from-literal=fitbit-client-secret=your-fitbit-client-secret \
  --from-literal=plaid-client-id=your-plaid-client-id \
  --from-literal=plaid-secret=your-plaid-secret \
  -n lifeos

# Email configuration
kubectl create secret generic email-secret \
  --from-literal=smtp-host=smtp.gmail.com \
  --from-literal=smtp-port=587 \
  --from-literal=smtp-user=your-email@gmail.com \
  --from-literal=smtp-pass=your-app-password \
  -n lifeos
```

### 3. Container Images

#### Build and Push Images
```bash
# Build images
docker build -t your-registry/lifeos/auth-service:latest ./services/auth-service
docker build -t your-registry/lifeos/health-service:latest ./services/health-service
docker build -t your-registry/lifeos/finance-service:latest ./services/finance-service
docker build -t your-registry/lifeos/learning-service:latest ./services/learning-service
docker build -t your-registry/lifeos/notification-service:latest ./services/notification-service
docker build -t your-registry/lifeos/api-gateway:latest ./services/api-gateway

# Push images
docker push your-registry/lifeos/auth-service:latest
docker push your-registry/lifeos/health-service:latest
docker push your-registry/lifeos/finance-service:latest
docker push your-registry/lifeos/learning-service:latest
docker push your-registry/lifeos/notification-service:latest
docker push your-registry/lifeos/api-gateway:latest
```

## Service Deployment

### 1. Deploy Services

#### Auth Service
```bash
kubectl apply -f k8s/auth-service-deployment.yaml
kubectl apply -f k8s/auth-service-service.yaml
```

#### Health Service
```bash
kubectl apply -f k8s/health-service-deployment.yaml
kubectl apply -f k8s/health-service-service.yaml
```

#### Finance Service
```bash
kubectl apply -f k8s/finance-service-deployment.yaml
kubectl apply -f k8s/finance-service-service.yaml
```

#### Learning Service
```bash
kubectl apply -f k8s/learning-service-deployment.yaml
kubectl apply -f k8s/learning-service-service.yaml
```

#### Notification Service
```bash
kubectl apply -f k8s/notification-service-deployment.yaml
kubectl apply -f k8s/notification-service-service.yaml
```

#### API Gateway
```bash
kubectl apply -f k8s/api-gateway-deployment.yaml
kubectl apply -f k8s/api-gateway-service.yaml
```

### 2. Database Migrations

#### Run Migrations for Each Service
```bash
# Auth Service
kubectl exec -it deployment/auth-service -n lifeos -- npm run migration:run

# Note: Other services may not have migrations if they use synchronize: true
# For production, consider implementing migrations for all services
```

### 3. Ingress Configuration

#### Create Ingress Resource
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: lifeos-api-ingress
  namespace: lifeos
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - api.yourdomain.com
    secretName: lifeos-api-tls
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 3000
```

```bash
kubectl apply -f k8s/ingress.yaml
```

## Configuration

### Environment Variables

Create a ConfigMap for shared configuration:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: lifeos-config
  namespace: lifeos
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  BASE_URL: "https://api.yourdomain.com"
  AUTH_SERVICE_URL: "http://auth-service.lifeos.svc.cluster.local:3001"
  HEALTH_SERVICE_URL: "http://health-service.lifeos.svc.cluster.local:3002"
  FINANCE_SERVICE_URL: "http://finance-service.lifeos.svc.cluster.local:3003"
  LEARNING_SERVICE_URL: "http://learning-service.lifeos.svc.cluster.local:3004"
  NOTIFICATION_SERVICE_URL: "http://notification-service.lifeos.svc.cluster.local:3005"
```

### Service-Specific Config

Each deployment should reference the appropriate ConfigMap and Secrets.

## Monitoring & Observability

### 1. Health Checks

All services include health check endpoints:
- `GET /health` - Service health status
- `GET /metrics` - Prometheus metrics (if implemented)

### 2. Logging

#### Centralized Logging Setup
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: lifeos
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush         5
        Log_Level     info
        Daemon        off

    [INPUT]
        Name              tail
        Path              /var/log/containers/*lifeos*.log
        Parser            docker
        Tag               lifeos.*
        Refresh_Interval  5

    [OUTPUT]
        Name  es
        Match lifeos.*
        Host  elasticsearch
        Port  9200
        Index lifeos
```

### 3. Monitoring Stack

#### Prometheus & Grafana
```bash
# Deploy monitoring stack
kubectl apply -f k8s/monitoring/
```

#### Service Monitors
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: lifeos-services
  namespace: lifeos
spec:
  selector:
    matchLabels:
      app: lifeos-service
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
```

## Scaling

### Horizontal Pod Autoscaling

#### CPU-based Scaling
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: auth-service-hpa
  namespace: lifeos
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auth-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Vertical Scaling

Monitor resource usage and adjust requests/limits:
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "200m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

## Backup & Recovery

### Database Backups

#### Automated PostgreSQL Backups
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: lifeos
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15
            command:
            - /bin/bash
            - -c
            - pg_dumpall -U postgres > /backup/lifeos-$(date +%Y%m%d-%H%M%S).sql
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: password
            volumeMounts:
            - name: backup-volume
              mountPath: /backup
          volumes:
          - name: backup-volume
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
```

### File Storage Backups

For uploaded files (avatars, etc.):
```bash
# Use persistent volumes with backup solutions like Velero
kubectl apply -f k8s/backup/
```

## Security

### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: lifeos-network-policy
  namespace: lifeos
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000  # API Gateway
  - from:
    - podSelector: {}  # Allow internal communication
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgresql
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
  # Allow external API calls (Google, Fitbit, etc.)
  - to: []
    ports:
    - protocol: TCP
      port: 443
```

### Security Best Practices

1. **Image Security**: Scan images for vulnerabilities
2. **Secrets Management**: Use external secret managers (Vault, AWS Secrets Manager)
3. **RBAC**: Implement Kubernetes RBAC
4. **Pod Security Standards**: Enforce security contexts
5. **Network Security**: Use service mesh (Istio) for advanced security

## Troubleshooting

### Common Issues

#### Service Unavailable
```bash
# Check pod status
kubectl get pods -n lifeos

# Check service logs
kubectl logs -f deployment/auth-service -n lifeos

# Check service endpoints
kubectl get endpoints -n lifeos
```

#### Database Connection Issues
```bash
# Test database connectivity
kubectl exec -it deployment/auth-service -n lifeos -- nc -zv postgresql 5432

# Check database logs
kubectl logs -f deployment/postgresql -n lifeos
```

#### High Resource Usage
```bash
# Check resource usage
kubectl top pods -n lifeos

# Check HPA status
kubectl get hpa -n lifeos
```

### Rollback Procedures

#### Rolling Back Deployments
```bash
# Rollback to previous version
kubectl rollout undo deployment/auth-service -n lifeos

# Check rollout status
kubectl rollout status deployment/auth-service -n lifeos
```

#### Database Rollback
```bash
# If using migrations, revert specific migration
kubectl exec -it deployment/auth-service -n lifeos -- npm run migration:revert
```

## Performance Optimization

### Database Optimization
- Connection pooling with PgBouncer
- Query optimization and indexing
- Read replicas for high-traffic services

### Caching Strategy
- Redis cluster for session storage
- CDN integration for static assets
- API response caching

### Monitoring Alerts
```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: lifeos-alerts
  namespace: lifeos
spec:
  groups:
  - name: lifeos
    rules:
    - alert: HighErrorRate
      expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High error rate detected"
    - alert: HighLatency
      expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High request latency detected"
```

## Maintenance

### Regular Tasks

#### Certificate Renewal
```bash
# Check certificate expiry
kubectl get certificate -n lifeos

# Renew certificates (handled automatically by cert-manager)
```

#### Log Rotation
```bash
# Configure log rotation in fluent-bit
# Archive old logs to S3/Cloud Storage
```

#### Dependency Updates
```bash
# Update base images monthly
# Update dependencies quarterly
# Security patches as needed
```

### Emergency Procedures

#### Service Outage Response
1. Check monitoring dashboards
2. Identify affected components
3. Scale up resources if needed
4. Implement circuit breakers
5. Communicate with stakeholders
6. Post-mortem analysis

#### Data Recovery
1. Restore from latest backup
2. Verify data integrity
3. Update application configurations
4. Test restored services
5. Communicate recovery status

This deployment guide provides a comprehensive foundation for production deployment. Adjust configurations based on your specific infrastructure and requirements.