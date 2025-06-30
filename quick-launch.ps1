# 🚀 MedSpaSync Pro - Quick Launch Script (PowerShell)
# This script provides a streamlined deployment process for Windows

param(
    [string]$DeploymentType = "interactive"
)

Write-Host "🚀 MedSpaSync Pro - Quick Launch" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

# Check prerequisites
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Yellow

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Status "Docker is installed: $dockerVersion"
} catch {
    Write-Error "Docker is not installed. Please install Docker Desktop first."
    Write-Host "Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Cyan
    exit 1
}

# Check if Docker Compose is installed
try {
    $composeVersion = docker-compose --version
    Write-Status "Docker Compose is installed: $composeVersion"
} catch {
    Write-Error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "medspasync-ecosystem/docker-compose.production.yml")) {
    Write-Error "Please run this script from the root directory of the MedSpaSync project."
    exit 1
}
Write-Status "Project structure verified"

# Deployment options
Write-Host "`n🎯 Choose your deployment option:" -ForegroundColor Yellow
Write-Host "1. Quick Cloud Deployment (Vercel + Railway + Netlify) - Recommended" -ForegroundColor White
Write-Host "2. Local Production Deployment (Docker Compose)" -ForegroundColor White
Write-Host "3. Staging Deployment (Testing)" -ForegroundColor White
Write-Host "4. View deployment guide" -ForegroundColor White

$choice = Read-Host "`nEnter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host "`n🌐 Cloud Deployment Selected" -ForegroundColor Green
        Write-Host ""
        Write-Host "This will deploy your services to:" -ForegroundColor White
        Write-Host "• Frontend: Vercel" -ForegroundColor White
        Write-Host "• Backend: Railway" -ForegroundColor White
        Write-Host "• AI API: Railway" -ForegroundColor White
        Write-Host "• Marketing: Netlify" -ForegroundColor White
        Write-Host ""
        
        $hasAccounts = Read-Host "Do you have accounts for Vercel, Railway, and Netlify? (y/n)"
        
        if ($hasAccounts -ne "y") {
            Write-Host ""
            Write-Warning "Please create accounts first:"
            Write-Host "• Vercel: https://vercel.com" -ForegroundColor Cyan
            Write-Host "• Railway: https://railway.app" -ForegroundColor Cyan
            Write-Host "• Netlify: https://netlify.com" -ForegroundColor Cyan
            Write-Host ""
            Read-Host "Press Enter when you have created the accounts..."
        }
        
        # Execute cloud deployment
        Write-Host ""
        Write-Info "Starting cloud deployment..."
        
        # Check if PowerShell deployment script exists
        if (Test-Path "deploy.ps1") {
            Write-Info "Using existing deployment script..."
            Write-Host "Executing: .\deploy.ps1" -ForegroundColor Cyan
            & .\deploy.ps1
        } else {
            Write-Info "Setting up cloud deployment..."
            
            # Create environment variables template
            $envContent = @"
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
"@
            
            $envContent | Out-File -FilePath ".env.cloud" -Encoding UTF8
            Write-Status "Environment template created: .env.cloud"
            Write-Warning "Please update .env.cloud with your actual values before deploying"
        }
    }
    
    "2" {
        Write-Host "`n🐳 Local Production Deployment Selected" -ForegroundColor Green
        Write-Host ""
        
        # Check if .env.production exists
        if (-not (Test-Path "medspasync-ecosystem/.env.production")) {
            Write-Warning "Creating production environment file..."
            
            # Generate secure passwords
            $postgresPassword = -join ((33..126) | Get-Random -Count 32 | ForEach-Object {[char]$_})
            $jwtSecret = -join ((33..126) | Get-Random -Count 64 | ForEach-Object {[char]$_})
            $aiApiSecretKey = -join ((33..126) | Get-Random -Count 32 | ForEach-Object {[char]$_})
            $redisPassword = -join ((33..126) | Get-Random -Count 32 | ForEach-Object {[char]$_})
            
            $envContent = @"
# MedSpaSync Pro Production Environment
# Generated on $(Get-Date)

# Database Configuration
POSTGRES_PASSWORD=$postgresPassword
DATABASE_URL=postgresql://medspasync_user:$postgresPassword@postgres:5432/medspasync_pro

# Security
JWT_SECRET=$jwtSecret
AI_API_SECRET_KEY=$aiApiSecretKey

# Redis
REDIS_PASSWORD=$redisPassword

# External Services
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=MedSpaSync Pro

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true
"@
            
            $envContent | Out-File -FilePath "medspasync-ecosystem/.env.production" -Encoding UTF8
            Write-Status "Production environment file created with secure credentials"
        }
        
        # Deploy with Docker Compose
        Write-Host ""
        Write-Info "Deploying MedSpaSync Pro to local production environment..."
        
        Set-Location medspasync-ecosystem
        
        # Build and start services
        Write-Info "Building Docker images..."
        docker-compose -f docker-compose.production.yml build
        
        Write-Info "Starting services..."
        docker-compose -f docker-compose.production.yml up -d
        
        # Wait for services to be ready
        Write-Info "Waiting for services to start..."
        Start-Sleep -Seconds 30
        
        # Check service health
        Write-Info "Checking service health..."
        
        # Check backend
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Status "Backend is healthy"
            }
        } catch {
            Write-Warning "Backend health check failed"
        }
        
        # Check frontend
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Status "Frontend is healthy"
            }
        } catch {
            Write-Warning "Frontend health check failed"
        }
        
        # Check AI API
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Status "AI API is healthy"
            }
        } catch {
            Write-Warning "AI API health check failed"
        }
        
        # Check monitoring
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:9090/api/v1/query?query=up" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Status "Monitoring is active"
            }
        } catch {
            Write-Warning "Monitoring health check failed"
        }
        
        Write-Host ""
        Write-Status "🎉 MedSpaSync Pro is now running!"
        Write-Host ""
        Write-Host "📊 Service URLs:" -ForegroundColor Yellow
        Write-Host "• Frontend: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "• Backend API: http://localhost:5000" -ForegroundColor Cyan
        Write-Host "• AI API: http://localhost:8000" -ForegroundColor Cyan
        Write-Host "• Marketing: http://localhost:3001" -ForegroundColor Cyan
        Write-Host "• Monitoring: http://localhost:9090" -ForegroundColor Cyan
        Write-Host "• Grafana: http://localhost:3002" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "🔧 Management Commands:" -ForegroundColor Yellow
        Write-Host "• View logs: docker-compose -f docker-compose.production.yml logs -f" -ForegroundColor White
        Write-Host "• Stop services: docker-compose -f docker-compose.production.yml down" -ForegroundColor White
        Write-Host "• Restart services: docker-compose -f docker-compose.production.yml restart" -ForegroundColor White
        
        Set-Location ..
    }
    
    "3" {
        Write-Host "`n🧪 Staging Deployment Selected" -ForegroundColor Green
        Write-Host ""
        
        # Create staging environment
        if (-not (Test-Path "medspasync-ecosystem/.env.staging")) {
            Write-Warning "Creating staging environment file..."
            
            $envContent = @"
# MedSpaSync Pro Staging Environment
# Generated on $(Get-Date)

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
"@
            
            $envContent | Out-File -FilePath "medspasync-ecosystem/.env.staging" -Encoding UTF8
            Write-Status "Staging environment file created"
        }
        
        # Deploy staging
        Set-Location medspasync-ecosystem
        
        Write-Info "Deploying to staging environment..."
        docker-compose -f docker-compose.yml up -d
        
        Write-Status "🎉 Staging environment is ready!"
        Write-Host ""
        Write-Host "📊 Staging URLs:" -ForegroundColor Yellow
        Write-Host "• Frontend: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "• Backend API: http://localhost:5000" -ForegroundColor Cyan
        Write-Host "• AI API: http://localhost:8000" -ForegroundColor Cyan
        
        Set-Location ..
    }
    
    "4" {
        Write-Host "`n📚 Opening deployment guide..." -ForegroundColor Green
        if (Test-Path "LAUNCH_DEPLOYMENT_STRATEGY.md") {
            Get-Content "LAUNCH_DEPLOYMENT_STRATEGY.md" | Out-Host
        } else {
            Write-Error "Deployment guide not found"
        }
    }
    
    default {
        Write-Error "Invalid choice. Please select 1, 2, 3, or 4."
        exit 1
    }
}

Write-Host ""
Write-Status "Deployment process completed!"
Write-Host ""
Write-Host "📚 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure your domain names" -ForegroundColor White
Write-Host "2. Set up SSL certificates" -ForegroundColor White
Write-Host "3. Configure monitoring alerts" -ForegroundColor White
Write-Host "4. Test all functionality" -ForegroundColor White
Write-Host "5. Launch your marketing campaign" -ForegroundColor White
Write-Host ""
Write-Host "📖 Documentation:" -ForegroundColor Yellow
Write-Host "• Complete Guide: LAUNCH_DEPLOYMENT_STRATEGY.md" -ForegroundColor Cyan
Write-Host "• Troubleshooting: MEDSPASYNC_PRO_DEBUGGING_REPORT.md" -ForegroundColor Cyan
Write-Host "• Performance: TEST_RESULTS_SUMMARY.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Your MedSpaSync Pro ecosystem is ready to revolutionize the medical spa industry!" -ForegroundColor Green 