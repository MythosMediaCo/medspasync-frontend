# MedSpaSync Pro Reporting System - Deployment Guide

## 🚀 Production Deployment Instructions

This guide provides step-by-step instructions for deploying the Plug-and-Play Reporting System to production.

---

## 📋 Prerequisites

### System Requirements
- **Node.js:** Version 18 or higher
- **PostgreSQL:** Version 13 or higher
- **RAM:** Minimum 2GB, Recommended 4GB+
- **Storage:** Minimum 10GB available space
- **OS:** Linux (Ubuntu 20.04+), macOS, or Windows Server

### Required Accounts & API Keys
- **POS System API Keys:** Zenoti, Vagaro, Mindbody, Boulevard, Alle, Aspire
- **Email Service:** SMTP credentials for scheduled reports
- **SSL Certificate:** For HTTPS in production
- **Domain Name:** For production deployment

---

## 🔧 Step 1: Environment Setup

### 1.1 Clone the Repository
```bash
git clone <your-repository-url>
cd medspasync-backend
```

### 1.2 Install Dependencies
```bash
npm install
npm install --save-dev prisma @prisma/client
```

### 1.3 Configure Environment Variables
```bash
# Copy the environment template
cp env.example .env

# Edit the .env file with your actual values
nano .env
```

**Required Environment Variables:**
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/medspasync"

# Security
JWT_SECRET="your-super-secure-jwt-secret-key-here"
ENCRYPTION_KEY="your-32-character-encryption-key-here"

# File Storage
UPLOAD_DIR="./uploads"
TEMPLATES_DIR="./templates"
REPORTS_DIR="./reports"

# POS Integrations (configure as needed)
ZENOTI_API_KEY="your-zenoti-api-key"
VAGARO_API_KEY="your-vagaro-api-key"
MINDBODY_API_KEY="your-mindbody-api-key"
BOULEVARD_API_KEY="your-boulevard-api-key"
ALLE_API_KEY="your-alle-api-key"
ASPIRE_API_KEY="your-aspire-api-key"

# Email for scheduled reports
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="reports@medspasync.com"
```

---

## 🗄️ Step 2: Database Setup

### 2.1 Install PostgreSQL
**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql
```

**Windows:** Download from https://www.postgresql.org/download/windows/

### 2.2 Create Database
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE medspasync;
CREATE USER medspasync_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE medspasync TO medspasync_user;
\q
```

### 2.3 Run Database Migrations
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Verify database connection
npx prisma studio
```

---

## 🧪 Step 3: Validation Testing

### 3.1 Run Validation Tests
```bash
# Run the comprehensive validation test
node test-validation.js
```

**Expected Output:**
```
✅ All validation tests passed! The system is ready for production deployment.
```

### 3.2 Test Database Connection
```bash
# Test database connectivity
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$connect()
  .then(() => console.log('✅ Database connection successful'))
  .catch(e => console.error('❌ Database connection failed:', e))
  .finally(() => prisma.$disconnect());
"
```

---

## 🚀 Step 4: Application Deployment

### 4.1 Using the Deployment Script (Recommended)
```bash
# Make the script executable
chmod +x scripts/deploy.sh

# Run full deployment
./scripts/deploy.sh deploy

# Or run individual steps
./scripts/deploy.sh test    # Run tests only
./scripts/deploy.sh start   # Start application only
./scripts/deploy.sh status  # Check status
./scripts/deploy.sh logs    # View logs
```

### 4.2 Manual Deployment
```bash
# Create necessary directories
mkdir -p uploads templates reports logs backups

# Set permissions
chmod 755 uploads templates reports logs

# Start the application
node app.js
```

### 4.3 Using PM2 (Production)
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start app.js --name "medspasync-reporting"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

---

## 🔒 Step 5: Security Configuration

### 5.1 SSL Certificate Setup
```bash
# Install Certbot (Let's Encrypt)
sudo apt install certbot

# Obtain SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Configure Nginx with SSL
sudo nano /etc/nginx/sites-available/medspasync
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5.2 Firewall Configuration
```bash
# Configure UFW firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## 📊 Step 6: Monitoring & Logging

### 6.1 Application Monitoring
```bash
# View application logs
tail -f logs/app.log

# Monitor system resources
htop

# Check application status
curl http://localhost:3000/health
```

### 6.2 Database Monitoring
```bash
# Monitor database connections
psql -d medspasync -c "SELECT count(*) FROM pg_stat_activity;"

# Check database size
psql -d medspasync -c "SELECT pg_size_pretty(pg_database_size('medspasync'));"
```

### 6.3 Performance Monitoring
```bash
# Monitor file uploads
ls -la uploads/ | wc -l

# Monitor generated reports
ls -la reports/ | wc -l

# Check disk usage
df -h
```

---

## 🔧 Step 7: Frontend Integration

### 7.1 Update Frontend Configuration
Update your frontend application to connect to the reporting API:

```javascript
// API configuration
const API_BASE_URL = 'https://your-domain.com/api';
const REPORTING_API_URL = `${API_BASE_URL}/reporting`;

// Example API call
const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('files', file);
  
  const response = await fetch(`${REPORTING_API_URL}/files/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: formData
  });
  
  return response.json();
};
```

### 7.2 CORS Configuration
Ensure your backend CORS settings match your frontend domain:

```javascript
// In app.js
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://your-frontend-domain.com');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
```

---

## 📈 Step 8: Performance Optimization

### 8.1 Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX idx_file_processing_jobs_user_id ON "FileProcessingJob"("userId");
CREATE INDEX idx_file_processing_jobs_tenant_id ON "FileProcessingJob"("tenantId");
CREATE INDEX idx_generated_reports_user_id ON "GeneratedReport"("userId");
CREATE INDEX idx_generated_reports_created_at ON "GeneratedReport"("createdAt");
```

### 8.2 File Storage Optimization
```bash
# Configure file cleanup
# Add to crontab for daily cleanup
0 2 * * * find /path/to/uploads -type f -mtime +30 -delete
0 2 * * * find /path/to/reports -type f -mtime +90 -delete
```

### 8.3 Memory Optimization
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=2048"

# Or in PM2 configuration
pm2 start app.js --name "medspasync-reporting" --node-args="--max-old-space-size=2048"
```

---

## 🔄 Step 9: Backup & Recovery

### 9.1 Database Backup
```bash
# Create backup script
cat > scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d-%H%M%S)
pg_dump $DATABASE_URL > "$BACKUP_DIR/backup-$DATE.sql"
gzip "$BACKUP_DIR/backup-$DATE.sql"
echo "Backup created: backup-$DATE.sql.gz"
EOF

chmod +x scripts/backup.sh

# Add to crontab for daily backups
0 1 * * * /path/to/medspasync-backend/scripts/backup.sh
```

### 9.2 File Backup
```bash
# Backup uploaded files and reports
tar -czf "backups/files-$(date +%Y%m%d-%H%M%S).tar.gz" uploads/ reports/
```

### 9.3 Recovery Procedures
```bash
# Restore database
gunzip -c backup-20241201-120000.sql.gz | psql $DATABASE_URL

# Restore files
tar -xzf files-20241201-120000.tar.gz
```

---

## 🎯 Step 10: User Onboarding

### 10.1 Feature Announcement
- Send email campaign to existing users
- Create demo videos and tutorials
- Update documentation and help guides

### 10.2 Training Materials
- User guide for file uploads
- Report generation tutorials
- POS integration setup guides
- Subscription tier comparison

### 10.3 Support Setup
- Configure help desk system
- Create FAQ documentation
- Set up support email addresses
- Train support team on new features

---

## 📊 Step 11: Monitoring & Analytics

### 11.1 Key Metrics to Track
- **File Upload Success Rate:** Target >95%
- **Report Generation Time:** Target <30 seconds
- **API Response Time:** Target <200ms
- **User Adoption Rate:** Track feature usage
- **Revenue Impact:** Monitor tier upgrades

### 11.2 Health Checks
```bash
# Automated health check script
cat > scripts/health-check.sh << 'EOF'
#!/bin/bash
HEALTH_URL="http://localhost:3000/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "$(date): ✅ Application healthy"
else
    echo "$(date): ❌ Application unhealthy (HTTP $RESPONSE)"
    # Send alert or restart application
fi
EOF

# Add to crontab for monitoring
*/5 * * * * /path/to/medspasync-backend/scripts/health-check.sh
```

---

## 🚨 Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection string
echo $DATABASE_URL

# Test connection manually
psql $DATABASE_URL -c "SELECT 1;"
```

**2. File Upload Issues**
```bash
# Check directory permissions
ls -la uploads/

# Check disk space
df -h

# Check file size limits
grep MAX_FILE_SIZE .env
```

**3. POS Integration Errors**
```bash
# Check API keys
grep -E "(ZENOTI|VAGARO|MINDBODY)_API_KEY" .env

# Test API connectivity
curl -H "Authorization: Bearer $ZENOTI_API_KEY" $ZENOTI_BASE_URL/health
```

**4. Memory Issues**
```bash
# Check memory usage
free -h

# Check Node.js memory
ps aux | grep node

# Restart with more memory
pm2 restart medspasync-reporting --node-args="--max-old-space-size=4096"
```

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- **Daily:** Monitor logs and health checks
- **Weekly:** Review performance metrics
- **Monthly:** Update dependencies and security patches
- **Quarterly:** Review and optimize database performance

### Contact Information
- **Technical Support:** tech-support@medspasync.com
- **Sales Inquiries:** sales@medspasync.com
- **Emergency:** +1-555-REPORT-911

---

## 🎉 Deployment Complete!

Your MedSpaSync Pro Reporting System is now deployed and ready to generate revenue through Premium tier pricing!

**Next Steps:**
1. ✅ Configure frontend integration
2. ✅ Set up SSL certificates
3. ✅ Configure POS API keys
4. ✅ Begin user onboarding
5. ✅ Monitor performance and usage
6. ✅ Track revenue impact

**Expected Results:**
- **Revenue Increase:** $200/month premium per Professional tier user
- **User Engagement:** Advanced reporting features drive higher retention
- **Competitive Advantage:** Unique multi-system integration capabilities
- **Scalability:** Ready for enterprise deployment and growth

---

*Deployment Guide Version: 1.0*  
*Last Updated: December 2024*  
*Status: ✅ Production Ready* 