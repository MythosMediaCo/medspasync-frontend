# 🚀 MedSpaSync Pro Ecosystem - Unified Deployment

A comprehensive, production-ready deployment solution for the entire MedSpaSync Pro ecosystem, featuring microservices architecture, real-time analytics, AI-powered reconciliation, and enterprise-grade monitoring.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Marketing     │    │   Nginx Proxy   │
│   (Next.js)     │    │   (React)       │    │   (Load Bal.)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Backend API   │
                    │   (Node.js)     │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   AI API        │
                    │   (Python)      │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   Redis         │    │   Monitoring    │
│   (Database)    │    │   (Cache)       │    │   (Prometheus)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 Features

### Core Services
- **Frontend Application**: Next.js-based main application with real-time analytics dashboard
- **Backend API**: Node.js REST API with AI integration and WebSocket support
- **AI API Service**: Python-based AI reconciliation engine with HIPAA compliance
- **Marketing Site**: React-based landing page and marketing materials
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for session management and caching

### Monitoring & Observability
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization and dashboards
- **Health Checks**: Comprehensive service health monitoring
- **Logging**: Centralized logging with structured output

### Security & Compliance
- **HIPAA Compliance**: Data encryption and audit logging
- **Rate Limiting**: API protection against abuse
- **CORS Configuration**: Secure cross-origin requests
- **SSL/TLS**: HTTPS support with security headers

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git
- At least 4GB RAM and 10GB disk space

### 1. Clone and Setup
```bash
# Clone the ecosystem repository
git clone <repository-url>
cd medspasync-ecosystem

# Make deployment script executable (Linux/Mac)
chmod +x scripts/deploy.sh

# On Windows, use PowerShell
# The script will be automatically executable
```

### 2. Configure Environment
```bash
# The deployment script will create a .env file if it doesn't exist
# Edit the .env file with your configuration
nano .env
```

### 3. Deploy
```bash
# Deploy to production
./scripts/deploy.sh production

# Deploy with backup
./scripts/deploy.sh production --backup

# Deploy to staging
./scripts/deploy.sh staging
```

## 📋 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
POSTGRES_PASSWORD=your_secure_password
REDIS_PASSWORD=your_redis_password

# API Keys and Secrets
AI_API_SECRET_KEY=your_ai_api_secret_key
AI_API_KEY=your_ai_api_key
JWT_SECRET=your_jwt_secret
NEXTAUTH_SECRET=your_nextauth_secret

# Service URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
AI_API_URL=http://localhost:8000

# Monitoring
GRAFANA_PASSWORD=admin

# Environment
NODE_ENV=production
ENVIRONMENT=production

# Security
HIPAA_COMPLIANCE_MODE=true
DATA_ENCRYPTION_ENABLED=true
AUDIT_LOGGING_ENABLED=true
```

### Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Main App | 80/443 | Nginx reverse proxy |
| Frontend | 3000 | Next.js application |
| Backend | 5000 | Node.js API |
| AI API | 8000 | Python AI service |
| Marketing | 3001 | Marketing site |
| Prometheus | 9090 | Metrics collection |
| Grafana | 3002 | Monitoring dashboard |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |

## 🔧 Management Commands

### Deployment Script Usage

```bash
# Deploy to different environments
./scripts/deploy.sh production
./scripts/deploy.sh staging
./scripts/deploy.sh development

# Backup and rollback
./scripts/deploy.sh backup
./scripts/deploy.sh rollback backups/20241201_120000

# Health checks and monitoring
./scripts/deploy.sh health
./scripts/deploy.sh logs [service_name]

# Service management
./scripts/deploy.sh stop
./scripts/deploy.sh restart
./scripts/deploy.sh update
```

### Docker Compose Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service_name]

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart [service_name]

# Scale services
docker-compose up -d --scale backend=3

# View service status
docker-compose ps
```

## 📊 Monitoring & Analytics

### Accessing Dashboards

- **Grafana**: http://localhost:3002 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Application**: http://localhost
- **API Documentation**: http://localhost/api/docs

### Key Metrics

The monitoring system tracks:

- **System Metrics**: CPU, memory, disk usage
- **Application Metrics**: Request rates, response times, error rates
- **Business Metrics**: Reconciliation accuracy, user activity, AI performance
- **Security Metrics**: Authentication failures, unauthorized access attempts

### Alerts

The system includes comprehensive alerting for:

- Service health and availability
- Performance degradation
- Security incidents
- Business KPI violations
- Resource utilization

## 🔒 Security Features

### Data Protection
- **Encryption**: All sensitive data encrypted at rest and in transit
- **HIPAA Compliance**: Audit logging and data handling compliance
- **Access Control**: Role-based access control (RBAC)
- **Rate Limiting**: Protection against API abuse

### Network Security
- **SSL/TLS**: HTTPS with modern cipher suites
- **Security Headers**: CSP, HSTS, XSS protection
- **CORS**: Configured cross-origin resource sharing
- **Firewall**: Network-level security controls

## 🚀 Production Deployment

### Cloud Deployment

For production deployment on cloud platforms:

#### AWS
```bash
# Deploy to AWS ECS
aws ecs create-cluster --cluster-name medspasync-pro
aws ecs register-task-definition --cli-input-json file://task-definition.json
aws ecs create-service --cluster medspasync-pro --service-name medspasync-service --task-definition medspasync-pro:1
```

#### Google Cloud
```bash
# Deploy to GKE
gcloud container clusters create medspasync-cluster
kubectl apply -f k8s/
```

#### Azure
```bash
# Deploy to Azure Container Instances
az container create --resource-group medspasync-rg --name medspasync-container --image medspasync/ecosystem
```

### Load Balancing

For high availability, configure load balancers:

```nginx
# Nginx load balancer configuration
upstream backend {
    server backend1:5000;
    server backend2:5000;
    server backend3:5000;
}
```

### Database Scaling

For production database scaling:

```yaml
# PostgreSQL with replication
services:
  postgres-master:
    image: postgres:15
    environment:
      POSTGRES_DB: medspasync_pro
    volumes:
      - postgres_master_data:/var/lib/postgresql/data

  postgres-replica:
    image: postgres:15
    environment:
      POSTGRES_DB: medspasync_pro
    volumes:
      - postgres_replica_data:/var/lib/postgresql/data
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
docker-compose exec backend npm test
docker-compose exec frontend npm test
docker-compose exec ai-api python -m pytest

# Run integration tests
./scripts/test-integration.sh

# Run load tests
./scripts/load-test.sh
```

### Test Coverage

```bash
# Generate coverage reports
docker-compose exec backend npm run test:coverage
docker-compose exec frontend npm run test:coverage
```

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
name: Deploy MedSpaSync Ecosystem

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to production
        run: |
          ./scripts/deploy.sh production --backup
```

### Automated Testing

```yaml
name: Test MedSpaSync Ecosystem

on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          docker-compose up -d
          ./scripts/test-all.sh
```

## 📈 Performance Optimization

### Caching Strategy

- **Redis**: Session storage and API response caching
- **CDN**: Static asset delivery
- **Database**: Query result caching
- **Application**: In-memory caching for frequently accessed data

### Database Optimization

```sql
-- Index optimization
CREATE INDEX idx_reconciliation_jobs_status ON reconciliation_jobs(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Query optimization
ANALYZE reconciliation_jobs;
VACUUM ANALYZE;
```

### Application Optimization

- **Code Splitting**: Dynamic imports for better loading performance
- **Image Optimization**: WebP format and lazy loading
- **Bundle Analysis**: Regular bundle size monitoring
- **Memory Management**: Proper garbage collection and memory leaks prevention

## 🆘 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check service logs
docker-compose logs [service_name]

# Check service health
docker-compose ps

# Restart service
docker-compose restart [service_name]
```

#### Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready

# Check database logs
docker-compose logs postgres

# Reset database
docker-compose down
docker volume rm medspasync-ecosystem_postgres_data
docker-compose up -d
```

#### Performance Issues
```bash
# Check resource usage
docker stats

# Check application metrics
curl http://localhost:9090/api/v1/query?query=up

# Analyze slow queries
docker-compose exec postgres psql -U medspasync_user -d medspasync_pro -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
```

### Log Analysis

```bash
# View all logs
docker-compose logs -f

# Filter logs by service
docker-compose logs -f backend | grep ERROR

# Export logs for analysis
docker-compose logs > logs.txt
```

## 📚 Documentation

### API Documentation
- **Swagger UI**: http://localhost/api/docs
- **OpenAPI Spec**: http://localhost/api/openapi.json

### Service Documentation
- [Frontend Documentation](./frontend/README.md)
- [Backend Documentation](./backend/README.md)
- [AI API Documentation](./ai-api/README.md)

### Architecture Documentation
- [System Design](./docs/architecture.md)
- [Database Schema](./docs/database.md)
- [Security Model](./docs/security.md)

## 🤝 Contributing

### Development Setup

```bash
# Clone repositories
git clone <frontend-repo>
git clone <backend-repo>
git clone <ai-api-repo>

# Install dependencies
cd frontend && npm install
cd ../backend && npm install
cd ../ai-api && pip install -r requirements.txt

# Start development environment
docker-compose -f docker-compose.dev.yml up -d
```

### Code Standards

- **Frontend**: ESLint + Prettier
- **Backend**: ESLint + Prettier
- **AI API**: Black + Flake8
- **Testing**: Jest (JS) + Pytest (Python)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- **Documentation**: [docs.medspasyncpro.com](https://docs.medspasyncpro.com)
- **Issues**: [GitHub Issues](https://github.com/medspasync/ecosystem/issues)
- **Discussions**: [GitHub Discussions](https://github.com/medspasync/ecosystem/discussions)
- **Email**: support@medspasyncpro.com

---

**MedSpaSync Pro Ecosystem** - Enterprise-grade medspa management platform with AI-powered reconciliation and real-time analytics. 