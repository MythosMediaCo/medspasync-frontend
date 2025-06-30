#!/bin/bash

# AI Kingdom Deployment Script
# Builds and launches the complete AI reconciliation kingdom

set -e

echo "🏰 Building the AI Kingdom..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if Docker is running
check_docker() {
    print_status "Checking Docker installation..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    print_status "Checking Docker Compose..."
    if ! docker-compose --version > /dev/null 2>&1; then
        print_error "Docker Compose is not installed. Please install it and try again."
        exit 1
    fi
    print_success "Docker Compose is available"
}

# Create necessary directories
create_directories() {
    print_status "Creating kingdom directories..."
    
    mkdir -p data models logs backups
    mkdir -p nginx/ssl
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/datasources
    
    print_success "Directories created"
}

# Generate SSL certificates for development
generate_ssl_certs() {
    print_status "Generating SSL certificates for development..."
    
    if [ ! -f nginx/ssl/cert.pem ]; then
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        print_success "SSL certificates generated"
    else
        print_status "SSL certificates already exist"
    fi
}

# Build the AI engine
build_ai_engine() {
    print_status "Building AI Engine Docker image..."
    docker build -t medspa-ai-engine .
    print_success "AI Engine image built"
}

# Start the kingdom
start_kingdom() {
    print_status "Starting the AI Kingdom..."
    
    # Start core services first
    docker-compose up -d postgres redis
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 10
    
    # Start the AI engine
    docker-compose up -d ai-engine
    
    # Wait for AI engine to be ready
    print_status "Waiting for AI Engine to be ready..."
    sleep 15
    
    # Start remaining services
    docker-compose up -d nginx prometheus grafana
    
    print_success "AI Kingdom is starting up..."
}

# Check kingdom health
check_kingdom_health() {
    print_status "Checking kingdom health..."
    
    # Wait a bit for services to fully start
    sleep 30
    
    # Check AI engine health
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        print_success "AI Engine is healthy"
    else
        print_warning "AI Engine health check failed"
    fi
    
    # Check Nginx
    if curl -f http://localhost:80/health > /dev/null 2>&1; then
        print_success "Nginx gateway is healthy"
    else
        print_warning "Nginx health check failed"
    fi
    
    # Check Prometheus
    if curl -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
        print_success "Prometheus monitoring is healthy"
    else
        print_warning "Prometheus health check failed"
    fi
    
    # Check Grafana
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_success "Grafana dashboard is healthy"
    else
        print_warning "Grafana health check failed"
    fi
}

# Display kingdom information
display_kingdom_info() {
    echo ""
    echo "🏰 AI Kingdom Deployment Complete!"
    echo "=================================="
    echo ""
    echo "🌐 Kingdom Access Points:"
    echo "  • AI Engine API:     http://localhost:8000"
    echo "  • API Documentation: http://localhost:8000/docs"
    echo "  • Health Check:      http://localhost:8000/health"
    echo "  • Nginx Gateway:     http://localhost:80"
    echo "  • Prometheus:        http://localhost:9090"
    echo "  • Grafana Dashboard: http://localhost:3000"
    echo "  • Flower Monitor:    http://localhost:5555"
    echo ""
    echo "🔐 Default Credentials:"
    echo "  • Grafana Admin: admin / kingdom_secure_2024"
    echo "  • Database User: ai_king / kingdom_secure_2024"
    echo ""
    echo "📊 Quick Test Commands:"
    echo "  • Health Check: curl http://localhost:8000/health"
    echo "  • API Status:   curl http://localhost:8000/status"
    echo "  • Model Info:   curl http://localhost:8000/model/info"
    echo ""
    echo "🛠️  Management Commands:"
    echo "  • View logs:    docker-compose logs -f"
    echo "  • Stop kingdom: docker-compose down"
    echo "  • Restart:      docker-compose restart"
    echo "  • Update:       ./kingdom_deploy.sh"
    echo ""
    echo "🎯 Your AI Kingdom is now ready to rule!"
    echo ""
}

# Main deployment function
deploy_kingdom() {
    echo "🏰 Starting AI Kingdom Deployment..."
    echo "=================================="
    
    check_docker
    check_docker_compose
    create_directories
    generate_ssl_certs
    build_ai_engine
    start_kingdom
    check_kingdom_health
    display_kingdom_info
}

# Function to stop the kingdom
stop_kingdom() {
    print_status "Stopping the AI Kingdom..."
    docker-compose down
    print_success "AI Kingdom stopped"
}

# Function to restart the kingdom
restart_kingdom() {
    print_status "Restarting the AI Kingdom..."
    docker-compose restart
    print_success "AI Kingdom restarted"
}

# Function to view logs
view_logs() {
    print_status "Showing kingdom logs..."
    docker-compose logs -f
}

# Function to clean up
cleanup() {
    print_warning "This will remove all kingdom data. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Cleaning up AI Kingdom..."
        docker-compose down -v
        docker system prune -f
        rm -rf data models logs backups
        print_success "Cleanup complete"
    else
        print_status "Cleanup cancelled"
    fi
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        deploy_kingdom
        ;;
    "stop")
        stop_kingdom
        ;;
    "restart")
        restart_kingdom
        ;;
    "logs")
        view_logs
        ;;
    "cleanup")
        cleanup
        ;;
    "health")
        check_kingdom_health
        ;;
    *)
        echo "Usage: $0 {deploy|stop|restart|logs|cleanup|health}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Build and start the AI Kingdom (default)"
        echo "  stop     - Stop the AI Kingdom"
        echo "  restart  - Restart the AI Kingdom"
        echo "  logs     - View kingdom logs"
        echo "  cleanup  - Remove all kingdom data"
        echo "  health   - Check kingdom health"
        exit 1
        ;;
esac 