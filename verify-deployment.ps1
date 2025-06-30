# MedSpaSync Pro - Deployment Verification Script
# Run this after setting up all cloud platforms

Write-Host "🔍 MedSpaSync Pro - Deployment Verification" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

Write-Host "`n📋 Please provide your deployment URLs:" -ForegroundColor Yellow

$frontendUrl = Read-Host "Frontend URL (Vercel)"
$backendUrl = Read-Host "Backend URL (Railway)"
$aiApiUrl = Read-Host "AI API URL (Railway)"
$marketingUrl = Read-Host "Marketing URL (Netlify)"

Write-Host "`n🔍 Testing deployments..." -ForegroundColor Yellow

# Test Frontend
Write-Host "`n1️⃣ Testing Frontend..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$frontendUrl" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend is accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend returned status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Frontend is not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Backend
Write-Host "`n2️⃣ Testing Backend..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/health" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend health check passed" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend health check failed: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend is not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Test AI API
Write-Host "`n3️⃣ Testing AI API..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$aiApiUrl/health" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ AI API health check passed" -ForegroundColor Green
    } else {
        Write-Host "❌ AI API health check failed: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ AI API is not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Marketing Site
Write-Host "`n4️⃣ Testing Marketing Site..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$marketingUrl" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Marketing site is accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ Marketing site returned status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Marketing site is not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📊 Deployment Summary:" -ForegroundColor Yellow
Write-Host "Frontend: $frontendUrl" -ForegroundColor White
Write-Host "Backend: $backendUrl" -ForegroundColor White
Write-Host "AI API: $aiApiUrl" -ForegroundColor White
Write-Host "Marketing: $marketingUrl" -ForegroundColor White

Write-Host "`n🎉 Verification complete!" -ForegroundColor Green
Write-Host "If all tests passed, your MedSpaSync Pro ecosystem is ready!" -ForegroundColor White 