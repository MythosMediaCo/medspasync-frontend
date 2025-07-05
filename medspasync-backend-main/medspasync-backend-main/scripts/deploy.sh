#!/bin/bash

# MedSpaSync Pro Reporting System - Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
PROJECT_NAME="medspasync-reporting"
DEPLOYMENT_ENV=${1:-production}
BACKUP_DIR="./backups"
LOG_DIR="./logs"

# Create necessary directories
mkdir -p $BACKUP_DIR $LOG_DIR

log_info "Starting deployment of MedSpaSync Pro Reporting System"
log_info "Deployment environment: $DEPLOYMENT_ENV"

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        log_warning ".env file not found. Creating from template..."
        if [ -f env.example ]; then
            cp env.example .env
            log_warning "Please edit .env file with your actual configuration values"
            exit 1
        else
            log_error "env.example template not found"
            exit 1
        fi
    fi
    
    log_success "Prerequisites check passed"
}

# Function to backup existing data
backup_existing_data() {
    log_info "Creating backup of existing data..."
    
    BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql"
    
    # Backup database if DATABASE_URL is set
    if [ -n "$DATABASE_URL" ]; then
        pg_dump $DATABASE_URL > $BACKUP_FILE 2>/dev/null || log_warning "Database backup failed (database might not exist yet)"
        log_success "Database backup created: $BACKUP_FILE"
    fi
    
    # Backup uploaded files
    if [ -d "./uploads" ]; then
        tar -czf "$BACKUP_DIR/uploads-$(date +%Y%m%d-%H%M%S).tar.gz" ./uploads 2>/dev/null || log_warning "Uploads backup failed"
        log_success "Uploads backup created"
    fi
}

# Function to install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Install production dependencies
    npm ci --only=production || {
        log_error "Failed to install production dependencies"
        exit 1
    }
    
    # Install development dependencies for build tools
    npm install --save-dev prisma @prisma/client || {
        log_error "Failed to install Prisma dependencies"
        exit 1
    }
    
    log_success "Dependencies installed successfully"
}

# Function to setup database
setup_database() {
    log_info "Setting up database..."
    
    # Generate Prisma client
    log_info "Generating Prisma client..."
    npx prisma generate || {
        log_error "Failed to generate Prisma client"
        exit 1
    }
    
    # Run database migrations
    log_info "Running database migrations..."
    npx prisma migrate deploy || {
        log_error "Failed to run database migrations"
        exit 1
    }
    
    # Seed database with initial data if seed script exists
    if [ -f "prisma/seed.js" ]; then
        log_info "Seeding database..."
        npx prisma db seed || log_warning "Database seeding failed"
    fi
    
    log_success "Database setup completed"
}

# Function to create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    
    mkdir -p uploads templates reports logs
    
    # Set proper permissions
    chmod 755 uploads templates reports logs
    
    log_success "Directories created successfully"
}

# Function to run tests
run_tests() {
    log_info "Running validation tests..."
    
    # Run the validation test
    node test-validation.js || {
        log_error "Validation tests failed"
        exit 1
    }
    
    log_success "All tests passed"
}

# Function to start the application
start_application() {
    log_info "Starting the application..."
    
    # Check if PM2 is available for process management
    if command -v pm2 &> /dev/null; then
        log_info "Using PM2 for process management"
        
        # Create PM2 ecosystem file
        cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$PROJECT_NAME',
    script: 'app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: '$DEPLOYMENT_ENV',
      PORT: 3000
    },
    error_file: '$LOG_DIR/err.log',
    out_file: '$LOG_DIR/out.log',
    log_file: '$LOG_DIR/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=2048'
  }]
}
EOF
        
        # Start with PM2
        pm2 start ecosystem.config.js || {
            log_error "Failed to start application with PM2"
            exit 1
        }
        
        # Save PM2 configuration
        pm2 save
        
        log_success "Application started with PM2"
        
    else
        log_warning "PM2 not found, starting with Node.js directly"
        
        # Start with Node.js
        nohup node app.js > $LOG_DIR/app.log 2>&1 &
        echo $! > .pid
        
        log_success "Application started with PID: $(cat .pid)"
    fi
}

# Function to check application health
check_health() {
    log_info "Checking application health..."
    
    # Wait for application to start
    sleep 5
    
    # Check if application is responding
    for i in {1..30}; do
        if curl -f http://localhost:3000/health > /dev/null 2>&1; then
            log_success "Application is healthy and responding"
            return 0
        fi
        
        log_info "Waiting for application to start... (attempt $i/30)"
        sleep 2
    done
    
    log_error "Application health check failed"
    return 1
}

# Function to setup monitoring
setup_monitoring() {
    log_info "Setting up monitoring..."
    
    # Create monitoring script
    cat > scripts/monitor.sh << 'EOF'
#!/bin/bash

# Simple monitoring script
while true; do
    if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo "$(date): Application is down, restarting..."
        pm2 restart medspasync-reporting || node app.js > logs/app.log 2>&1 &
    fi
    sleep 60
done
EOF
    
    chmod +x scripts/monitor.sh
    
    # Start monitoring in background
    nohup ./scripts/monitor.sh > logs/monitor.log 2>&1 &
    
    log_success "Monitoring setup completed"
}

# Function to display deployment summary
deployment_summary() {
    log_info "Deployment Summary"
    echo "=================="
    echo "Project: $PROJECT_NAME"
    echo "Environment: $DEPLOYMENT_ENV"
    echo "Status: ✅ Deployed Successfully"
    echo ""
    echo "Application URLs:"
    echo "  - Health Check: http://localhost:3000/health"
    echo "  - API Base: http://localhost:3000/api"
    echo "  - Reporting API: http://localhost:3000/api/reporting"
    echo ""
    echo "Log Files:"
    echo "  - Application: $LOG_DIR/app.log"
    echo "  - Monitoring: $LOG_DIR/monitor.log"
    echo ""
    echo "Management Commands:"
    echo "  - View logs: tail -f $LOG_DIR/app.log"
    echo "  - Restart: pm2 restart $PROJECT_NAME"
    echo "  - Status: pm2 status"
    echo ""
    echo "Next Steps:"
    echo "  1. Configure your frontend to connect to the API"
    echo "  2. Set up SSL certificates for production"
    echo "  3. Configure your POS integration API keys"
    echo "  4. Begin user onboarding and training"
    echo ""
    log_success "Deployment completed successfully!"
}

# Main deployment function
main() {
    log_info "Starting MedSpaSync Pro Reporting System deployment..."
    
    # Load environment variables
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    # Run deployment steps
    check_prerequisites
    backup_existing_data
    install_dependencies
    setup_database
    create_directories
    run_tests
    start_application
    check_health
    setup_monitoring
    deployment_summary
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "test")
        run_tests
        ;;
    "start")
        start_application
        ;;
    "stop")
        if command -v pm2 &> /dev/null; then
            pm2 stop $PROJECT_NAME
        else
            kill $(cat .pid 2>/dev/null) 2>/dev/null || true
            rm -f .pid
        fi
        log_success "Application stopped"
        ;;
    "restart")
        if command -v pm2 &> /dev/null; then
            pm2 restart $PROJECT_NAME
        else
            kill $(cat .pid 2>/dev/null) 2>/dev/null || true
            start_application
        fi
        log_success "Application restarted"
        ;;
    "logs")
        tail -f $LOG_DIR/app.log
        ;;
    "status")
        if command -v pm2 &> /dev/null; then
            pm2 status
        else
            if [ -f .pid ]; then
                echo "Application PID: $(cat .pid)"
                ps -p $(cat .pid) > /dev/null && echo "Status: Running" || echo "Status: Stopped"
            else
                echo "Status: Not running"
            fi
        fi
        ;;
    "help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  deploy   - Full deployment (default)"
        echo "  test     - Run validation tests only"
        echo "  start    - Start the application"
        echo "  stop     - Stop the application"
        echo "  restart  - Restart the application"
        echo "  logs     - View application logs"
        echo "  status   - Check application status"
        echo "  help     - Show this help message"
        ;;
    *)
        log_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac 