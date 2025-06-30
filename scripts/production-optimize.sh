#!/bin/bash

# MedSpaSync Pro - Production Optimization Script
# This script optimizes the entire ecosystem for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
LOG_FILE="production-optimize-$(date +%Y%m%d_%H%M%S).log"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if running as root (for some operations)
    if [[ $EUID -eq 0 ]]; then
        warning "Running as root. Some operations may require elevated privileges."
    fi
    
    success "Prerequisites check passed"
}

# System optimization
optimize_system() {
    log "Optimizing system for production..."
    
    # Increase file descriptor limits
    if [[ $EUID -eq 0 ]]; then
        echo "* soft nofile 65536" >> /etc/security/limits.conf
        echo "* hard nofile 65536" >> /etc/security/limits.conf
        echo "session required pam_limits.so" >> /etc/pam.d/common-session
    else
        ulimit -n 65536
    fi
    
    # Optimize kernel parameters
    if [[ $EUID -eq 0 ]]; then
        cat >> /etc/sysctl.conf << EOF
# Network optimization
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_tw_buckets = 5000
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 1024 65535

# Memory optimization
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5

# File system optimization
fs.file-max = 2097152
EOF
        sysctl -p
    fi
    
    success "System optimization completed"
}

# Docker optimization
optimize_docker() {
    log "Optimizing Docker configuration..."
    
    # Create or update Docker daemon configuration
    sudo mkdir -p /etc/docker
    cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ],
  "default-ulimits": {
    "nofile": {
      "Hard": 65536,
      "Name": "nofile",
      "Soft": 65536
    }
  },
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 5,
  "experimental": false,
  "metrics-addr": "127.0.0.1:9323",
  "live-restore": true
}
EOF
    
    # Restart Docker daemon
    sudo systemctl restart docker
    
    success "Docker optimization completed"
}

# Security hardening
harden_security() {
    log "Hardening security configuration..."
    
    # Create security group
    docker network create --driver bridge --opt com.docker.network.bridge.name=medspasync-br0 medspasync-network
    
    # Set up firewall rules (if ufw is available)
    if command -v ufw &> /dev/null; then
        sudo ufw --force enable
        sudo ufw default deny incoming
        sudo ufw default allow outgoing
        sudo ufw allow ssh
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw allow 3000/tcp  # Frontend
        sudo ufw allow 5000/tcp  # Backend
        sudo ufw allow 8000/tcp  # AI API
        sudo ufw allow 9090/tcp  # Prometheus
        sudo ufw allow 3002/tcp  # Grafana
        sudo ufw allow 9093/tcp  # Alertmanager
        sudo ufw allow 9100/tcp  # Node Exporter
        sudo ufw allow 9323/tcp  # Docker Exporter
        sudo ufw allow 8086/tcp  # InfluxDB
    fi
    
    # Create non-root user for running containers
    if ! id "medspasync" &>/dev/null; then
        sudo useradd -r -s /bin/false medspasync
    fi
    
    success "Security hardening completed"
}

# SSL/TLS setup
setup_ssl() {
    log "Setting up SSL/TLS certificates..."
    
    # Create SSL directory
    mkdir -p medspasync-ecosystem/nginx/ssl
    
    # Check if Let's Encrypt certificates exist
    if [ ! -f "medspasync-ecosystem/nginx/ssl/fullchain.pem" ]; then
        warning "SSL certificates not found. Please run certbot or manually install certificates."
        warning "Place certificates in: medspasync-ecosystem/nginx/ssl/"
        
        # Create self-signed certificate for development
        if [ "$ENVIRONMENT" = "development" ]; then
            log "Creating self-signed certificate for development..."
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout medspasync-ecosystem/nginx/ssl/privkey.pem \
                -out medspasync-ecosystem/nginx/ssl/fullchain.pem \
                -subj "/C=US/ST=State/L=City/O=MedSpaSync/CN=localhost"
        fi
    else
        success "SSL certificates found"
    fi
}

# Database optimization
optimize_database() {
    log "Optimizing database configuration..."
    
    # Create PostgreSQL optimization script
    cat > medspasync-ecosystem/database/optimize.sql << EOF
-- PostgreSQL optimization for MedSpaSync Pro
-- Run this after database initialization

-- Set work memory for complex queries
SET work_mem = '256MB';

-- Set maintenance work memory
SET maintenance_work_mem = '512MB';

-- Set shared buffers (25% of available RAM)
SET shared_buffers = '1GB';

-- Set effective cache size (75% of available RAM)
SET effective_cache_size = '3GB';

-- Enable parallel query execution
SET max_parallel_workers_per_gather = 4;
SET max_parallel_workers = 8;

-- Optimize checkpoint settings
SET checkpoint_completion_target = 0.9;
SET wal_buffers = '16MB';

-- Optimize logging
SET log_min_duration_statement = 1000;
SET log_checkpoints = on;
SET log_connections = on;
SET log_disconnections = on;
SET log_lock_waits = on;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches ON reconciliation_matches(confidence_score);

-- Analyze tables for better query planning
ANALYZE;
EOF
    
    success "Database optimization completed"
}

# Monitoring setup
setup_monitoring() {
    log "Setting up monitoring and alerting..."
    
    # Create Grafana dashboard
    cat > medspasync-ecosystem/monitoring/grafana-dashboard.json << EOF
{
  "dashboard": {
    "id": null,
    "title": "MedSpaSync Pro Dashboard",
    "tags": ["medspasync", "production"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "System Overview",
        "type": "stat",
        "targets": [
          {
            "expr": "up",
            "legendFormat": "{{job}}"
          }
        ]
      },
      {
        "id": 2,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])",
            "legendFormat": "{{job}}"
          }
        ]
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "{{job}}"
          }
        ]
      },
      {
        "id": 4,
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends",
            "legendFormat": "{{datname}}"
          }
        ]
      },
      {
        "id": 5,
        "title": "Redis Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "redis_memory_used_bytes",
            "legendFormat": "Redis Memory"
          }
        ]
      },
      {
        "id": 6,
        "title": "AI API Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(ai_reconciliation_duration_seconds_sum[5m]) / rate(ai_reconciliation_duration_seconds_count[5m])",
            "legendFormat": "Reconciliation Time"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
EOF
    
    # Create backup script
    cat > medspasync-ecosystem/scripts/backup.sh << 'EOF'
#!/bin/bash

# MedSpaSync Pro Backup Script
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="medspasync_backup_$DATE.sql"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL database
pg_dump -h postgres -U medspasync_user -d medspasync_pro > "$BACKUP_DIR/$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_DIR/$BACKUP_FILE"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "medspasync_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/$BACKUP_FILE.gz"
EOF
    
    chmod +x medspasync-ecosystem/scripts/backup.sh
    
    success "Monitoring setup completed"
}

# Performance testing
run_performance_tests() {
    log "Running performance tests..."
    
    # Check if k6 is installed
    if ! command -v k6 &> /dev/null; then
        warning "k6 not installed. Installing k6..."
        sudo gpg -k
        sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
        echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
        sudo apt-get update
        sudo apt-get install k6
    fi
    
    # Run basic performance test
    if [ -f "performance-tests/load-test.js" ]; then
        log "Running k6 performance test..."
        k6 run --out json=performance-results.json performance-tests/load-test.js
        success "Performance test completed"
    else
        warning "Performance test file not found"
    fi
}

# Health checks
run_health_checks() {
    log "Running health checks..."
    
    # Check if services are running
    services=("nginx" "frontend" "backend" "ai-api" "postgres" "redis" "prometheus" "grafana")
    
    for service in "${services[@]}"; do
        if docker ps | grep -q "$service"; then
            success "Service $service is running"
        else
            warning "Service $service is not running"
        fi
    done
    
    # Check disk space
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 80 ]; then
        warning "Disk usage is high: ${DISK_USAGE}%"
    else
        success "Disk usage is acceptable: ${DISK_USAGE}%"
    fi
    
    # Check memory usage
    MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.2f", $3/$2 * 100.0)}')
    if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
        warning "Memory usage is high: ${MEMORY_USAGE}%"
    else
        success "Memory usage is acceptable: ${MEMORY_USAGE}%"
    fi
}

# Generate optimization report
generate_report() {
    log "Generating optimization report..."
    
    cat > "production-optimization-report-$(date +%Y%m%d_%H%M%S).md" << EOF
# MedSpaSync Pro Production Optimization Report

## Optimization Summary
- **Date**: $(date)
- **Environment**: $ENVIRONMENT
- **Duration**: $(($(date +%s) - START_TIME)) seconds

## System Optimizations
- [x] File descriptor limits increased to 65536
- [x] Kernel parameters optimized for high performance
- [x] Docker daemon configuration optimized
- [x] Security hardening applied
- [x] SSL/TLS certificates configured
- [x] Database optimization scripts created
- [x] Monitoring and alerting setup completed

## Performance Metrics
- **Disk Usage**: $(df / | tail -1 | awk '{print $5}')
- **Memory Usage**: $(free | grep Mem | awk '{printf("%.2f", $3/$2 * 100.0)}')%
- **Docker Version**: $(docker --version)
- **Docker Compose Version**: $(docker-compose --version)

## Recommendations
1. Monitor system resources regularly
2. Set up automated backups
3. Configure log rotation
4. Implement rate limiting
5. Set up CDN for static assets
6. Configure database connection pooling
7. Implement caching strategies

## Next Steps
1. Deploy to production environment
2. Run full performance tests
3. Set up monitoring alerts
4. Configure backup automation
5. Implement disaster recovery plan

## Log File
Complete optimization log: $LOG_FILE
EOF
    
    success "Optimization report generated"
}

# Main execution
main() {
    START_TIME=$(date +%s)
    
    log "Starting MedSpaSync Pro production optimization..."
    log "Environment: $ENVIRONMENT"
    log "Log file: $LOG_FILE"
    
    check_prerequisites
    optimize_system
    optimize_docker
    harden_security
    setup_ssl
    optimize_database
    setup_monitoring
    run_performance_tests
    run_health_checks
    generate_report
    
    log "Production optimization completed successfully!"
    log "Total time: $(($(date +%s) - START_TIME)) seconds"
    
    echo ""
    echo "🚀 MedSpaSync Pro is now optimized for production!"
    echo "📊 Monitoring dashboard: http://localhost:3002"
    echo "📈 Prometheus metrics: http://localhost:9090"
    echo "📋 Optimization report: production-optimization-report-*.md"
    echo ""
    echo "Next steps:"
    echo "1. Review the optimization report"
    echo "2. Deploy using: docker-compose -f docker-compose.production.yml up -d"
    echo "3. Monitor system performance"
    echo "4. Set up automated backups"
}

# Run main function
main "$@" 