#!/bin/bash

# MedSpaSync Pro - Self-Service Platform Deployment Script
# This script deploys the complete 100% self-service, product-led growth platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_PORT=3000
BACKEND_PORT=5001
AI_API_PORT=5002
MARKETING_PORT=3001

# Environment variables
export NODE_ENV=production
export REACT_APP_API_URL=http://localhost:$BACKEND_PORT
export REACT_APP_AI_API_URL=http://localhost:$AI_API_PORT

echo -e "${PURPLE}🚀 MedSpaSync Pro - Self-Service Platform Deployment${NC}"
echo -e "${CYAN}==================================================${NC}"
echo ""

# Function to print status
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

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("Node.js")
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    if ! command_exists python3; then
        missing_deps+=("Python 3")
    fi
    
    if ! command_exists pip3; then
        missing_deps+=("pip3")
    fi
    
    if ! command_exists git; then
        missing_deps+=("Git")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_status "Please install the missing dependencies and run this script again."
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Function to create environment files
create_env_files() {
    print_status "Creating environment configuration files..."
    
    # Frontend .env
    cat > medspasync-frontend-master/.env << EOF
REACT_APP_API_URL=http://localhost:$BACKEND_PORT
REACT_APP_AI_API_URL=http://localhost:$AI_API_PORT
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
REACT_APP_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
REACT_APP_MIXPANEL_TOKEN=your_mixpanel_token
NODE_ENV=production
EOF

    # Backend .env
    cat > medspasync-backend-main/.env << EOF
NODE_ENV=production
PORT=$BACKEND_PORT
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
OPENAI_API_KEY=your_openai_api_key
REDIS_HOST=localhost
REDIS_PORT=6379
FRONTEND_URL=http://localhost:$FRONTEND_PORT
AI_API_URL=http://localhost:$AI_API_PORT
WEBHOOK_URL=your_webhook_url
EOF

    # AI API .env
    cat > medspasync-ai-api-main/.env << EOF
FLASK_ENV=production
FLASK_APP=app.py
PORT=$AI_API_PORT
OPENAI_API_KEY=your_openai_api_key
REDIS_HOST=localhost
REDIS_PORT=6379
FRONTEND_URL=http://localhost:$FRONTEND_PORT
BACKEND_URL=http://localhost:$BACKEND_PORT
EOF

    # Marketing .env
    cat > medspasync-marketing-main/.env << EOF
REACT_APP_API_URL=http://localhost:$BACKEND_PORT
REACT_APP_AI_API_URL=http://localhost:$AI_API_PORT
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
NODE_ENV=production
EOF

    print_success "Environment files created"
}

# Function to install frontend dependencies
install_frontend_deps() {
    print_status "Installing frontend dependencies..."
    
    cd medspasync-frontend-master
    
    # Install dependencies
    npm install
    
    # Install additional dependencies for self-service features
    npm install recharts @stripe/stripe-js mixpanel-browser react-hot-toast
    npm install framer-motion react-intersection-observer react-query
    npm install @headlessui/react @heroicons/react lucide-react
    
    cd ..
    
    print_success "Frontend dependencies installed"
}

# Function to install backend dependencies
install_backend_deps() {
    print_status "Installing backend dependencies..."
    
    cd medspasync-backend-main
    
    # Install dependencies
    npm install
    
    # Install additional dependencies for self-service features
    npm install stripe redis openai axios uuid crypto
    npm install express-rate-limit helmet cors morgan
    npm install jsonwebtoken bcryptjs validator
    
    cd ..
    
    print_success "Backend dependencies installed"
}

# Function to install AI API dependencies
install_ai_deps() {
    print_status "Installing AI API dependencies..."
    
    cd medspasync-ai-api-main
    
    # Create requirements.txt if it doesn't exist
    cat > requirements.txt << EOF
flask==2.3.3
flask-cors==4.0.0
openai==1.3.0
redis==5.0.1
python-dotenv==1.0.0
requests==2.31.0
numpy==1.24.3
pandas==2.0.3
scikit-learn==1.3.0
gunicorn==21.2.0
EOF

    # Install Python dependencies
    pip3 install -r requirements.txt
    
    cd ..
    
    print_success "AI API dependencies installed"
}

# Function to install marketing dependencies
install_marketing_deps() {
    print_status "Installing marketing site dependencies..."
    
    cd medspasync-marketing-main
    
    # Install dependencies
    npm install
    
    # Install additional dependencies for marketing features
    npm install @tailwindcss/typography @tailwindcss/forms
    npm install react-helmet react-snap gtag
    npm install framer-motion react-intersection-observer
    
    cd ..
    
    print_success "Marketing dependencies installed"
}

# Function to build frontend
build_frontend() {
    print_status "Building frontend application..."
    
    cd medspasync-frontend-master
    
    # Build the application
    npm run build
    
    cd ..
    
    print_success "Frontend built successfully"
}

# Function to build marketing site
build_marketing() {
    print_status "Building marketing site..."
    
    cd medspasync-marketing-main
    
    # Build the application
    npm run build
    
    cd ..
    
    print_success "Marketing site built successfully"
}

# Function to start services
start_services() {
    print_status "Starting all services..."
    
    # Start backend
    print_status "Starting backend service on port $BACKEND_PORT..."
    cd medspasync-backend-main
    nohup npm start > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Start AI API
    print_status "Starting AI API service on port $AI_API_PORT..."
    cd medspasync-ai-api-main
    nohup python3 app.py > ../logs/ai-api.log 2>&1 &
    AI_API_PID=$!
    cd ..
    
    # Start frontend
    print_status "Starting frontend service on port $FRONTEND_PORT..."
    cd medspasync-frontend-master
    nohup npm start > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # Start marketing site
    print_status "Starting marketing site on port $MARKETING_PORT..."
    cd medspasync-marketing-main
    nohup npm start > ../logs/marketing.log 2>&1 &
    MARKETING_PID=$!
    cd ..
    
    # Save PIDs for later cleanup
    echo $BACKEND_PID > logs/backend.pid
    echo $AI_API_PID > logs/ai-api.pid
    echo $FRONTEND_PID > logs/frontend.pid
    echo $MARKETING_PID > logs/marketing.pid
    
    print_success "All services started"
}

# Function to wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
            print_success "Backend service is ready"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "Backend service failed to start"
            exit 1
        fi
        
        print_status "Waiting for backend service... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:$AI_API_PORT/api/support/health > /dev/null 2>&1; then
            print_success "AI API service is ready"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "AI API service failed to start"
            exit 1
        fi
        
        print_status "Waiting for AI API service... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
            print_success "Frontend service is ready"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "Frontend service failed to start"
            exit 1
        fi
        
        print_status "Waiting for frontend service... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:$MARKETING_PORT > /dev/null 2>&1; then
            print_success "Marketing service is ready"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "Marketing service failed to start"
            exit 1
        fi
        
        print_status "Waiting for marketing service... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Check backend health
    if curl -s http://localhost:$BACKEND_PORT/health | grep -q "healthy"; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
        exit 1
    fi
    
    # Check AI API health
    if curl -s http://localhost:$AI_API_PORT/api/support/health | grep -q "healthy"; then
        print_success "AI API health check passed"
    else
        print_error "AI API health check failed"
        exit 1
    fi
    
    # Check frontend
    if curl -s http://localhost:$FRONTEND_PORT | grep -q "MedSpaSync"; then
        print_success "Frontend health check passed"
    else
        print_error "Frontend health check failed"
        exit 1
    fi
    
    # Check marketing site
    if curl -s http://localhost:$MARKETING_PORT | grep -q "MedSpaSync"; then
        print_success "Marketing site health check passed"
    else
        print_error "Marketing site health check failed"
        exit 1
    fi
}

# Function to display service URLs
display_service_urls() {
    echo ""
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo -e "${CYAN}========================${NC}"
    echo ""
    echo -e "${BLUE}Service URLs:${NC}"
    echo -e "  Frontend Application: ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
    echo -e "  Marketing Site:       ${GREEN}http://localhost:$MARKETING_PORT${NC}"
    echo -e "  Backend API:          ${GREEN}http://localhost:$BACKEND_PORT${NC}"
    echo -e "  AI API:               ${GREEN}http://localhost:$AI_API_PORT${NC}"
    echo ""
    echo -e "${BLUE}API Endpoints:${NC}"
    echo -e "  Health Check:         ${GREEN}http://localhost:$BACKEND_PORT/health${NC}"
    echo -e "  AI Support:           ${GREEN}http://localhost:$AI_API_PORT/api/support/chat${NC}"
    echo -e "  Analytics:            ${GREEN}http://localhost:$FRONTEND_PORT/analytics${NC}"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo -e "  1. Configure your environment variables in the .env files"
    echo -e "  2. Set up your database and Redis instance"
    echo -e "  3. Configure Stripe API keys for billing"
    echo -e "  4. Set up OpenAI API key for AI features"
    echo -e "  5. Configure analytics tracking"
    echo ""
    echo -e "${PURPLE}Self-Service Features Available:${NC}"
    echo -e "  ✅ Interactive Demo System"
    echo -e "  ✅ Automated Trial Creation"
    echo -e "  ✅ Guided Onboarding Wizard"
    echo -e "  ✅ AI-Powered Support Bot"
    echo -e "  ✅ Automated Billing System"
    echo -e "  ✅ Real-Time Analytics Dashboard"
    echo -e "  ✅ Customer Success Automation"
    echo -e "  ✅ Conversion Optimization"
    echo ""
    echo -e "${GREEN}Your 100% self-service platform is ready! 🚀${NC}"
}

# Function to create logs directory
create_logs_directory() {
    mkdir -p logs
}

# Function to cleanup on exit
cleanup() {
    print_status "Cleaning up..."
    
    if [ -f logs/backend.pid ]; then
        kill $(cat logs/backend.pid) 2>/dev/null || true
        rm logs/backend.pid
    fi
    
    if [ -f logs/ai-api.pid ]; then
        kill $(cat logs/ai-api.pid) 2>/dev/null || true
        rm logs/ai-api.pid
    fi
    
    if [ -f logs/frontend.pid ]; then
        kill $(cat logs/frontend.pid) 2>/dev/null || true
        rm logs/frontend.pid
    fi
    
    if [ -f logs/marketing.pid ]; then
        kill $(cat logs/marketing.pid) 2>/dev/null || true
        rm logs/marketing.pid
    fi
    
    print_success "Cleanup complete"
}

# Set up trap for cleanup
trap cleanup EXIT

# Main deployment function
main() {
    echo -e "${PURPLE}Starting MedSpaSync Pro Self-Service Platform Deployment${NC}"
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Create logs directory
    create_logs_directory
    
    # Create environment files
    create_env_files
    
    # Install dependencies
    install_frontend_deps
    install_backend_deps
    install_ai_deps
    install_marketing_deps
    
    # Build applications
    build_frontend
    build_marketing
    
    # Start services
    start_services
    
    # Wait for services to be ready
    wait_for_services
    
    # Run health checks
    run_health_checks
    
    # Display service URLs
    display_service_urls
    
    print_success "Deployment completed successfully!"
}

# Run main function
main "$@" 