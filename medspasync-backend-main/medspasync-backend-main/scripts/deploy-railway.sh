#!/bin/bash

# MedSpaSync Pro Railway Deployment Script
# This script handles production deployment to Railway

set -e

echo "🚀 Starting MedSpaSync Pro Railway Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI is not installed. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Check if we're logged in to Railway
if ! railway whoami &> /dev/null; then
    print_error "Not logged in to Railway. Please run: railway login"
    exit 1
fi

print_status "Deploying to Railway..."

# Deploy the application
print_status "Building and deploying application..."
railway up

# Wait for deployment to complete
print_status "Waiting for deployment to complete..."
sleep 30

# Run database migrations
print_status "Running database migrations..."
railway run npx prisma migrate deploy

# Generate Prisma client
print_status "Generating Prisma client..."
railway run npx prisma generate

# Seed database with demo data
print_status "Seeding database with demo data..."
railway run npm run demo:all

# Health check
print_status "Performing health check..."
HEALTH_URL=$(railway status --json | jq -r '.services[0].url')/health

if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
    print_status "✅ Health check passed!"
    print_status "🚀 Deployment successful!"
    print_status "Application URL: $HEALTH_URL"
else
    print_error "❌ Health check failed!"
    print_error "Please check the logs: railway logs"
    exit 1
fi

# Set up monitoring
print_status "Setting up monitoring..."
railway variables set NODE_ENV=production
railway variables set ENABLE_MONITORING=true

print_status "🎉 MedSpaSync Pro successfully deployed to Railway!"
print_status "📊 Monitor your deployment at: https://railway.app/dashboard" 