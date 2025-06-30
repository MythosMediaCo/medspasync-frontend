Write-Host "🚀 MedSpaSync Pro - Launch" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Check Docker
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not found. Install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check project structure
if (-not (Test-Path "medspasync-ecosystem/docker-compose.production.yml")) {
    Write-Host "❌ Run this from the MedSpaSync project root." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Project structure verified" -ForegroundColor Green

# Create production environment
if (-not (Test-Path "medspasync-ecosystem/.env.production")) {
    Write-Host "Creating production environment..." -ForegroundColor Yellow
    
    $envContent = @"
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
Write-Host "`n🐳 Deploying MedSpaSync Pro..." -ForegroundColor Yellow

Set-Location medspasync-ecosystem

Write-Host "Building Docker images..." -ForegroundColor Yellow
docker-compose -f docker-compose.production.yml build

Write-Host "Starting services..." -ForegroundColor Yellow
docker-compose -f docker-compose.production.yml up -d

Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Set-Location ..

Write-Host "`n🎉 MedSpaSync Pro is now running!" -ForegroundColor Green
Write-Host "`n📊 Service URLs:" -ForegroundColor Yellow
Write-Host "• Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "• Backend API: http://localhost:5000" -ForegroundColor Cyan
Write-Host "• AI API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "• Marketing: http://localhost:3001" -ForegroundColor Cyan
Write-Host "• Monitoring: http://localhost:9090" -ForegroundColor Cyan
Write-Host "• Grafana: http://localhost:3002" -ForegroundColor Cyan

Write-Host "`n✅ Launch completed!" -ForegroundColor Green
Write-Host "📚 Check LAUNCH_EXECUTION_SUMMARY.md for next steps." -ForegroundColor Yellow 