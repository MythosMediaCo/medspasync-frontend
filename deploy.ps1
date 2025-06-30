# MedSpaSync Pro - PowerShell Deployment Script
# This script helps deploy the MedSpaSync ecosystem to cloud platforms

param(
    [string]$Platform = "cloud",
    [string]$Environment = "production"
)

Write-Host "🚀 MedSpaSync Pro Deployment Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check prerequisites
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Please install npm first." -ForegroundColor Red
    exit 1
}

# Check git
try {
    $gitVersion = git --version
    Write-Host "✅ Git: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git not found. Please install Git first." -ForegroundColor Red
    exit 1
}

Write-Host "`n🎯 Deployment Options:" -ForegroundColor Yellow
Write-Host "1. Cloud Deployment (Vercel + Railway + Netlify) - Recommended" -ForegroundColor White
Write-Host "2. GitHub Actions Deployment" -ForegroundColor White
Write-Host "3. Manual Deployment" -ForegroundColor White

$choice = Read-Host "`nSelect deployment option (1-3)"

if ($choice -eq "1") {
    Write-Host "`n🌐 Cloud Deployment Selected" -ForegroundColor Green
    DeployToCloud
} elseif ($choice -eq "2") {
    Write-Host "`n🔄 GitHub Actions Deployment Selected" -ForegroundColor Green
    DeployWithGitHubActions
} elseif ($choice -eq "3") {
    Write-Host "`n🔧 Manual Deployment Selected" -ForegroundColor Green
    ManualDeployment
} else {
    Write-Host "❌ Invalid choice. Please select 1, 2, or 3." -ForegroundColor Red
    exit 1
}

function DeployToCloud {
    Write-Host "`n📦 Preparing for cloud deployment..." -ForegroundColor Yellow
    
    # Check if we're in a git repository
    if (-not (Test-Path ".git")) {
        Write-Host "❌ Not in a git repository. Please initialize git first." -ForegroundColor Red
        Write-Host "Run: git init" -ForegroundColor Yellow
        Write-Host "Run: git add ." -ForegroundColor Yellow
        Write-Host "Run: git commit -m 'Initial commit'" -ForegroundColor Yellow
        exit 1
    }
    
    # Check if we have a remote repository
    $remote = git remote get-url origin 2>$null
    if (-not $remote) {
        Write-Host "⚠️  No remote repository found." -ForegroundColor Yellow
        Write-Host "Please create a GitHub repository and add it as origin:" -ForegroundColor White
        Write-Host "git remote add origin https://github.com/yourusername/your-repo.git" -ForegroundColor Cyan
        exit 1
    }
    
    Write-Host "✅ Git repository: $remote" -ForegroundColor Green
    
    # Push to GitHub
    Write-Host "`n📤 Pushing to GitHub..." -ForegroundColor Yellow
    try {
        git add .
        git commit -m "Deploy MedSpaSync Pro v1.0 - $Environment"
        git push origin main
        Write-Host "✅ Code pushed to GitHub successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to push to GitHub. Please check your git configuration." -ForegroundColor Red
        exit 1
    }
    
    # Provide deployment instructions
    Write-Host "`n🎉 Code pushed successfully! Now follow these steps:" -ForegroundColor Green
    Write-Host "`n📋 Deployment Instructions:" -ForegroundColor Yellow
    
    Write-Host "`n1️⃣ Deploy Frontend to Vercel:" -ForegroundColor Cyan
    Write-Host "   • Go to https://vercel.com" -ForegroundColor White
    Write-Host "   • Sign up/Login with GitHub" -ForegroundColor White
    Write-Host "   • Click 'New Project'" -ForegroundColor White
    Write-Host "   • Select your repository" -ForegroundColor White
    Write-Host "   • Choose 'medspasync-frontend' directory" -ForegroundColor White
    Write-Host "   • Configure environment variables:" -ForegroundColor White
    Write-Host "     NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app" -ForegroundColor Gray
    Write-Host "     NEXT_PUBLIC_APP_NAME=MedSpaSync Pro" -ForegroundColor Gray
    Write-Host "   • Click 'Deploy'" -ForegroundColor White
    
    Write-Host "`n2️⃣ Deploy Backend to Railway:" -ForegroundColor Cyan
    Write-Host "   • Go to https://railway.app" -ForegroundColor White
    Write-Host "   • Sign up/Login with GitHub" -ForegroundColor White
    Write-Host "   • Click 'New Project'" -ForegroundColor White
    Write-Host "   • Select 'Deploy from GitHub repo'" -ForegroundColor White
    Write-Host "   • Choose your repository" -ForegroundColor White
    Write-Host "   • Select 'medspasync-backend' directory" -ForegroundColor White
    Write-Host "   • Add PostgreSQL database" -ForegroundColor White
    Write-Host "   • Configure environment variables:" -ForegroundColor White
    Write-Host "     NODE_ENV=production" -ForegroundColor Gray
    Write-Host "     DATABASE_URL=postgresql://... (from Railway)" -ForegroundColor Gray
    Write-Host "     JWT_SECRET=your-super-secret-jwt-key" -ForegroundColor Gray
    
    Write-Host "`n3️⃣ Deploy AI API to Railway:" -ForegroundColor Cyan
    Write-Host "   • Create another Railway project" -ForegroundColor White
    Write-Host "   • Select 'medspasync-ai-api' directory" -ForegroundColor White
    Write-Host "   • Configure environment variables:" -ForegroundColor White
    Write-Host "     ENVIRONMENT=production" -ForegroundColor Gray
    Write-Host "     AI_API_SECRET_KEY=your-ai-api-secret" -ForegroundColor Gray
    Write-Host "     DATABASE_URL=postgresql://... (same as backend)" -ForegroundColor Gray
    
    Write-Host "`n4️⃣ Deploy Marketing Site to Netlify:" -ForegroundColor Cyan
    Write-Host "   • Go to https://netlify.com" -ForegroundColor White
    Write-Host "   • Sign up/Login with GitHub" -ForegroundColor White
    Write-Host "   • Click 'New site from Git'" -ForegroundColor White
    Write-Host "   • Choose your repository" -ForegroundColor White
    Write-Host "   • Select 'medspasync-marketing' directory" -ForegroundColor White
    Write-Host "   • Build command: npm run build" -ForegroundColor White
    Write-Host "   • Publish directory: dist" -ForegroundColor White
    
    Write-Host "`n🔗 Update Environment Variables:" -ForegroundColor Yellow
    Write-Host "After deploying, update the API URLs in each service's environment variables." -ForegroundColor White
    
    Write-Host "`n✅ Deployment Complete!" -ForegroundColor Green
    Write-Host "Your MedSpaSync Pro ecosystem will be available at:" -ForegroundColor White
    Write-Host "• Frontend: https://your-app.vercel.app" -ForegroundColor Cyan
    Write-Host "• Backend: https://your-app.railway.app" -ForegroundColor Cyan
    Write-Host "• Marketing: https://your-app.netlify.app" -ForegroundColor Cyan
}

function DeployWithGitHubActions {
    Write-Host "`n🔄 GitHub Actions Deployment" -ForegroundColor Yellow
    
    Write-Host "`n📋 Prerequisites:" -ForegroundColor Yellow
    Write-Host "1. GitHub repository with your code" -ForegroundColor White
    Write-Host "2. GitHub Secrets configured" -ForegroundColor White
    
    Write-Host "`n🔐 Required GitHub Secrets:" -ForegroundColor Yellow
    Write-Host "Go to your repository → Settings → Secrets and variables → Actions" -ForegroundColor White
    Write-Host "Add these secrets:" -ForegroundColor White
    Write-Host "• RAILWAY_TOKEN" -ForegroundColor Gray
    Write-Host "• RAILWAY_SERVICE_ID" -ForegroundColor Gray
    Write-Host "• RAILWAY_PRODUCTION_SERVICE_ID" -ForegroundColor Gray
    Write-Host "• VERCEL_TOKEN" -ForegroundColor Gray
    Write-Host "• VERCEL_ORG_ID" -ForegroundColor Gray
    Write-Host "• VERCEL_PROJECT_ID" -ForegroundColor Gray
    Write-Host "• SLACK_WEBHOOK_URL" -ForegroundColor Gray
    
    $proceed = Read-Host "`nHave you configured the GitHub Secrets? (y/n)"
    if ($proceed -ne "y") {
        Write-Host "Please configure the GitHub Secrets first, then run this script again." -ForegroundColor Yellow
        exit 1
    }
    
    # Push to trigger GitHub Actions
    Write-Host "`n📤 Pushing to trigger GitHub Actions deployment..." -ForegroundColor Yellow
    try {
        git add .
        git commit -m "Trigger GitHub Actions deployment"
        git push origin main
        Write-Host "✅ Code pushed successfully" -ForegroundColor Green
        Write-Host "🔄 GitHub Actions will now automatically deploy your application" -ForegroundColor Green
        Write-Host "📊 Monitor deployment at: https://github.com/yourusername/your-repo/actions" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Failed to push to GitHub. Please check your git configuration." -ForegroundColor Red
        exit 1
    }
}

function ManualDeployment {
    Write-Host "`n🔧 Manual Deployment Instructions" -ForegroundColor Yellow
    
    Write-Host "`n📋 Manual deployment requires:" -ForegroundColor Yellow
    Write-Host "1. Local development environment" -ForegroundColor White
    Write-Host "2. Cloud platform accounts (Vercel, Railway, Netlify)" -ForegroundColor White
    Write-Host "3. Environment variables configured" -ForegroundColor White
    
    Write-Host "`n🚀 Quick Commands:" -ForegroundColor Yellow
    
    Write-Host "`nFrontend (Vercel):" -ForegroundColor Cyan
    Write-Host "npm i -g vercel" -ForegroundColor Gray
    Write-Host "cd medspasync-frontend" -ForegroundColor Gray
    Write-Host "vercel --prod" -ForegroundColor Gray
    
    Write-Host "`nBackend (Railway):" -ForegroundColor Cyan
    Write-Host "npm i -g @railway/cli" -ForegroundColor Gray
    Write-Host "railway login" -ForegroundColor Gray
    Write-Host "cd medspasync-backend" -ForegroundColor Gray
    Write-Host "railway up" -ForegroundColor Gray
    
    Write-Host "`nMarketing (Netlify):" -ForegroundColor Cyan
    Write-Host "npm i -g netlify-cli" -ForegroundColor Gray
    Write-Host "cd medspasync-marketing" -ForegroundColor Gray
    Write-Host "netlify deploy --prod" -ForegroundColor Gray
    
    Write-Host "`n📖 For detailed instructions, see: DEPLOYMENT_INSTRUCTIONS.md" -ForegroundColor Yellow
}

Write-Host "`n🎉 Deployment script completed!" -ForegroundColor Green
Write-Host "For support, check the documentation or create a GitHub issue." -ForegroundColor White 