# Test Netlify Frontend + Railway Backend Integration
# Run this after setting up Railway deployments

Write-Host "🔗 Testing Netlify + Railway Integration" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

Write-Host "`n📋 Please provide your URLs:" -ForegroundColor Yellow

$netlifyUrl = Read-Host "Netlify Frontend URL"
$railwayBackendUrl = Read-Host "Railway Backend URL"
$railwayAiApiUrl = Read-Host "Railway AI API URL"

Write-Host "`n🔍 Testing integration..." -ForegroundColor Yellow

# Test Netlify Frontend
Write-Host "`n1️⃣ Testing Netlify Frontend..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$netlifyUrl" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Netlify frontend is accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ Netlify frontend returned status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Netlify frontend is not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Railway Backend
Write-Host "`n2️⃣ Testing Railway Backend..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$railwayBackendUrl/health" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Railway backend health check passed" -ForegroundColor Green
    } else {
        Write-Host "❌ Railway backend health check failed: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Railway backend is not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Railway AI API
Write-Host "`n3️⃣ Testing Railway AI API..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$railwayAiApiUrl/health" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Railway AI API health check passed" -ForegroundColor Green
    } else {
        Write-Host "❌ Railway AI API health check failed: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Railway AI API is not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Test API Integration (if backend is working)
Write-Host "`n4️⃣ Testing API Integration..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$railwayBackendUrl/api/health" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend API endpoint is working" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend API endpoint failed: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend API endpoint is not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📊 Integration Summary:" -ForegroundColor Yellow
Write-Host "Netlify Frontend: $netlifyUrl" -ForegroundColor White
Write-Host "Railway Backend: $railwayBackendUrl" -ForegroundColor White
Write-Host "Railway AI API: $railwayAiApiUrl" -ForegroundColor White

Write-Host "`n🔧 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update Netlify environment variables with Railway URLs" -ForegroundColor White
Write-Host "2. Test the frontend-backend connection" -ForegroundColor White
Write-Host "3. Verify AI reconciliation features work" -ForegroundColor White

Write-Host "`n🎉 Integration test complete!" -ForegroundColor Green 