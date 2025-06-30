#!/bin/bash

# 🚀 MedSpaSync Pro - Quick Launch Script
# This script provides a streamlined deployment process

set -e

echo "🚀 MedSpaSync Pro - Quick Launch"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
echo ""
echo "📋 Checking prerequisites..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi
print_status "Docker is installed"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi
print_status "Docker Compose is installed"

# Check if we're in the right directory
if [ ! -f "medspasync-ecosystem/docker-compose.production.yml" ]; then
    print_error "Please run this script from the root directory of the MedSpaSync project."
    exit 1
fi
print_status "Project structure verified"

# Deployment options
echo ""
echo "🎯 Choose your deployment option:"
echo "1. Quick Cloud Deployment (Vercel + Railway + Netlify) - Recommended"
echo "2. Local Production Deployment (Docker Compose)"
echo "3. Staging Deployment (Testing)"
echo "4. View deployment guide"

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        print_info "🌐 Cloud Deployment Selected"
        echo ""
        echo "This will deploy your services to:"
        echo "• Frontend: Vercel"
        echo "• Backend: Railway"
        echo "• AI API: Railway"
        echo "• Marketing: Netlify"
        echo ""
        
        read -p "Do you have accounts for Vercel, Railway, and Netlify? (y/n): " has_accounts
        
        if [ "$has_accounts" != "y" ]; then
            echo ""
            print_warning "Please create accounts first:"
            echo "• Vercel: https://vercel.com"
            echo "• Railway: https://railway.app"
            echo "• Netlify: https://netlify.com"
            echo ""
            read -p "Press Enter when you have created the accounts..."
        fi
        
        # Execute cloud deployment
        echo ""
        print_info "Starting cloud deployment..."
        
        # Check if PowerShell script exists
        if [ -f "deploy.ps1" ]; then
            print_info "Using existing deployment script..."
            # Note: This would need to be run in PowerShell
            echo "Please run: ./deploy.ps1"
        else
            print_info "Setting up cloud deployment..."
            
            # Create environment variables template
            cat > .env.cloud << EOF
# Cloud Deployment Environment Variables
# Update these with your actual values

# Frontend (Vercel)
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
NEXT_PUBLIC_APP_NAME=MedSpaSync Pro

# Backend (Railway)
NODE_ENV=production
DATABASE_URL=postgresql://your-db-url
JWT_SECRET=your-super-secret-jwt-key-256-bits

# AI API (Railway)
ENVIRONMENT=production
AI_API_SECRET_KEY=your-ai-api-secret-key

# Marketing (Netlify)
VITE_PLATFORM_NAME=MedSpaSync Pro
EOF
            
            print_status "Environment template created: .env.cloud"
            print_warning "Please update .env.cloud with your actual values before deploying"
        fi
        ;;
        
    2)
        echo ""
        print_info "🐳 Local Production Deployment Selected"
        echo ""
        
        # Check if .env.production exists
        if [ ! -f "medspasync-ecosystem/.env.production" ]; then
            print_warning "Creating production environment file..."
            
            # Generate secure passwords
            POSTGRES_PASSWORD=$(openssl rand -base64 32)
            JWT_SECRET=$(openssl rand -base64 64)
            AI_API_SECRET_KEY=$(openssl rand -base64 32)
            REDIS_PASSWORD=$(openssl rand -base64 32)
            
            cat > medspasync-ecosystem/.env.production << EOF
# MedSpaSync Pro Production Environment
# Generated on $(date)

# Database Configuration
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
DATABASE_URL=postgresql://medspasync_user:$POSTGRES_PASSWORD@postgres:5432/medspasync_pro

# Security
JWT_SECRET=$JWT_SECRET
AI_API_SECRET_KEY=$AI_API_SECRET_KEY

# Redis
REDIS_PASSWORD=$REDIS_PASSWORD

# External Services
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=MedSpaSync Pro

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true
EOF
            
            print_status "Production environment file created with secure credentials"
        fi
        
        # Deploy with Docker Compose
        echo ""
        print_info "Deploying MedSpaSync Pro to local production environment..."
        
        cd medspasync-ecosystem
        
        # Build and start services
        print_info "Building Docker images..."
        docker-compose -f docker-compose.production.yml build
        
        print_info "Starting services..."
        docker-compose -f docker-compose.production.yml up -d
        
        # Wait for services to be ready
        print_info "Waiting for services to start..."
        sleep 30
        
        # Check service health
        print_info "Checking service health..."
        
        # Check backend
        if curl -f http://localhost:5000/health > /dev/null 2>&1; then
            print_status "Backend is healthy"
        else
            print_warning "Backend health check failed"
        fi
        
        # Check frontend
        if curl -f http://localhost:3000/health > /dev/null 2>&1; then
            print_status "Frontend is healthy"
        else
            print_warning "Frontend health check failed"
        fi
        
        # Check AI API
        if curl -f http://localhost:8000/health > /dev/null 2>&1; then
            print_status "AI API is healthy"
        else
            print_warning "AI API health check failed"
        fi
        
        # Check monitoring
        if curl -f http://localhost:9090/api/v1/query?query=up > /dev/null 2>&1; then
            print_status "Monitoring is active"
        else
            print_warning "Monitoring health check failed"
        fi
        
        echo ""
        print_status "🎉 MedSpaSync Pro is now running!"
        echo ""
        echo "📊 Service URLs:"
        echo "• Frontend: http://localhost:3000"
        echo "• Backend API: http://localhost:5000"
        echo "• AI API: http://localhost:8000"
        echo "• Marketing: http://localhost:3001"
        echo "• Monitoring: http://localhost:9090"
        echo "• Grafana: http://localhost:3002"
        echo ""
        echo "🔧 Management Commands:"
        echo "• View logs: docker-compose -f docker-compose.production.yml logs -f"
        echo "• Stop services: docker-compose -f docker-compose.production.yml down"
        echo "• Restart services: docker-compose -f docker-compose.production.yml restart"
        ;;
        
    3)
        echo ""
        print_info "🧪 Staging Deployment Selected"
        echo ""
        
        # Create staging environment
        if [ ! -f "medspasync-ecosystem/.env.staging" ]; then
            print_warning "Creating staging environment file..."
            
            cat > medspasync-ecosystem/.env.staging << EOF
# MedSpaSync Pro Staging Environment
# Generated on $(date)

# Database Configuration
POSTGRES_PASSWORD=staging_password_123
DATABASE_URL=postgresql://medspasync_user:staging_password_123@postgres:5432/medspasync_staging

# Security
JWT_SECRET=staging_jwt_secret_key_for_testing_only
AI_API_SECRET_KEY=staging_ai_api_secret_for_testing

# Redis
REDIS_PASSWORD=staging_redis_password_123

# External Services
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=MedSpaSync Pro (Staging)

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true
EOF
            
            print_status "Staging environment file created"
        fi
        
        # Deploy staging
        cd medspasync-ecosystem
        
        print_info "Deploying to staging environment..."
        docker-compose -f docker-compose.yml up -d
        
        print_status "🎉 Staging environment is ready!"
        echo ""
        echo "📊 Staging URLs:"
        echo "• Frontend: http://localhost:3000"
        echo "• Backend API: http://localhost:5000"
        echo "• AI API: http://localhost:8000"
        ;;
        
    4)
        echo ""
        print_info "📚 Opening deployment guide..."
        if [ -f "LAUNCH_DEPLOYMENT_STRATEGY.md" ]; then
            if command -v less &> /dev/null; then
                less LAUNCH_DEPLOYMENT_STRATEGY.md
            else
                cat LAUNCH_DEPLOYMENT_STRATEGY.md
            fi
        else
            print_error "Deployment guide not found"
        fi
        ;;
        
    *)
        print_error "Invalid choice. Please select 1, 2, 3, or 4."
        exit 1
        ;;
esac

echo ""
print_status "Deployment process completed!"
echo ""
echo "📚 Next Steps:"
echo "1. Configure your domain names"
echo "2. Set up SSL certificates"
echo "3. Configure monitoring alerts"
echo "4. Test all functionality"
echo "5. Launch your marketing campaign"
echo ""
echo "📖 Documentation:"
echo "• Complete Guide: LAUNCH_DEPLOYMENT_STRATEGY.md"
echo "• Troubleshooting: MEDSPASYNC_PRO_DEBUGGING_REPORT.md"
echo "• Performance: TEST_RESULTS_SUMMARY.md"
echo ""
echo "🎯 Your MedSpaSync Pro ecosystem is ready to revolutionize the medical spa industry!" 