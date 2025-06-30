# MedSpaSync Pro - Simple Startup Script
# Starts frontend and backend without AI API (to avoid disk space issues)

Write-Host "🚀 Starting MedSpaSync Pro (Simplified Mode)" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js from https://nodejs.org" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎯 Starting Core Services..." -ForegroundColor Yellow

# Start Frontend
Write-Host "`n📱 Starting Frontend (Next.js)..." -ForegroundColor Cyan
Write-Host "   Directory: medspasync-frontend" -ForegroundColor White
Write-Host "   URL: http://localhost:3000" -ForegroundColor White

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd medspasync-frontend; Write-Host 'Installing dependencies...'; npm install; Write-Host 'Starting frontend...'; npm run dev" -WindowStyle Normal

# Wait for frontend to start
Start-Sleep -Seconds 5

# Start Backend
Write-Host "`n🔧 Starting Backend (Node.js)..." -ForegroundColor Cyan
Write-Host "   Directory: medspasync-backend" -ForegroundColor White
Write-Host "   URL: http://localhost:5000" -ForegroundColor White

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd medspasync-backend; Write-Host 'Installing dependencies...'; npm install; Write-Host 'Starting backend...'; npm start" -WindowStyle Normal

Write-Host "`n⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "`n🎉 MedSpaSync Pro Core Services Started!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

Write-Host "`n📱 Frontend (Next.js):" -ForegroundColor Cyan
Write-Host "   URL: http://localhost:3000" -ForegroundColor White
Write-Host "   Status: Starting..." -ForegroundColor Yellow

Write-Host "`n🔧 Backend (Node.js):" -ForegroundColor Cyan
Write-Host "   URL: http://localhost:5000" -ForegroundColor White
Write-Host "   Status: Starting..." -ForegroundColor Yellow

Write-Host "`n⚠️  AI API Status:" -ForegroundColor Yellow
Write-Host "   Status: Skipped (disk space issue)" -ForegroundColor Red
Write-Host "   Note: Core functionality will work without AI features" -ForegroundColor White

Write-Host "`n📊 What's Available:" -ForegroundColor Yellow
Write-Host "   ✅ User authentication and management" -ForegroundColor Green
Write-Host "   ✅ Client management and appointments" -ForegroundColor Green
Write-Host "   ✅ Basic reporting and analytics" -ForegroundColor Green
Write-Host "   ✅ Dashboard and UI components" -ForegroundColor Green
Write-Host "   ❌ AI-powered reconciliation (requires disk space)" -ForegroundColor Red

Write-Host "`n🔗 Quick Access:" -ForegroundColor Yellow
Write-Host "   • Main App: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   • API Docs: http://localhost:5000/api/docs" -ForegroundColor Cyan

Write-Host "`n💡 Tips:" -ForegroundColor Yellow
Write-Host "   • Keep terminal windows open" -ForegroundColor White
Write-Host "   • Frontend should be available in 1-2 minutes" -ForegroundColor White
Write-Host "   • Backend should be available in 30-60 seconds" -ForegroundColor White
Write-Host "   • To enable AI features, free up disk space and run AI API separately" -ForegroundColor White

Write-Host "`n🚀 Your MedSpaSync Pro core application is starting!" -ForegroundColor Green
Write-Host "Visit http://localhost:3000 to access your application." -ForegroundColor Cyan

Write-Host "`n📚 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Test the application at http://localhost:3000" -ForegroundColor White
Write-Host "   2. Free up disk space to enable AI features" -ForegroundColor White
Write-Host "   3. Deploy to cloud for production use" -ForegroundColor White

# Keep the script running
Write-Host "`nPress Ctrl+C to stop services..." -ForegroundColor Yellow
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host "`n🛑 Stopping MedSpaSync Pro services..." -ForegroundColor Red
    Write-Host "Close the terminal windows to stop individual services." -ForegroundColor Yellow
} 