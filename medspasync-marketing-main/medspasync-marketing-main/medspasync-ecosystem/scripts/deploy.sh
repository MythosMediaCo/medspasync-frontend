#!/bin/bash

# MedSpaSync Pro Ecosystem - Unified Deployment Script
# This script orchestrates the deployment of all MedSpaSync services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
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
    
    # Check if .env file exists
    if [ ! -f "$ENV_FILE" ]; then
        warning "Environment file $ENV_FILE not found. Creating from template..."
        create_env_file
    fi
    
    success "Prerequisites check passed"
}

# Create environment file from template
create_env_file() {
    cat > "$ENV_FILE" << EOF
# MedSpaSync Pro Ecosystem Environment Variables
# Generated on $(date)

# Database Configuration
POSTGRES_PASSWORD=secure_password_2024
REDIS_PASSWORD=redis_password_2024

# API Keys and Secrets
AI_API_SECRET_KEY=your_ai_api_secret_key_here
AI_API_KEY=your_ai_api_key_here
JWT_SECRET=your_jwt_secret_here
NEXTAUTH_SECRET=your_nextauth_secret_here

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
EOF
    
    warning "Please edit $ENV_FILE with your actual configuration values before proceeding."
    read -p "Press Enter to continue after editing the environment file..."
}

# Build all services
build_services() {
    log "Building all services..."
    
    # Build AI API
    log "Building AI API service..."
    docker-compose build ai-api
    
    # Build Backend
    log "Building Backend service..."
    docker-compose build backend
    
    # Build Frontend
    log "Building Frontend service..."
    docker-compose build frontend
    
    # Build Marketing
    log "Building Marketing service..."
    docker-compose build marketing
    
    success "All services built successfully"
}

# Initialize database
init_database() {
    log "Initializing database..."
    
    # Start PostgreSQL
    docker-compose up -d postgres
    
    # Wait for PostgreSQL to be ready
    log "Waiting for PostgreSQL to be ready..."
    until docker-compose exec -T postgres pg_isready -U medspasync_user -d medspasync_pro; do
        sleep 2
    done
    
    # Run database migrations
    log "Running database migrations..."
    docker-compose exec -T backend npx prisma db push
    
    success "Database initialized successfully"
}

# Deploy services
deploy_services() {
    log "Deploying MedSpaSync ecosystem..."
    
    # Start all services
    docker-compose up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    wait_for_services
    
    success "All services deployed successfully"
}

# Wait for services to be healthy
wait_for_services() {
    local services=("postgres" "redis" "ai-api" "backend" "frontend" "marketing" "nginx")
    
    for service in "${services[@]}"; do
        log "Waiting for $service to be healthy..."
        local max_attempts=30
        local attempt=1
        
        while [ $attempt -le $max_attempts ]; do
            if docker-compose ps $service | grep -q "healthy"; then
                success "$service is healthy"
                break
            elif [ $attempt -eq $max_attempts ]; then
                error "$service failed to become healthy after $max_attempts attempts"
            fi
            sleep 10
            ((attempt++))
        done
    done
}

# Run health checks
health_checks() {
    log "Running health checks..."
    
    # Check main application
    if curl -f http://localhost/health > /dev/null 2>&1; then
        success "Main application health check passed"
    else
        error "Main application health check failed"
    fi
    
    # Check API endpoints
    if curl -f http://localhost/api/health > /dev/null 2>&1; then
        success "API health check passed"
    else
        error "API health check failed"
    fi
    
    # Check AI API
    if curl -f http://localhost/ai/health > /dev/null 2>&1; then
        success "AI API health check passed"
    else
        error "AI API health check failed"
    fi
    
    # Check monitoring
    if curl -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
        success "Prometheus health check passed"
    else
        error "Prometheus health check failed"
    fi
    
    if curl -f http://localhost:3002/api/health > /dev/null 2>&1; then
        success "Grafana health check passed"
    else
        error "Grafana health check failed"
    fi
}

# Display service information
show_service_info() {
    log "MedSpaSync Pro Ecosystem Deployment Complete!"
    echo
    echo "Service URLs:"
    echo "  Main Application: http://localhost"
    echo "  API Documentation: http://localhost/api/docs"
    echo "  Marketing Site: http://localhost/marketing"
    echo "  Prometheus: http://localhost:9090"
    echo "  Grafana: http://localhost:3002 (admin/admin)"
    echo
    echo "Database:"
    echo "  PostgreSQL: localhost:5432"
    echo "  Redis: localhost:6379"
    echo
    echo "Useful Commands:"
    echo "  View logs: docker-compose logs -f [service_name]"
    echo "  Stop services: docker-compose down"
    echo "  Restart services: docker-compose restart"
    echo "  Update services: ./scripts/deploy.sh"
    echo
}

# Backup function
backup_data() {
    log "Creating backup..."
    
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup database
    docker-compose exec -T postgres pg_dump -U medspasync_user medspasync_pro > "$backup_dir/database.sql"
    
    # Backup configuration
    cp docker-compose.yml "$backup_dir/"
    cp .env "$backup_dir/"
    
    success "Backup created in $backup_dir"
}

# Rollback function
rollback() {
    local backup_dir=$1
    if [ -z "$backup_dir" ]; then
        error "Please specify backup directory for rollback"
    fi
    
    log "Rolling back to $backup_dir..."
    
    # Stop services
    docker-compose down
    
    # Restore database
    docker-compose up -d postgres
    sleep 10
    docker-compose exec -T postgres psql -U medspasync_user -d medspasync_pro -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
    docker-compose exec -T postgres psql -U medspasync_user -d medspasync_pro < "$backup_dir/database.sql"
    
    # Restore configuration
    cp "$backup_dir/docker-compose.yml" .
    cp "$backup_dir/.env" .
    
    # Restart services
    docker-compose up -d
    
    success "Rollback completed"
}

# Main deployment function
main() {
    log "Starting MedSpaSync Pro Ecosystem deployment..."
    
    case "$ENVIRONMENT" in
        "production"|"staging"|"development")
            log "Deploying to $ENVIRONMENT environment"
            ;;
        *)
            error "Invalid environment. Use: production, staging, or development"
            ;;
    esac
    
    # Check if backup is requested
    if [ "$2" = "--backup" ]; then
        backup_data
    fi
    
    # Check if rollback is requested
    if [ "$2" = "--rollback" ]; then
        rollback "$3"
        exit 0
    fi
    
    # Execute deployment steps
    check_prerequisites
    build_services
    init_database
    deploy_services
    health_checks
    show_service_info
    
    success "MedSpaSync Pro Ecosystem deployment completed successfully!"
}

# Handle script arguments
case "$1" in
    "production"|"staging"|"development")
        main "$@"
        ;;
    "backup")
        backup_data
        ;;
    "rollback")
        rollback "$2"
        ;;
    "health")
        health_checks
        ;;
    "logs")
        docker-compose logs -f "${2:-}"
        ;;
    "stop")
        docker-compose down
        ;;
    "restart")
        docker-compose restart
        ;;
    "update")
        git pull
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
        ;;
    *)
        echo "Usage: $0 {production|staging|development} [--backup|--rollback <backup_dir>]"
        echo "       $0 {backup|rollback <backup_dir>|health|logs [service]|stop|restart|update}"
        echo
        echo "Examples:"
        echo "  $0 production              # Deploy to production"
        echo "  $0 production --backup     # Deploy with backup"
        echo "  $0 rollback backups/20241201_120000  # Rollback to specific backup"
        echo "  $0 logs backend            # View backend logs"
        echo "  $0 update                  # Update all services"
        exit 1
        ;;
esac 