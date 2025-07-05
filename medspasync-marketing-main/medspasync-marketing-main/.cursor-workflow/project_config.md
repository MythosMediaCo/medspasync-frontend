# MedSpaSync Pro - Project Configuration

## Project Overview
**Name:** MedSpaSync Pro Marketing Website  
**Type:** AI-powered medical spa reconciliation platform  
**Architecture:** Full-stack React + Node.js application  
**Domain:** Healthcare/Medical Spa Management  
**Purpose:** Marketing website for AI-powered reconciliation software that eliminates manual transaction matching for medical spas

## Technology Stack
- **Frontend:** React 18.3.1 with Vite 6.3.5
- **Backend:** Node.js + Express 4.21.2
- **Database:** Prisma ORM with PostgreSQL
- **Testing:** Vitest 3.2.4 (frontend), Jest 29.7.0 (backend)
- **Build Tools:** Vite with advanced optimizations
- **Styling:** Tailwind CSS 3.4.17
- **Routing:** React Router DOM 6.30.1

## System Architecture

### Frontend (React + Vite)
- **Framework:** React 18.3.1 with Vite 6.3.5
- **Routing:** React Router DOM 6.30.1
- **Styling:** Tailwind CSS 3.4.17
- **Testing:** Vitest 3.2.4
- **Build Tool:** Vite with advanced optimizations
- **Port:** 3000 (development)

### Backend (Node.js + Express)
- **Framework:** Express 4.21.2
- **Database:** Prisma ORM with PostgreSQL
- **Authentication:** JWT with bcryptjs
- **Testing:** Jest 29.7.0 with Supertest
- **Port:** 3001 (development)
- **AI Components:** Python ML models for reconciliation

## Key Features
1. **AI-Powered Reconciliation:** Automated matching of medical spa transactions
2. **Real-time Processing:** WebSocket-based live reconciliation
3. **Multi-tenant Architecture:** Practice-based user management
4. **HIPAA Compliance:** Healthcare data security standards
5. **Analytics Dashboard:** Business intelligence and reporting
6. **Payment Integration:** Stripe billing system

## File Structure
```
medspasync-marketing/
├── src/                    # Frontend React components
│   ├── components/         # Reusable UI components (24 files)
│   ├── pages/             # Page components (11 files)
│   ├── context/           # React context providers
│   ├── utils/             # Utility functions
│   └── styles/            # CSS and design system
├── medspasync-backend/    # Backend Node.js application
│   ├── __tests__/         # Jest test files
│   ├── controllers/       # Express controllers
│   ├── middleware/        # Express middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── services/         # Business logic services
│   └── reconciliation/   # Python ML components
├── public/               # Static assets
└── scripts/             # Build and deployment scripts
```

## Development Environment
- **Node.js:** >=18.0.0
- **npm:** >=8.0.0
- **OS:** Windows 10 (PowerShell)
- **IDE:** Cursor with AI assistance

## Testing Strategy
- **Frontend:** Vitest with jsdom for component testing
- **Backend:** Jest with Supertest for API testing
- **Coverage:** 70% minimum threshold
- **E2E:** Lighthouse CI for performance testing

## Deployment
- **Frontend:** Netlify (static hosting)
- **Backend:** Heroku/Railway (Node.js hosting)
- **Database:** PostgreSQL (managed service)
- **CDN:** Cloudflare for static assets

## Security Considerations
- JWT token authentication
- Rate limiting on API endpoints
- CORS configuration
- Input validation and sanitization
- HIPAA compliance measures
- Environment variable management

## Performance Optimizations
- Code splitting and lazy loading
- Image optimization
- Bundle analysis and optimization
- Caching strategies
- CDN integration

## Current Issues
- Backend dependencies need installation
- Network connectivity issues during npm install
- Missing frontend test files
- Vite configuration warnings
- **222 linting issues** (134 errors, 88 warnings)
- Unescaped HTML entities throughout codebase
- Unused React imports
- Missing accessibility attributes
- Console statements in production code

## Development Workflow
1. Frontend development on port 3000
2. Backend API on port 3001
3. Proxy configuration for API calls
4. Hot reload for development
5. Automated testing on commit

## API Endpoints
- `/api/auth/*` - Authentication routes
- `/api/reconciliation/*` - AI reconciliation
- `/api/analytics/*` - Business intelligence
- `/api/billing/*` - Payment processing
- `/api/webhook/*` - External integrations

## Environment Variables
- `VITE_API_URL` - Backend API URL
- `JWT_SECRET` - JWT signing secret
- `DATABASE_URL` - PostgreSQL connection
- `STRIPE_SECRET_KEY` - Payment processing
- `NODE_ENV` - Environment mode

## Build Status
- **Frontend Build:** ✅ Successful (2.16s)
- **Bundle Size:** 138.94 kB (44.86 kB gzipped)
- **Development Server:** ✅ Running
- **Sitemap Generation:** ✅ 11 pages included

## Quality Requirements
- **Test Coverage:** >90% (currently 0%)
- **TypeScript:** Not configured (JSX only)
- **Security:** OWASP compliance needed
- **Performance:** Lighthouse >90 (not tested)
- **Linting:** 222 issues to resolve

## Commands & Scripts
- **Dev Server:** `npm run dev` (port 3000)
- **Build:** `npm run build` (Vite)
- **Test:** `npm test` (Vitest)
- **Lint:** `npm run lint` (ESLint)
- **Type Check:** Not configured
- **Preview:** `npm run preview` (port 4173)

## Gold Standard Files (Patterns to Follow)
- **Component Pattern:** `src/components/Hero.jsx` - Main hero component
- **Page Pattern:** `src/pages/Home.jsx` - Landing page structure
- **Utility Pattern:** `src/utils/formSubmit.js` - Form handling
- **Test Pattern:** `medspasync-backend/__tests__/auth.test.js` - Backend testing 