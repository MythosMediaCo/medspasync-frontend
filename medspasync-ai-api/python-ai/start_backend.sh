#!/bin/bash

# ========================================
# MedSpaSync Pro Backend Startup Script
# ========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$SCRIPT_DIR/.env"
LOG_FILE="$SCRIPT_DIR/logs/backend.log"
PID_FILE="$SCRIPT_DIR/backend.pid"

# Create logs directory
mkdir -p "$SCRIPT_DIR/logs"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to validate environment
validate_environment() {
    local env_file=".env"
    
    if [ ! -f "$env_file" ]; then
        print_warning "No .env file found. Creating from template..."
        if [ -f "env.example" ]; then
            cp env.example .env
            print_success "Created .env from template"
        else
            print_error "No env.example template found"
            exit 1
        fi
    fi
    
    # Load environment variables
    if [ -f "$env_file" ]; then
        export $(grep -v '^#' "$env_file" | xargs)
    fi
    
    # Validate required variables
    local required_vars=("ENVIRONMENT" "API_HOST" "API_PORT")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    print_success "Environment validation passed"
}

# Function to check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check Python
    if ! command_exists python3; then
        print_error "Python 3 is required but not installed"
        exit 1
    fi
    
    # Check pip
    if ! command_exists pip3; then
        print_error "pip3 is required but not installed"
        exit 1
    fi
    
    # Check Docker (optional)
    if ! command_exists docker; then
        print_warning "Docker not found. Some features may not work"
    fi
    
    # Check Docker Compose (optional)
    if ! command_exists docker-compose; then
        print_warning "Docker Compose not found. Some features may not work"
    fi
    
    print_success "Dependencies check completed"
}

# Function to install Python dependencies
install_dependencies() {
    print_status "Installing Python dependencies..."
    
    if [ -f "requirements.txt" ]; then
        pip3 install -r requirements.txt
        print_success "Python dependencies installed"
    else
        print_error "requirements.txt not found"
        exit 1
    fi
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    local dirs=("data" "models" "logs" "uploads" "backups")
    
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_status "Created directory: $dir"
        fi
    done
    
    print_success "Directories created"
}

# Function to start with Docker Compose
start_with_docker() {
    local env="$1"
    local compose_file="docker-compose.yml"
    local override_file="docker-compose.${env}.yml"
    
    print_status "Starting with Docker Compose (environment: $env)..."
    
    if [ ! -f "$compose_file" ]; then
        print_error "docker-compose.yml not found"
        exit 1
    fi
    
    # Build and start services
    if [ -f "$override_file" ]; then
        print_status "Using override file: $override_file"
        docker-compose -f "$compose_file" -f "$override_file" up --build -d
    else
        print_status "No override file found, using base configuration"
        docker-compose -f "$compose_file" up --build -d
    fi
    
    print_success "Docker services started"
}

# Function to start without Docker
start_without_docker() {
    print_status "Starting without Docker..."
    
    # Check if Redis is running
    if ! command_exists redis-cli || ! redis-cli ping >/dev/null 2>&1; then
        print_warning "Redis not running. Some features may not work"
    fi
    
    # Check if PostgreSQL is running
    if ! command_exists psql; then
        print_warning "PostgreSQL client not found. Database features may not work"
    fi
    
    # Start the API server
    print_status "Starting API server..."
    python3 -m uvicorn api_server:app --host "$API_HOST" --port "$API_PORT" --reload
}

# Function to run health check
run_health_check() {
    print_status "Running health check..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f "http://$API_HOST:$API_PORT/health/quick" >/dev/null 2>&1; then
            print_success "Health check passed"
            return 0
        fi
        
        print_status "Health check attempt $attempt/$max_attempts failed, retrying in 2 seconds..."
        sleep 2
        ((attempt++))
    done
    
    print_error "Health check failed after $max_attempts attempts"
    return 1
}

# Function to show status
show_status() {
    print_status "Backend Status:"
    echo "  Environment: $ENVIRONMENT"
    echo "  API Host: $API_HOST"
    echo "  API Port: $API_PORT"
    echo "  Debug Mode: $DEBUG"
    echo "  Log Level: $LOG_LEVEL"
    echo ""
    echo "Available endpoints:"
    echo "  Health Check: http://$API_HOST:$API_PORT/health"
    echo "  API Docs: http://$API_HOST:$API_PORT/docs"
    echo "  Status: http://$API_HOST:$API_PORT/status"
    echo "  Config: http://$API_HOST:$API_PORT/config"
}

# Load environment variables
load_environment() {
    log "Loading environment configuration..."
    
    if [[ -f "$ENV_FILE" ]]; then
        export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
        success "Environment variables loaded from $ENV_FILE"
    else
        warning "No .env file found, using default environment"
        export ENVIRONMENT=${ENVIRONMENT:-development}
        export DEBUG=${DEBUG:-true}
        export LOG_LEVEL=${LOG_LEVEL:-INFO}
        export API_VERSION=${API_VERSION:-1.0.0}
        export HIPAA_COMPLIANCE_MODE=${HIPAA_COMPLIANCE_MODE:-false}
        export DATA_ENCRYPTION_ENABLED=${DATA_ENCRYPTION_ENABLED:-false}
        export AUDIT_LOGGING_ENABLED=${AUDIT_LOGGING_ENABLED:-true}
        export RATE_LIMIT_ENABLED=${RATE_LIMIT_ENABLED:-true}
        export RATE_LIMIT_REQUESTS=${RATE_LIMIT_REQUESTS:-100}
        export RATE_LIMIT_WINDOW=${RATE_LIMIT_WINDOW:-60}
        export PROMETHEUS_ENABLED=${PROMETHEUS_ENABLED:-true}
        export MAX_WORKERS=${MAX_WORKERS:-4}
        export BATCH_SIZE=${BATCH_SIZE:-100}
        export MODEL_THRESHOLD=${MODEL_THRESHOLD:-0.7}
        export ALLOWED_FILE_TYPES=${ALLOWED_FILE_TYPES:-csv,xlsx,xls}
        export MAX_FILE_SIZE=${MAX_FILE_SIZE:-10485760}
        export REDIS_URL=${REDIS_URL:-redis://localhost:6379}
        export DATABASE_URL=${DATABASE_URL:-postgresql://medspa:medspa123@localhost:5432/medspasync_dev}
    fi
    
    log "Environment: $ENVIRONMENT"
    log "Debug Mode: $DEBUG"
    log "Log Level: $LOG_LEVEL"
    log "API Version: $API_VERSION"
    log "HIPAA Compliance: $HIPAA_COMPLIANCE_MODE"
    log "Rate Limiting: $RATE_LIMIT_ENABLED"
    log "Redis URL: $REDIS_URL"
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check Python version
    if ! command -v python3 &> /dev/null; then
        error "Python 3 is required but not installed"
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    log "Python version: $PYTHON_VERSION"
    
    # Check pip
    if ! command -v pip3 &> /dev/null; then
        error "pip3 is required but not installed"
        exit 1
    fi
    
    # Check if virtual environment exists
    if [[ ! -d "venv" ]]; then
        warning "Virtual environment not found, creating one..."
        python3 -m venv venv
        success "Virtual environment created"
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Check required packages
    if [[ ! -f "requirements.txt" ]]; then
        error "requirements.txt not found"
        exit 1
    fi
    
    log "Installing/updating Python dependencies..."
    pip install -r requirements.txt
    success "Dependencies installed"
}

# Check Redis connectivity
check_redis() {
    log "Checking Redis connectivity..."
    
    # Extract Redis host and port from URL
    if [[ $REDIS_URL == redis://* ]]; then
        REDIS_HOST_PORT=$(echo $REDIS_URL | sed 's|redis://||')
        REDIS_HOST=$(echo $REDIS_HOST_PORT | cut -d: -f1)
        REDIS_PORT=$(echo $REDIS_HOST_PORT | cut -d: -f2 | cut -d/ -f1)
    else
        REDIS_HOST="localhost"
        REDIS_PORT="6379"
    fi
    
    # Check if Redis is running
    if command -v redis-cli &> /dev/null; then
        if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping &> /dev/null; then
            success "Redis is running and accessible"
            return 0
        else
            warning "Redis is not accessible at $REDIS_HOST:$REDIS_PORT"
            return 1
        fi
    else
        warning "redis-cli not found, skipping Redis check"
        return 1
    fi
}

# Check database connectivity
check_database() {
    log "Checking database connectivity..."
    
    # Extract database info from URL
    if [[ $DATABASE_URL == postgresql://* ]]; then
        DB_INFO=$(echo $DATABASE_URL | sed 's|postgresql://||')
        DB_USER=$(echo $DB_INFO | cut -d: -f1)
        DB_PASS=$(echo $DB_INFO | cut -d@ -f1 | cut -d: -f2)
        DB_HOST_PORT=$(echo $DB_INFO | cut -d@ -f2)
        DB_HOST=$(echo $DB_HOST_PORT | cut -d: -f1)
        DB_PORT=$(echo $DB_HOST_PORT | cut -d: -f2 | cut -d/ -f1)
        DB_NAME=$(echo $DB_HOST_PORT | cut -d/ -f2)
    else
        warning "Database URL format not recognized"
        return 1
    fi
    
    # Check if PostgreSQL is running
    if command -v psql &> /dev/null; then
        if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &> /dev/null; then
            success "Database is accessible"
            return 0
        else
            warning "Database is not accessible"
            return 1
        fi
    else
        warning "psql not found, skipping database check"
        return 1
    fi
}

# Start Redis if not running (development only)
start_redis_dev() {
    if [[ "$ENVIRONMENT" == "development" ]]; then
        log "Checking if Redis is running locally..."
        
        if ! pgrep -f "redis-server" > /dev/null; then
            warning "Redis not running, starting local Redis server..."
            
            if command -v redis-server &> /dev/null; then
                redis-server --daemonize yes --port 6379
                sleep 2
                
                if redis-cli ping &> /dev/null; then
                    success "Local Redis server started"
                else
                    error "Failed to start local Redis server"
                    return 1
                fi
            else
                error "redis-server not found, please install Redis"
                return 1
            fi
        else
            success "Redis is already running"
        fi
    fi
}

# Start PostgreSQL if not running (development only)
start_postgres_dev() {
    if [[ "$ENVIRONMENT" == "development" ]]; then
        log "Checking if PostgreSQL is running locally..."
        
        if ! pgrep -f "postgres" > /dev/null; then
            warning "PostgreSQL not running, attempting to start..."
            
            # Try to start PostgreSQL (platform-specific)
            if command -v pg_ctl &> /dev/null; then
                # Try to find PostgreSQL data directory
                PG_DATA_DIR=$(pg_ctl -D /usr/local/var/postgres status 2>/dev/null | grep "data directory" | cut -d'"' -f2 2>/dev/null || echo "")
                
                if [[ -n "$PG_DATA_DIR" ]]; then
                    pg_ctl -D "$PG_DATA_DIR" start
                    sleep 3
                    success "PostgreSQL started"
                else
                    warning "PostgreSQL data directory not found, please start PostgreSQL manually"
                fi
            else
                warning "pg_ctl not found, please start PostgreSQL manually"
            fi
        else
            success "PostgreSQL is already running"
        fi
    fi
}

# Initialize database
init_database() {
    log "Initializing database..."
    
    if [[ -f "database/init.sql" ]]; then
        # Extract database info from URL
        DB_INFO=$(echo $DATABASE_URL | sed 's|postgresql://||')
        DB_USER=$(echo $DB_INFO | cut -d: -f1)
        DB_PASS=$(echo $DB_INFO | cut -d@ -f1 | cut -d: -f2)
        DB_HOST_PORT=$(echo $DB_INFO | cut -d@ -f2)
        DB_HOST=$(echo $DB_HOST_PORT | cut -d: -f1)
        DB_PORT=$(echo $DB_HOST_PORT | cut -d: -f2 | cut -d/ -f1)
        DB_NAME=$(echo $DB_HOST_PORT | cut -d/ -f2)
        
        if command -v psql &> /dev/null; then
            PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database/init.sql
            success "Database initialized"
        else
            warning "psql not found, skipping database initialization"
        fi
    else
        warning "No database initialization script found"
    fi
}

# Start the backend service
start_backend() {
    log "Starting MedSpaSync Pro Backend..."
    
    # Check if already running
    if [[ -f "$PID_FILE" ]]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            warning "Backend is already running (PID: $PID)"
            return 0
        else
            warning "Stale PID file found, removing..."
            rm -f "$PID_FILE"
        fi
    fi
    
    # Create uploads directory
    mkdir -p uploads
    
    # Start the API server
    log "Starting API server on port 8000..."
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Start the server
    nohup python api_server.py > "$LOG_FILE" 2>&1 &
    BACKEND_PID=$!
    
    # Save PID
    echo $BACKEND_PID > "$PID_FILE"
    
    # Wait a moment for startup
    sleep 3
    
    # Check if process is still running
    if kill -0 $BACKEND_PID 2>/dev/null; then
        success "Backend started successfully (PID: $BACKEND_PID)"
        log "Logs: $LOG_FILE"
        log "API Documentation: http://localhost:8000/docs"
        log "Health Check: http://localhost:8000/health"
        
        # Show startup info
        echo
        echo "=== MedSpaSync Pro Backend Started ==="
        echo "Environment: $ENVIRONMENT"
        echo "API Version: $API_VERSION"
        echo "Port: 8000"
        echo "Logs: $LOG_FILE"
        echo "PID: $BACKEND_PID"
        echo "====================================="
        echo
    else
        error "Failed to start backend"
        rm -f "$PID_FILE"
        exit 1
    fi
}

# Stop the backend service
stop_backend() {
    log "Stopping MedSpaSync Pro Backend..."
    
    if [[ -f "$PID_FILE" ]]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
            rm -f "$PID_FILE"
            success "Backend stopped"
        else
            warning "Backend process not found"
            rm -f "$PID_FILE"
        fi
    else
        warning "No PID file found"
    fi
}

# Restart the backend service
restart_backend() {
    log "Restarting MedSpaSync Pro Backend..."
    stop_backend
    sleep 2
    start_backend
}

# Show status
show_status() {
    log "Checking backend status..."
    
    if [[ -f "$PID_FILE" ]]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            success "Backend is running (PID: $PID)"
            
            # Check API health
            if command -v curl &> /dev/null; then
                if curl -s http://localhost:8000/health/quick > /dev/null; then
                    success "API is responding"
                else
                    warning "API is not responding"
                fi
            fi
        else
            error "Backend is not running (stale PID file)"
            rm -f "$PID_FILE"
        fi
    else
        error "Backend is not running"
    fi
}

# Show logs
show_logs() {
    if [[ -f "$LOG_FILE" ]]; then
        tail -f "$LOG_FILE"
    else
        error "Log file not found: $LOG_FILE"
    fi
}

# Main function
main() {
    print_status "Starting MedSpaSync Pro Backend..."
    
    # Parse command line arguments
    local use_docker=false
    local environment="development"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --docker)
                use_docker=true
                shift
                ;;
            --env)
                environment="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --docker     Use Docker Compose to start services"
                echo "  --env ENV    Set environment (development, staging, production)"
                echo "  --help       Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Validate environment
    case $environment in
        development|staging|production)
            ;;
        *)
            print_error "Invalid environment: $environment"
            print_error "Valid environments: development, staging, production"
            exit 1
            ;;
    esac
    
    # Set environment variable
    export ENVIRONMENT="$environment"
    
    # Run setup steps
    validate_environment
    check_dependencies
    install_dependencies
    create_directories
    
    # Start services
    if [ "$use_docker" = true ]; then
        start_with_docker "$environment"
        run_health_check
    else
        start_without_docker
    fi
    
    # Show status
    show_status
    
    print_success "MedSpaSync Pro Backend started successfully!"
}

# Run main function with all arguments
main "$@" 