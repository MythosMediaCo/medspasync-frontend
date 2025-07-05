#!/bin/bash

# deploy-100k-tps.sh
# Comprehensive deployment script for 100K+ TPS MedSpaSync Pro Backend

set -e

echo "🚀 MedSpaSync Pro 100K+ TPS Deployment"
echo "========================================"

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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check prerequisites
print_status "Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Prerequisites check passed"

# Load environment variables
print_status "Loading environment variables..."

if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    cp .env.example .env 2>/dev/null || {
        print_error "No .env.example found. Please create a .env file with required variables."
        exit 1
    }
fi

source .env

# Required environment variables
REQUIRED_VARS=(
    "DATABASE_HOST"
    "DATABASE_NAME"
    "DATABASE_USERNAME"
    "DATABASE_PASSWORD"
    "REDIS_PASSWORD"
    "CLOUDFLARE_ZONE_ID"
    "CLOUDFLARE_API_TOKEN"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set"
        exit 1
    fi
done

print_success "Environment variables loaded"

# Install dependencies
print_status "Installing Node.js dependencies..."
npm install --production
print_success "Dependencies installed"

# Run tests
print_status "Running tests..."
npm test
print_success "Tests passed"

# Build Docker images
print_status "Building Docker images..."
docker-compose -f deployment/100k-tps-deployment.yml build
print_success "Docker images built"

# Initialize Redis cluster
print_status "Initializing Redis cluster..."
docker-compose -f deployment/100k-tps-deployment.yml up -d redis-cluster-1 redis-cluster-2 redis-cluster-3 redis-cluster-4 redis-cluster-5 redis-cluster-6

# Wait for Redis nodes to start
sleep 10

# Create Redis cluster
docker exec medspasync-redis-cluster-1 redis-cli --cluster create \
    $(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' medspasync-redis-cluster-1):6379 \
    $(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' medspasync-redis-cluster-2):6379 \
    $(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' medspasync-redis-cluster-3):6379 \
    $(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' medspasync-redis-cluster-4):6379 \
    $(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' medspasync-redis-cluster-5):6379 \
    $(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' medspasync-redis-cluster-6):6379 \
    --cluster-replicas 1 --cluster-yes

print_success "Redis cluster initialized"

# Start all services
print_status "Starting all services..."
docker-compose -f deployment/100k-tps-deployment.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Health check
print_status "Performing health checks..."

# Check application health
for i in {1..30}; do
    if curl -f http://localhost/health > /dev/null 2>&1; then
        print_success "Application is healthy"
        break
    fi
    
    if [ $i -eq 30 ]; then
        print_error "Application health check failed after 30 attempts"
        exit 1
    fi
    
    print_status "Waiting for application to be ready... (attempt $i/30)"
    sleep 10
done

# Check database health
if docker exec medspasync-postgres-primary pg_isready -U $DATABASE_USERNAME > /dev/null 2>&1; then
    print_success "Database is healthy"
else
    print_error "Database health check failed"
    exit 1
fi

# Check Redis health
if docker exec medspasync-redis-session redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is healthy"
else
    print_error "Redis health check failed"
    exit 1
fi

# Run load tests (optional)
if [ "$1" = "--load-test" ]; then
    print_status "Running load tests..."
    docker-compose -f deployment/100k-tps-deployment.yml --profile loadtest run load-tester
    print_success "Load tests completed"
fi

# Display deployment information
echo ""
echo "🎉 Deployment completed successfully!"
echo "====================================="
echo ""
echo "Services:"
echo "  - Application: http://localhost"
echo "  - Health Check: http://localhost/health"
echo "  - Grafana: http://localhost:3001 (admin/admin)"
echo "  - Prometheus: http://localhost:9090"
echo ""
echo "Database:"
echo "  - Primary: localhost:5432"
echo "  - Replica 1: localhost:5433"
echo "  - Replica 2: localhost:5434"
echo ""
echo "Redis:"
echo "  - Session: localhost:6379"
echo "  - Cache: localhost:6380"
echo "  - Queue: localhost:6381"
echo "  - Cluster: localhost:7000-7005"
echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose -f deployment/100k-tps-deployment.yml logs -f"
echo "  - Scale app: docker-compose -f deployment/100k-tps-deployment.yml up -d --scale app=20"
echo "  - Stop all: docker-compose -f deployment/100k-tps-deployment.yml down"
echo "  - Load test: ./deploy-100k-tps.sh --load-test"
echo ""

print_success "MedSpaSync Pro 100K+ TPS deployment completed!" 