# MedSpaSync Pro - Launch Script
# Simple deployment script for Windows

Write-Host "🚀 MedSpaSync Pro - Launch Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check if Docker is available
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not found. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "Download: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check project structure
if (-not (Test-Path "medspasync-ecosystem/docker-compose.production.yml")) {
    Write-Host "❌ Please run this script from the MedSpaSync project root directory." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Project structure verified" -ForegroundColor Green

# Deployment options
Write-Host "`n🎯 Choose deployment option:" -ForegroundColor Yellow
Write-Host "1. Local Production (Docker Compose)" -ForegroundColor White
Write-Host "2. Cloud Deployment (Vercel + Railway)" -ForegroundColor White
Write-Host "3. Staging Environment" -ForegroundColor White

$choice = Read-Host "`nEnter choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host "`n🐳 Deploying to local production..." -ForegroundColor Green
        
        # Create production environment file
        if (-not (Test-Path "medspasync-ecosystem/.env.production")) {
            Write-Host "Creating production environment..." -ForegroundColor Yellow
            
            $envContent = @"
# MedSpaSync Pro Production Environment
POSTGRES_PASSWORD=medspasync_prod_2024
DATABASE_URL=postgresql://medspasync_user:medspasync_prod_2024@postgres:5432/medspasync_pro
JWT_SECRET=medspasync_jwt_secret_production_2024
AI_API_SECRET_KEY=medspasync_ai_secret_production_2024
REDIS_PASSWORD=medspasync_redis_prod_2024
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=MedSpaSync Pro
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true
"@
            
            $envContent | Out-File -FilePath "medspasync-ecosystem/.env.production" -Encoding UTF8
            Write-Host "✅ Production environment created" -ForegroundColor Green
        }
        
        # Deploy services
        Set-Location medspasync-ecosystem
        
        Write-Host "Building Docker images..." -ForegroundColor Yellow
        docker-compose -f docker-compose.production.yml build
        
        Write-Host "Starting services..." -ForegroundColor Yellow
        docker-compose -f docker-compose.production.yml up -d
        
        Write-Host "Waiting for services to start..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
        
        Write-Host "`n🎉 MedSpaSync Pro is now running!" -ForegroundColor Green
        Write-Host "`n📊 Service URLs:" -ForegroundColor Yellow
        Write-Host "• Frontend: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "• Backend API: http://localhost:5000" -ForegroundColor Cyan
        Write-Host "• AI API: http://localhost:8000" -ForegroundColor Cyan
        Write-Host "• Marketing: http://localhost:3001" -ForegroundColor Cyan
        Write-Host "• Monitoring: http://localhost:9090" -ForegroundColor Cyan
        Write-Host "• Grafana: http://localhost:3002" -ForegroundColor Cyan
        
        Set-Location ..
    }
    
    "2" {
        Write-Host "`n🌐 Cloud deployment selected" -ForegroundColor Green
        Write-Host "This will guide you through cloud deployment." -ForegroundColor White
        
        if (Test-Path "deploy.ps1") {
            Write-Host "Running cloud deployment script..." -ForegroundColor Yellow
            & .\deploy.ps1
        } else {
            Write-Host "Cloud deployment script not found." -ForegroundColor Red
            Write-Host "Please use the existing deploy.ps1 script." -ForegroundColor Yellow
        }
    }
    
    "3" {
        Write-Host "`n🧪 Deploying staging environment..." -ForegroundColor Green
        
        Set-Location medspasync-ecosystem
        
        Write-Host "Starting staging services..." -ForegroundColor Yellow
        docker-compose up -d
        
        Write-Host "`n🎉 Staging environment ready!" -ForegroundColor Green
        Write-Host "• Frontend: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "• Backend: http://localhost:5000" -ForegroundColor Cyan
        Write-Host "• AI API: http://localhost:8000" -ForegroundColor Cyan
        
        Set-Location ..
    }
    
    default {
        Write-Host "❌ Invalid choice. Please select 1, 2, or 3." -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n✅ Deployment completed!" -ForegroundColor Green
Write-Host "📚 Check LAUNCH_EXECUTION_SUMMARY.md for next steps." -ForegroundColor Yellow 