# 🚀 MedSpaSync Pro - Complete Deployment Guide

## Overview

This guide provides comprehensive instructions for setting up CI/CD pipelines, configuring hosting platforms, optimizing for production, and setting up monitoring for the MedSpaSync Pro ecosystem.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [CI/CD Pipeline Setup](#cicd-pipeline-setup)
3. [Hosting Platform Configuration](#hosting-platform-configuration)
4. [Production Optimization](#production-optimization)
5. [Monitoring and Alerting](#monitoring-and-alerting)
6. [Security Hardening](#security-hardening)
7. [Performance Testing](#performance-testing)
8. [Backup and Disaster Recovery](#backup-and-disaster-recovery)
9. [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Software
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+
- Python 3.11+
- Git
- Make (optional)

### Required Accounts
- GitHub account
- Vercel account (for frontend hosting)
- Netlify account (for marketing site)
- Railway account (for backend services)
- AWS/GCP/Azure account (for production hosting)

### Required Secrets
You'll need to configure these secrets in your GitHub repository:

```bash
# GitHub Secrets to configure:
RAILWAY_TOKEN=your_railway_token
RAILWAY_SERVICE_ID=your_staging_service_id
RAILWAY_PRODUCTION_SERVICE_ID=your_production_service_id
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

## 🔄 CI/CD Pipeline Setup

### 1. GitHub Actions Configuration

The main CI/CD pipeline is configured in `.github/workflows/ecosystem-ci.yml`. This pipeline includes:

- **Security Scanning**: Trivy vulnerability scanner and OWASP ZAP
- **Multi-Service Testing**: Frontend, Backend, AI API, and Marketing site
- **Docker Image Building**: Automated container builds
- **Multi-Environment Deployment**: Staging and Production
- **Performance Testing**: k6 load testing
- **Monitoring Integration**: Prometheus and Grafana setup

### 2. Pipeline Features

```yaml
# Key features of the CI/CD pipeline:
- Automated testing for all services
- Security vulnerability scanning
- Performance testing with k6
- Multi-platform deployment
- Health checks and monitoring
- Slack notifications
- Automated rollback capabilities
```

### 3. Branch Strategy

```bash
# Recommended branch strategy:
main          # Production-ready code
develop       # Staging environment
feature/*     # Feature development
hotfix/*      # Critical fixes
```

## 🌐 Hosting Platform Configuration

### 1. Vercel (Frontend)

**Configuration**: `medspasync-frontend/vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

**Deployment Steps**:
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main/develop

### 2. Netlify (Marketing Site)

**Configuration**: `medspasync-marketing/netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "https://api.medspasyncpro.com/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
```

**Deployment Steps**:
1. Connect your GitHub repository to Netlify
2. Configure build settings
3. Set up custom domain and SSL

### 3. Railway (Backend Services)

**Configuration**: `medspasync-ecosystem/docker-compose.production.yml`

```yaml
services:
  backend:
    image: ghcr.io/mythosmediaco/medspasync-ecosystem/backend:latest
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    deploy:
      replicas: 3
```

**Deployment Steps**:
1. Create Railway project
2. Connect GitHub repository
3. Configure environment variables
4. Deploy using Railway CLI or GitHub Actions

### 4. AWS/GCP/Azure (Production)

For production deployments, use the comprehensive Docker Compose setup:

```bash
# Deploy to production
cd medspasync-ecosystem
docker-compose -f docker-compose.production.yml up -d
```

## ⚡ Production Optimization

### 1. System Optimization

Run the production optimization script:

```bash
# Make the script executable
chmod +x scripts/production-optimize.sh

# Run optimization
./scripts/production-optimize.sh production
```

This script performs:
- System kernel parameter optimization
- Docker daemon configuration
- Security hardening
- SSL/TLS setup
- Database optimization
- Monitoring setup

### 2. Performance Optimizations

#### Frontend Optimizations
```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
    optimizeImages: true,
  },
  compress: true,
  poweredByHeader: false,
}
```

#### Backend Optimizations
```javascript
// Database connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### AI API Optimizations
```python
# Gunicorn configuration
bind = "0.0.0.0:8000"
workers = 4
worker_class = "uvicorn.workers.UvicornWorker"
max_requests = 1000
max_requests_jitter = 100
```

### 3. Caching Strategies

#### Redis Caching
```javascript
// Backend caching
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL,
  retry_strategy: (options) => {
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    return Math.min(options.attempt * 100, 3000);
  }
});
```

#### CDN Configuration
```nginx
# Nginx CDN configuration
location /static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    proxy_cache_valid 200 1y;
}
```

## 📊 Monitoring and Alerting

### 1. Prometheus Configuration

**File**: `medspasync-ecosystem/monitoring/prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'medspasync-backend'
    static_configs:
      - targets: ['backend:5000']
    metrics_path: '/metrics'
    scrape_interval: 10s
```

### 2. Grafana Dashboards

**File**: `medspasync-ecosystem/monitoring/grafana-dashboard.json`

The dashboard includes:
- System overview metrics
- Response time monitoring
- Error rate tracking
- Database performance
- Redis memory usage
- AI API performance

### 3. Alertmanager Configuration

**File**: `medspasync-ecosystem/monitoring/alertmanager.yml`

```yaml
global:
  slack_api_url: 'https://hooks.slack.com/services/YOUR_SLACK_WEBHOOK'

route:
  group_by: ['alertname', 'cluster', 'service']
  receiver: 'slack-notifications'
  routes:
    - match:
        severity: critical
      receiver: 'pager-duty-critical'
```

### 4. Custom Metrics

#### Backend Metrics
```javascript
// Custom metrics for business logic
const reconciliationDuration = new prometheus.Histogram({
  name: 'reconciliation_duration_seconds',
  help: 'Duration of reconciliation process',
  labelNames: ['status', 'confidence_score']
});
```

#### AI API Metrics
```python
# Custom metrics for AI performance
RECONCILIATION_DURATION = Histogram(
    'ai_reconciliation_duration_seconds',
    'Duration of AI reconciliation process',
    ['model', 'confidence_threshold']
)
```

## 🔒 Security Hardening

### 1. Network Security

```bash
# Firewall configuration
sudo ufw --force enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 2. Docker Security

```json
// Docker daemon security configuration
{
  "userns-remap": "medspasync",
  "no-new-privileges": true,
  "seccomp-profile": "/etc/docker/seccomp-profile.json",
  "apparmor-profile": "docker-default"
}
```

### 3. Application Security

#### Content Security Policy
```html
<!-- Frontend CSP -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

#### API Security
```javascript
// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

## 🧪 Performance Testing

### 1. k6 Load Testing

**File**: `performance-tests/load-test.js`

```javascript
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up
    { duration: '5m', target: 50 }, // Sustained load
    { duration: '2m', target: 100 }, // Peak load
    { duration: '3m', target: 50 }, // Scale down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.1'],
  },
};
```

### 2. Running Performance Tests

```bash
# Install k6
sudo apt-get install k6

# Run performance test
k6 run performance-tests/load-test.js

# Run with custom environment
k6 run -e BASE_URL=https://api.medspasyncpro.com performance-tests/load-test.js
```

### 3. Performance Monitoring

```bash
# Monitor real-time performance
docker-compose exec prometheus promtool check config /etc/prometheus/prometheus.yml

# View Grafana dashboard
open http://localhost:3002
```

## 💾 Backup and Disaster Recovery

### 1. Automated Backups

**File**: `medspasync-ecosystem/scripts/backup.sh`

```bash
#!/bin/bash
# Automated backup script
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="medspasync_backup_$DATE.sql"

pg_dump -h postgres -U medspasync_user -d medspasync_pro > "$BACKUP_DIR/$BACKUP_FILE"
gzip "$BACKUP_DIR/$BACKUP_FILE"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "medspasync_backup_*.sql.gz" -mtime +7 -delete
```

### 2. Backup Schedule

```bash
# Add to crontab for daily backups
0 2 * * * /path/to/medspasync-ecosystem/scripts/backup.sh
```

### 3. Disaster Recovery Plan

```bash
# Recovery procedure
1. Stop all services
2. Restore database from backup
3. Restore configuration files
4. Start services in order
5. Verify system health
6. Run performance tests
```

## 🔧 Troubleshooting

### 1. Common Issues

#### Service Won't Start
```bash
# Check service logs
docker-compose logs [service-name]

# Check service health
docker-compose ps

# Restart service
docker-compose restart [service-name]
```

#### Database Connection Issues
```bash
# Check database connectivity
docker-compose exec postgres pg_isready -U medspasync_user

# Check database logs
docker-compose logs postgres
```

#### Performance Issues
```bash
# Check resource usage
docker stats

# Check system resources
htop
df -h
free -h
```

### 2. Monitoring Alerts

#### High CPU Usage
```bash
# Check CPU usage by container
docker stats --no-stream

# Check system load
uptime
```

#### High Memory Usage
```bash
# Check memory usage
free -h

# Check container memory limits
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

#### Disk Space Issues
```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a
```

### 3. Log Analysis

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend

# Search logs for errors
docker-compose logs | grep ERROR
```

## 📈 Performance Benchmarks

### Target Metrics

- **Response Time**: < 200ms (95th percentile)
- **Error Rate**: < 1%
- **Uptime**: > 99.9%
- **Throughput**: 1000+ requests/second
- **Database Queries**: < 100ms average

### Monitoring Dashboards

Access monitoring dashboards at:
- **Grafana**: http://localhost:3002 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093

## 🚀 Quick Start

### 1. Initial Setup

```bash
# Clone repository
git clone https://github.com/mythosmediaco/medspasync-ecosystem.git
cd medspasync-ecosystem

# Run production optimization
./scripts/production-optimize.sh production

# Deploy to production
docker-compose -f docker-compose.production.yml up -d
```

### 2. Verify Deployment

```bash
# Check all services
docker-compose ps

# Run health checks
curl http://localhost/health

# Check monitoring
open http://localhost:3002
```

### 3. Run Performance Tests

```bash
# Run load tests
k6 run performance-tests/load-test.js

# Monitor results
open performance-test-summary.html
```

## 📞 Support

For deployment support:
- **Documentation**: Check this guide and repository README files
- **Issues**: Create GitHub issues for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Email**: support@medspasyncpro.com

## 🔄 Updates and Maintenance

### Regular Maintenance Tasks

1. **Weekly**:
   - Review monitoring alerts
   - Check backup status
   - Update dependencies

2. **Monthly**:
   - Performance review
   - Security updates
   - Capacity planning

3. **Quarterly**:
   - Disaster recovery testing
   - Performance optimization
   - Security audit

### Update Procedures

```bash
# Update application
git pull origin main
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build

# Verify update
docker-compose ps
curl http://localhost/health
```

---

**🎉 Congratulations!** Your MedSpaSync Pro ecosystem is now fully deployed with comprehensive CI/CD, monitoring, and production optimization.

For additional customization or enterprise features, refer to the individual repository documentation or contact the development team. 