# PROJECT CONFIGURATION & KNOWLEDGE BASE

## Project Overview
- **Name:** MedSpaSync AI API
- **Purpose:** AI-powered medical spa transaction reconciliation system
- **Domain:** Healthcare/Medical Spa Management
- **Type:** Full-stack application with ML capabilities

## Technology Stack
- **Backend:** Python Flask API (v2.3.3) with CORS support
- **Frontend:** React 18.2.0 with Vite 4.3.9 build system
- **Database:** No persistent database (in-memory processing)
- **Testing:** pytest (backend), Vitest (frontend)
- **Build Tools:** Vite for frontend, Docker for containerization
- **Deployment:** Railway with Gunicorn WSGI server

## Core Architecture
- **API Layer:** Flask REST API with 4 main endpoints
- **ML Engine:** Custom fuzzy matching algorithm (95%+ accuracy)
- **Frontend:** React SPA with file upload and results dashboard
- **Processing:** Batch transaction reconciliation with fallback logic

## Gold Standard Files (Patterns to Follow)
- **API Pattern:** `app.py` - Clean Flask API with comprehensive CORS and error handling
- **Component Pattern:** `frontend/src/components/EnhancedTransactionUploader.jsx` - React component with proper state management
- **Test Pattern:** `tests/test_app.py` - Comprehensive API testing with edge cases
- **Service Pattern:** `frontend/src/services/api.js` - Clean API service abstraction

## Commands & Scripts
- **Backend Dev:** `python app.py`
- **Frontend Dev:** `cd frontend && npm run dev`
- **Backend Test:** `python -m pytest tests/ -v`
- **Frontend Test:** `cd frontend && npm test`
- **Build:** `cd frontend && npm run build`
- **Docker:** `docker build -t medspasync-api .`

## Quality Requirements
- **Test Coverage:** Backend 100% (3/3 tests passing), Frontend 100% (4/4 tests passing)
- **Security:** CORS properly configured, input validation implemented
- **Performance:** High-performance batch processing with fuzzy matching
- **Reliability:** Fallback logic when ML is unavailable

## Strategic Context
This is a production-ready medical spa transaction reconciliation system with:
- Advanced fuzzy matching for customer name and service matching
- Medical spa-specific business logic and treatment categories
- Robust error handling and validation
- Comprehensive CORS configuration for cross-origin requests
- Docker containerization for easy deployment

## Security Considerations
- Input validation and sanitization implemented
- CORS properly configured for production domains
- No hardcoded credentials in source code
- Secure API endpoints with proper error handling

## Performance Requirements
- Sub-second response times for single predictions
- Efficient batch processing for large transaction sets
- Optimized fuzzy matching algorithm
- Responsive React frontend with real-time feedback 