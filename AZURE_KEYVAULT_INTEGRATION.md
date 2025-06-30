# Azure Key Vault Integration Guide

## Overview

This document outlines the Azure Key Vault integration for all MedSpaSync Pro applications. Each application is configured to securely retrieve secrets from its corresponding Azure Key Vault.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Backend       │    │   Frontend      │    │   Marketing     │    │   Pro-Next      │
│   Application   │    │   Application   │    │   Application   │    │   (Demo)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         ▼                       ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ medspasync-     │    │ medspasync-     │    │ medspasync-     │    │ medspasync-     │
│ backend         │    │ frontend        │    │ marketing       │    │ demo            │
│ Key Vault       │    │ Key Vault       │    │ Key Vault       │    │ Key Vault       │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Key Vaults and Their Secrets

### 1. Backend Key Vault (`medspasync-backend`)

**Location**: `https://medspasync-backend.vault.azure.net/`

**Secrets**:
- `STRIPE-SECRET-KEY` - Stripe secret key for payments
- `STRIPE-WEBHOOK-SECRET` - Stripe webhook secret
- `STRIPE-PRODUCT-PRO` - Stripe product ID for Pro plan
- `STRIPE-PRODUCT-CORE` - Stripe product ID for Core plan
- `JWT-SECRET` - JWT signing secret
- `EMAIL-USER` - Email service username
- `EMAIL-PASS` - Email service password
- `SMTP-HOST` - SMTP server host
- `SMTP-PORT` - SMTP server port
- `LOGIN` - Email login credentials
- `EMAIL-FROM` - From email address
- `SALES-EMAIL` - Sales team email
- `SUPPORT-EMAIL` - Support team email
- `INTERNAL-API-KEY` - Internal API authentication key
- `NODE-ENV` - Node.js environment
- `MONGO-URI` - MongoDB connection string

### 2. Frontend Key Vault (`medspasync-frontend`)

**Location**: `https://medspasync-frontend.vault.azure.net/`

**Secrets**:
- `FRONTEND-URL` - Frontend application URL
- `NEXT_PUBLIC_API_URL` - Public API endpoint
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `NEXT_PUBLIC_APP_URL` - Application URL

### 3. Marketing Key Vault (`medspasync-marketing`)

**Location**: `https://medspasync-marketing.vault.azure.net/`

**Secrets**:
- `MARKETING-URL` - Marketing site URL
- `CONTACT-EMAIL` - Contact email address
- `ANALYTICS-ID` - Google Analytics ID
- `GOOGLE-TAG-MANAGER-ID` - Google Tag Manager ID
- `SOCIAL-MEDIA-LINKS` - Social media links
- `API-ENDPOINTS` - API endpoint configurations

### 4. Demo Key Vault (`medspasync-demo`)

**Location**: `https://medspasync-demo.vault.azure.net/`

**Secrets**:
- `DEMO-API-URL` - Demo API endpoint
- `DEMO-STRIPE-KEY` - Demo Stripe key
- `DEMO-DATABASE-URL` - Demo database connection
- `DEMO-JWT-SECRET` - Demo JWT secret
- `DEMO-EMAIL-CONFIG` - Demo email configuration
- `DEMO-ENVIRONMENT` - Demo environment settings
- `DEMO-FEATURES` - Demo feature flags
- `DEMO-LIMITS` - Demo usage limits

## Implementation Details

### Backend Integration

**File**: `medspasync-backend/config/azure-keyvault.js`

```javascript
const keyVaultManager = require('./config/azure-keyvault');

// Initialize on app startup
await keyVaultManager.initialize();

// Get specific configurations
const stripeConfig = await keyVaultManager.getStripeConfig();
const emailConfig = await keyVaultManager.getEmailConfig();
const dbConfig = await keyVaultManager.getDatabaseConfig();
const authConfig = await keyVaultManager.getAuthConfig();
```

### Frontend Integration

**File**: `medspasync-frontend/lib/azure-keyvault.js`

```javascript
import frontendKeyVaultManager from './lib/azure-keyvault';

// Initialize via API route
// GET /api/init

// Get frontend configuration
const config = await frontendKeyVaultManager.getFrontendConfig();
```

### Marketing Integration

**File**: `medspasync-marketing/lib/azure-keyvault.js`

```javascript
import marketingKeyVaultManager from './lib/azure-keyvault';

// Initialize on build/startup
await marketingKeyVaultManager.initialize();

// Get marketing configuration
const config = await marketingKeyVaultManager.getMarketingConfig();
```

### Pro-Next (Demo) Integration

**File**: `medspasync-pro-next/medspasync-pro-next-main/lib/azure-keyvault.js`

```javascript
import proNextKeyVaultManager from './lib/azure-keyvault';

// Initialize via API route
// GET /api/init

// Get demo configuration
const config = await proNextKeyVaultManager.getDemoConfig();
```

## Authentication

All applications use Azure's `DefaultAzureCredential` for authentication, which supports:

1. **Managed Identity** (recommended for production)
2. **Service Principal** (for development/testing)
3. **Azure CLI** (for local development)
4. **Environment Variables** (fallback)

## Setup Instructions

### 1. Install Dependencies

Each application has been updated with Azure Key Vault dependencies:

```bash
# Backend
cd medspasync-backend
npm install @azure/identity @azure/keyvault-secrets

# Frontend
cd medspasync-frontend
npm install @azure/identity @azure/keyvault-secrets

# Marketing
cd medspasync-marketing
npm install @azure/identity @azure/keyvault-secrets

# Pro-Next
cd medspasync-pro-next/medspasync-pro-next-main
npm install @azure/identity @azure/keyvault-secrets
```

### 2. Configure Authentication

#### Option A: Managed Identity (Production)

```bash
# Enable managed identity for your app service
az webapp identity assign --name your-app-name --resource-group medspasync-rg

# Grant access to Key Vault
az keyvault set-policy --name medspasync-backend --object-id <managed-identity-object-id> --secret-permissions get list
```

#### Option B: Service Principal (Development)

```bash
# Create service principal
az ad sp create-for-rbac --name medspasync-keyvault-sp

# Grant access to Key Vault
az keyvault set-policy --name medspasync-backend --spn <service-principal-id> --secret-permissions get list
```

#### Option C: Azure CLI (Local Development)

```bash
# Login with Azure CLI
az login

# Set subscription
az account set --subscription <subscription-id>
```

### 3. Environment Variables (Fallback)

If Key Vault is unavailable, applications fall back to environment variables:

```bash
# Backend
export STRIPE_SECRET_KEY="your-stripe-secret"
export JWT_SECRET="your-jwt-secret"
# ... other secrets

# Frontend
export FRONTEND_URL="https://www.medspasyncpro.com"
export NEXT_PUBLIC_API_URL="https://api.medspasyncpro.com"
# ... other secrets
```

## Testing the Integration

### 1. Backend Test

```bash
cd medspasync-backend
npm start
# Check console for Key Vault initialization messages
```

### 2. Frontend Test

```bash
cd medspasync-frontend
npm run dev
# Visit http://localhost:3000/api/init to test Key Vault
```

### 3. Marketing Test

```bash
cd medspasync-marketing
npm run dev
# Check console for Key Vault initialization messages
```

### 4. Pro-Next Test

```bash
cd medspasync-pro-next/medspasync-pro-next-main
npm run dev
# Visit http://localhost:3000/api/init to test Key Vault
```

## Security Best Practices

1. **Never commit secrets to version control**
2. **Use managed identities in production**
3. **Implement proper access controls**
4. **Enable Key Vault soft delete**
5. **Enable Key Vault RBAC**
6. **Monitor Key Vault access logs**
7. **Rotate secrets regularly**

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify Azure CLI login: `az account show`
   - Check service principal permissions
   - Ensure managed identity is enabled

2. **Permission Denied**
   - Verify Key Vault access policies
   - Check RBAC assignments
   - Ensure correct vault URL

3. **Secret Not Found**
   - Verify secret names match exactly
   - Check if secrets exist in vault
   - Ensure proper casing

### Debug Commands

```bash
# Check Azure CLI status
az account show

# List Key Vaults
az keyvault list --resource-group medspasync-rg

# List secrets in vault
az keyvault secret list --vault-name medspasync-backend

# Test secret retrieval
az keyvault secret show --vault-name medspasync-backend --name STRIPE-SECRET-KEY
```

## Monitoring and Logging

All Key Vault operations are logged with appropriate error handling:

- ✅ Successful secret retrieval
- ⚠️ Fallback to environment variables
- ❌ Authentication/permission errors
- 🔄 Cache hits/misses

## Next Steps

1. **Deploy applications with Key Vault integration**
2. **Set up monitoring and alerting**
3. **Implement secret rotation policies**
4. **Add Key Vault health checks**
5. **Create backup and recovery procedures**

## Support

For issues with Azure Key Vault integration:

1. Check Azure Key Vault documentation
2. Review application logs
3. Verify authentication setup
4. Test with Azure CLI commands
5. Contact Azure support if needed

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Author**: MedSpaSync Pro Team 