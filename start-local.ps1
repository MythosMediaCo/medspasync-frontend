# MedSpaSync Pro - Local Development Startup Script
# This script starts all services locally without Docker

Write-Host "🚀 Starting MedSpaSync Pro Ecosystem (Local Development)" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js from https://nodejs.org" -ForegroundColor Red
    Write-Host "After installation, run this script again." -ForegroundColor Yellow
    exit 1
}

# Check if Python is installed
try {
    $pythonVersion = python --version
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python from https://python.org" -ForegroundColor Red
    Write-Host "After installation, run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n🎯 Starting Services..." -ForegroundColor Yellow

# Start Frontend (in background)
Write-Host "`n📱 Starting Frontend (Next.js)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd medspasync-frontend; npm install; npm run dev" -WindowStyle Normal

# Wait a moment for frontend to start
Start-Sleep -Seconds 3

# Start Backend (in background)
Write-Host "🔧 Starting Backend (Node.js)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd medspasync-backend; npm install; npm start" -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start AI API (in background)
Write-Host "🤖 Starting AI API (Python)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd medspasync-ai-api; pip install -r requirements.txt; python api_server.py" -WindowStyle Normal

Write-Host "`n⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "`n🎉 MedSpaSync Pro Ecosystem Started!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

Write-Host "`n📱 Frontend (Next.js):" -ForegroundColor Cyan
Write-Host "   URL: http://localhost:3000" -ForegroundColor White
Write-Host "   Status: Starting..." -ForegroundColor Yellow

Write-Host "`n🔧 Backend (Node.js):" -ForegroundColor Cyan
Write-Host "   URL: http://localhost:5000" -ForegroundColor White
Write-Host "   Status: Starting..." -ForegroundColor Yellow

Write-Host "`n🤖 AI API (Python):" -ForegroundColor Cyan
Write-Host "   URL: http://localhost:8000" -ForegroundColor White
Write-Host "   Status: Starting..." -ForegroundColor Yellow

Write-Host "`n📊 Monitoring:" -ForegroundColor Yellow
Write-Host "   • Check each terminal window for startup status" -ForegroundColor White
Write-Host "   • Frontend should be available in 1-2 minutes" -ForegroundColor White
Write-Host "   • Backend and AI API should be available in 30-60 seconds" -ForegroundColor White

Write-Host "`n🔗 Quick Access:" -ForegroundColor Yellow
Write-Host "   • Main App: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   • API Docs: http://localhost:5000/api/docs" -ForegroundColor Cyan
Write-Host "   • AI API: http://localhost:8000/health" -ForegroundColor Cyan

Write-Host "`n💡 Tips:" -ForegroundColor Yellow
Write-Host "   • Keep all terminal windows open" -ForegroundColor White
Write-Host "   • Check for any error messages in the terminals" -ForegroundColor White
Write-Host "   • If services fail to start, check the logs in each terminal" -ForegroundColor White

Write-Host "`n🚀 Your MedSpaSync Pro ecosystem is starting up!" -ForegroundColor Green
Write-Host "Visit http://localhost:3000 to access your application." -ForegroundColor Cyan

# Keep the script running
Write-Host "`nPress Ctrl+C to stop all services..." -ForegroundColor Yellow
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host "`n🛑 Stopping MedSpaSync Pro services..." -ForegroundColor Red
    Write-Host "Close the terminal windows to stop individual services." -ForegroundColor Yellow
} 