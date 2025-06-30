# 🚀 Railway Deployment Guide for MedSpaSync Pro

## **Step 1: Deploy Backend to Railway**

### **A. Create Railway Project**
1. Go to [railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose repository: `MythosMediaCo/medspasync-frontend`
6. Set root directory to: `medspasync-backend`
7. Click "Deploy Now"

### **B. Add PostgreSQL Database**
1. In your Railway project dashboard
2. Click "New" → "Database" → "PostgreSQL"
3. Railway will create a PostgreSQL database
4. Copy the connection string (DATABASE_URL)

### **C. Configure Environment Variables**
In Railway project settings → Variables, add:

```
NODE_ENV=production
DATABASE_URL=postgresql://... (copy from Railway PostgreSQL)
JWT_SECRET=medspasync-pro-super-secret-jwt-key-2024
AI_API_URL=https://your-ai-api-url.railway.app (we'll get this in step 2)
PORT=5000
```

### **D. Deploy Backend**
1. Railway will automatically build and deploy
2. Wait for deployment to complete
3. Copy the generated URL (e.g., `https://medspasync-backend-production.up.railway.app`)

---

## **Step 2: Deploy AI API to Railway**

### **A. Create Second Railway Project**
1. Go back to Railway dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose same repository: `MythosMediaCo/medspasync-frontend`
5. Set root directory to: `medspasync-ai-api`
6. Click "Deploy Now"

### **B. Configure AI API Environment Variables**
In the AI API Railway project settings → Variables, add:

```
ENVIRONMENT=production
AI_API_SECRET_KEY=medspasync-ai-api-secret-key-2024
DATABASE_URL=postgresql://... (same as backend - copy from backend project)
PORT=8000
```

### **C. Deploy AI API**
1. Railway will automatically build and deploy
2. Wait for deployment to complete
3. Copy the generated URL (e.g., `https://medspasync-ai-api-production.up.railway.app`)

---

## **Step 3: Update Backend with AI API URL**

### **A. Update Backend Environment Variables**
1. Go back to your backend Railway project
2. Update the `AI_API_URL` variable with your AI API URL
3. Redeploy the backend

---

## **Step 4: Update Netlify Environment Variables**

### **A. Update Netlify Settings**
1. Go to your Netlify dashboard
2. Select your frontend site
3. Go to Site settings → Environment variables
4. Add/Update these variables:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
NEXT_PUBLIC_AI_API_URL=https://your-ai-api-url.railway.app
NEXT_PUBLIC_APP_NAME=MedSpaSync Pro
```

### **B. Redeploy Netlify**
1. Trigger a new deployment in Netlify
2. Wait for deployment to complete

---

## **Step 5: Test Integration**

### **A. Run Integration Test**
1. Use the provided PowerShell script: `test-netlify-integration.ps1`
2. Enter your URLs when prompted
3. Verify all services are connected

### **B. Manual Testing**
1. Test frontend: Visit your Netlify URL
2. Test backend: Visit `your-backend-url.railway.app/health`
3. Test AI API: Visit `your-ai-api-url.railway.app/health`

---

## **Step 6: Configure GitHub Secrets (Optional)**

For automated deployments via GitHub Actions:

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add these secrets:

```
RAILWAY_TOKEN=your_railway_token
RAILWAY_BACKEND_SERVICE_ID=your_backend_service_id
RAILWAY_AI_API_SERVICE_ID=your_ai_api_service_id
```

---

## **Expected URLs After Deployment**

- **Frontend**: `https://your-app.netlify.app` (already deployed)
- **Backend**: `https://medspasync-backend-production.up.railway.app`
- **AI API**: `https://medspasync-ai-api-production.up.railway.app`

---

## **Troubleshooting**

### **Common Issues:**

1. **Build Failures**: Check Railway logs for dependency issues
2. **Database Connection**: Verify DATABASE_URL format
3. **Port Issues**: Ensure PORT environment variable is set
4. **CORS Issues**: Update CORS settings in backend

### **Support:**
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

---

## **Success Criteria**

✅ Backend responds at `/health` endpoint
✅ AI API responds at `/health` endpoint  
✅ Frontend can connect to backend
✅ AI reconciliation features work
✅ Database connections established

**🎉 Once all tests pass, your MedSpaSync Pro ecosystem is fully deployed!** 