# 🚀 MedSpaSync Pro - Deployment Instructions

## Current Situation
- ✅ Node.js v22.16.0 available
- ✅ npm v10.9.2 available
- ⚠️ Docker not available (network path limitations)
- ⚠️ Disk space issues on network path

## 🎯 **Recommended Deployment Strategy: Cloud-First**

### **Option 1: Vercel + Railway + Netlify (Recommended)**

#### **Step 1: Deploy Frontend to Vercel**

1. **Go to [Vercel.com](https://vercel.com)**
2. **Sign up/Login with GitHub**
3. **Import Repository:**
   - Click "New Project"
   - Select your GitHub repository
   - Choose the `medspasync-frontend` directory
   - Vercel will auto-detect Next.js

4. **Configure Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   NEXT_PUBLIC_APP_NAME=MedSpaSync Pro
   NODE_ENV=production
   ```

5. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy automatically

#### **Step 2: Deploy Backend to Railway**

1. **Go to [Railway.app](https://railway.app)**
2. **Sign up/Login with GitHub**
3. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select the `medspasync-backend` directory

4. **Add PostgreSQL Database:**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will provide connection string

5. **Configure Environment Variables:**
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://... (from Railway)
   JWT_SECRET=your-super-secret-jwt-key
   AI_API_URL=https://your-ai-api-url.railway.app
   ```

6. **Deploy:**
   - Railway will auto-deploy on push to main

#### **Step 3: Deploy AI API to Railway**

1. **Create another Railway project**
2. **Select `medspasync-ai-api` directory**
3. **Configure Environment Variables:**
   ```
   ENVIRONMENT=production
   AI_API_SECRET_KEY=your-ai-api-secret
   DATABASE_URL=postgresql://... (same as backend)
   ```

#### **Step 4: Deploy Marketing Site to Netlify**

1. **Go to [Netlify.com](https://netlify.com)**
2. **Sign up/Login with GitHub**
3. **Import Repository:**
   - Click "New site from Git"
   - Choose your repository
   - Select `medspasync-marketing` directory

4. **Configure Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`

5. **Configure Environment Variables:**
   ```
   VITE_PLATFORM_NAME=MedSpaSync Pro
   VITE_CONTACT_EMAIL=support@medspasyncpro.com
   ```

### **Option 2: GitHub Actions Deployment**

#### **Step 1: Configure GitHub Secrets**

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
```
RAILWAY_TOKEN=your_railway_token
RAILWAY_SERVICE_ID=your_staging_service_id
RAILWAY_PRODUCTION_SERVICE_ID=your_production_service_id
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

#### **Step 2: Trigger Deployment**

```bash
# Push to main branch to trigger automatic deployment
git add .
git commit -m "Deploy MedSpaSync Pro ecosystem"
git push origin main
```

### **Option 3: Manual Cloud Deployment**

#### **Frontend (Vercel)**
```bash
# Install Vercel CLI (if you have local access)
npm i -g vercel

# Deploy
cd medspasync-frontend
vercel --prod
```

#### **Backend (Railway)**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

#### **Marketing Site (Netlify)**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
cd medspasync-marketing
netlify deploy --prod
```

## 🔧 **Environment Setup**

### **Required Environment Variables**

#### **Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
NEXT_PUBLIC_APP_NAME=MedSpaSync Pro
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
```

#### **Backend (.env)**
```env
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-here
AI_API_URL=https://your-ai-api-url.railway.app
REDIS_URL=redis://your-redis-url
```

#### **AI API (.env)**
```env
ENVIRONMENT=production
AI_API_SECRET_KEY=your-ai-api-secret-key
DATABASE_URL=postgresql://username:password@host:port/database
REDIS_URL=redis://your-redis-url
```

## 📊 **Monitoring Setup**

### **Option 1: Vercel Analytics**
- Built into Vercel dashboard
- Real-time performance monitoring
- Error tracking

### **Option 2: Railway Monitoring**
- Built into Railway dashboard
- Logs and metrics
- Health checks

### **Option 3: External Monitoring**
- **UptimeRobot**: Free uptime monitoring
- **Sentry**: Error tracking
- **Google Analytics**: User analytics

## 🚀 **Quick Deploy Commands**

### **For Immediate Deployment:**

1. **Push to GitHub:**
```bash
git add .
git commit -m "Deploy MedSpaSync Pro v1.0"
git push origin main
```

2. **Set up cloud platforms:**
   - Vercel: Connect repository, auto-deploy
   - Railway: Connect repository, auto-deploy
   - Netlify: Connect repository, auto-deploy

3. **Configure environment variables** in each platform

4. **Test deployment:**
   - Frontend: https://your-app.vercel.app
   - Backend: https://your-app.railway.app
   - Marketing: https://your-app.netlify.app

## 🔍 **Post-Deployment Verification**

### **Health Checks:**
```bash
# Test frontend
curl https://your-app.vercel.app/health

# Test backend
curl https://your-app.railway.app/health

# Test marketing site
curl https://your-app.netlify.app
```

### **Performance Testing:**
```bash
# Install k6 (if you have local access)
# Run performance tests
k6 run performance-tests/load-test.js
```

## 🆘 **Troubleshooting**

### **Common Issues:**

1. **Build Failures:**
   - Check environment variables
   - Verify package.json scripts
   - Check platform-specific requirements

2. **Database Connection:**
   - Verify DATABASE_URL format
   - Check database permissions
   - Ensure database is accessible

3. **CORS Issues:**
   - Configure CORS in backend
   - Update frontend API URLs
   - Check domain whitelisting

### **Support:**
- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Netlify Docs**: https://docs.netlify.com

## 🎉 **Success Criteria**

Your deployment is successful when:
- ✅ Frontend loads at Vercel URL
- ✅ Backend API responds at Railway URL
- ✅ Marketing site loads at Netlify URL
- ✅ Database connections work
- ✅ Health checks pass
- ✅ Performance tests pass

---

**🚀 Ready to deploy? Choose your preferred option above and follow the steps!** 