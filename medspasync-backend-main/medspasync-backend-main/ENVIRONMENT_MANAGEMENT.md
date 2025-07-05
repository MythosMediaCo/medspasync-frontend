# MedSpaSync Pro - Environment Management System

## Overview

The MedSpaSync Pro Environment Management System provides a centralized, multi-environment configuration solution for the entire ecosystem. This system manages environment variables, validates configurations, performs health checks, and supports deployment across development, staging, production, and demo environments.

## Architecture

### Core Components

1. **Environment Manager** (`config/environment-manager.js`)
   - Centralized configuration management
   - Environment-specific settings
   - Health monitoring and validation
   - Encryption and security features

2. **Environment Schemas** (`config/environment-schemas.js`)
   - Environment variable definitions
   - Validation rules and requirements
   - Default value management
   - Documentation generation

3. **Deployment Manager** (`scripts/deploy.js`)
   - Multi-environment deployment automation
   - Environment validation and health checks
   - Docker containerization support
   - Deployment reporting and logging

4. **Health Monitoring** (`routes/health.js`)
   - Comprehensive health check endpoints
   - Service status monitoring
   - Kubernetes probe support
   - Performance metrics

## Environments

### Development Environment
- **Purpose**: Local development and testing
- **Database**: Local PostgreSQL/MongoDB
- **AI Service**: Local or development endpoint
- **Security**: Basic authentication, no encryption
- **Rate Limits**: 100 requests/15min
- **Features**: Full debugging, hot reload

### Staging Environment
- **Purpose**: Pre-production testing and validation
- **Database**: Staging PostgreSQL/MongoDB
- **AI Service**: Staging AI endpoint
- **Security**: Enhanced authentication, encryption enabled
- **Rate Limits**: 200 requests/15min
- **Features**: Production-like configuration

### Production Environment
- **Purpose**: Live production deployment
- **Database**: Production PostgreSQL/MongoDB
- **AI Service**: Production AI endpoint
- **Security**: Full encryption, audit logging
- **Rate Limits**: 500 requests/15min
- **Features**: Monitoring, backup, scaling

### Demo Environment
- **Purpose**: Customer demonstrations and trials
- **Database**: No persistent database (in-memory)
- **AI Service**: Demo AI endpoint
- **Security**: Basic authentication, no encryption
- **Rate Limits**: 50 requests/15min
- **Features**: Limited functionality, trial mode

## Environment Variables

### Required Variables (Production)

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database
MONGO_URI=mongodb://user:password@host:port/database

# Security
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key
ENV_ENCRYPTION_KEY=your-encryption-key

# Payment
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-email-password
```

### Optional Variables

```bash
# AI/ML Service
ML_SERVICE_URL=https://ai.medspasyncpro.com
AI_API_KEY=your-ai-api-key
PYTHON_SCRIPT_PATH=./reconciliation/ai_service.py

# Processing Configuration
UPLOAD_MAX_MB=50
DEFAULT_CONFIDENCE_THRESHOLD=0.85
PROCESSING_BATCH_SIZE=500
MAX_TRANSACTIONS_PER_JOB=100000
AI_TIMEOUT=900000
MAX_CONCURRENT_AI_JOBS=10

# Email Configuration
EMAIL_FROM=noreply@medspasyncpro.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Trial Configuration
ENABLE_TRIAL=true
TRIAL_DAYS=14
```

## Usage

### Environment Validation

```bash
# Validate current environment
npm run env:validate

# Check environment health
npm run env:health

# Generate environment report
npm run env:report
```

### Deployment

```bash
# Deploy to development
npm run deploy:dev

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production

# Deploy to demo
npm run deploy:demo
```

### Docker Operations

```bash
# Build Docker images
npm run docker:build
npm run docker:build:production

# Run environments
npm run docker:run:dev
npm run docker:run:staging
npm run docker:run:production
npm run docker:run:demo

# Stop environments
npm run docker:stop
npm run docker:stop:staging
npm run docker:stop:production
npm run docker:stop:demo

# View logs
npm run docker:logs
npm run docker:logs:staging
npm run docker:logs:production
npm run docker:logs:demo
```

### Health Monitoring

```bash
# Start monitoring
npm run monitor:start

# Check monitoring status
npm run monitor:status

# Stop monitoring
npm run monitor:stop
```

## Health Check Endpoints

### Main Health Check
```http
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "responseTime": "45ms",
  "environment": "production",
  "version": "1.0.0",
  "uptime": 3600,
  "memory": {
    "used": 128,
    "total": 256,
    "external": 64
  },
  "services": {
    "database": {
      "status": "healthy",
      "type": "PostgreSQL/MongoDB"
    },
    "ai": {
      "status": "healthy",
      "configured": true
    },
    "stripe": {
      "status": "healthy",
      "configured": true,
      "mode": "LIVE"
    },
    "email": {
      "status": "healthy",
      "configured": true
    },
    "cors": {
      "status": "healthy",
      "origins": 8
    }
  }
}
```

### Kubernetes Probes
```http
GET /api/health/ready  # Readiness probe
GET /api/health/live   # Liveness probe
```

### Environment Status
```http
GET /api/health/environment
GET /api/health/services
```

## Security Features

### Environment Variable Encryption
- AES-256-CBC encryption for sensitive variables
- Automatic encryption/decryption based on environment
- Encryption key management

### Audit Logging
- Environment change tracking
- Configuration validation logging
- Security event monitoring

### CORS Management
- Environment-specific origin whitelisting
- Dynamic origin validation
- Secure credential handling

## Monitoring and Observability

### Health Checks
- Database connectivity monitoring
- AI service availability
- Payment system status
- Email service validation
- CORS configuration verification

### Performance Metrics
- Response time tracking
- Memory usage monitoring
- Uptime tracking
- Service availability

### Logging
- Structured logging with timestamps
- Environment-specific log levels
- Error tracking and reporting
- Deployment logging

## Backup and Recovery

### Automated Backups
```bash
# Create backup
npm run backup:create

# Restore from backup
npm run backup:restore
```

### Backup Features
- Database backup automation
- Configuration backup
- Incremental backup support
- Backup verification

## Troubleshooting

### Common Issues

1. **Environment Validation Failed**
   ```bash
   npm run env:validate
   # Check missing required variables
   ```

2. **Health Check Failures**
   ```bash
   npm run env:health
   # Review service status
   ```

3. **Deployment Issues**
   ```bash
   npm run docker:logs:production
   # Check container logs
   ```

### Debug Mode
```bash
# Enable debug logging
DEBUG=medspasync:* npm start
```

## Best Practices

### Environment Management
1. Always validate environment before deployment
2. Use environment-specific Docker Compose files
3. Implement proper secret management
4. Regular health check monitoring

### Security
1. Use strong encryption keys in production
2. Enable audit logging for all environments
3. Implement proper CORS policies
4. Regular security updates

### Monitoring
1. Set up automated health checks
2. Monitor performance metrics
3. Implement alerting for failures
4. Regular backup verification

## Support

For issues or questions regarding the environment management system:

1. Check the health endpoints for service status
2. Review deployment logs for errors
3. Validate environment configuration
4. Contact the development team

## Changelog

### Version 1.0.0
- Initial environment management system
- Multi-environment support
- Health monitoring
- Deployment automation
- Security features 