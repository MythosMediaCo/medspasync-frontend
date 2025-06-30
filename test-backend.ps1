# Test Backend Deployment
# Run this after deploying backend to Railway

Write-Host "🔧 Testing Backend Deployment" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

$backendUrl = Read-Host "Enter your Railway backend URL (e.g., https://medspasync-backend-production.up.railway.app)"

Write-Host "`n🔍 Testing backend endpoints..." -ForegroundColor Yellow

# Test Health Endpoint
Write-Host "`n1️⃣ Testing Health Endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/health" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend health check passed" -ForegroundColor Green
        Write-Host "Response: $($response.Content)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Backend health check failed: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test API Endpoint
Write-Host "`n2️⃣ Testing API Endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/api/health" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend API endpoint working" -ForegroundColor Green
        Write-Host "Response: $($response.Content)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Backend API endpoint failed: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend API endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Root Endpoint
Write-Host "`n3️⃣ Testing Root Endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend root endpoint working" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend root endpoint failed: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend root endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📊 Backend Test Summary:" -ForegroundColor Yellow
Write-Host "Backend URL: $backendUrl" -ForegroundColor White

Write-Host "`n🔧 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update Netlify environment variables" -ForegroundColor White
Write-Host "2. Test full frontend-backend integration" -ForegroundColor White
Write-Host "3. Verify AI reconciliation features" -ForegroundColor White

Write-Host "`n🎉 Backend test complete!" -ForegroundColor Green 