# MedSpaSync Pro - Phase 2: API Architecture Blueprint

## 1. OpenAPI 3.0 Specifications

### 1.1 Core API Structure

```yaml
openapi: 3.0.3
info:
  title: MedSpaSync Pro API
  version: 1.0.0
  description: HIPAA-compliant healthcare management API
  contact:
    name: MedSpaSync Support
    email: support@medspasync.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.medspasync.com/v1
    description: Production server
  - url: https://staging-api.medspasync.com/v1
    description: Staging server
  - url: https://dev-api.medspasync.com/v1
    description: Development server

security:
  - BearerAuth: []
  - ApiKeyAuth: []

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
```

### 1.2 Authentication Endpoints

```yaml
paths:
  /auth/login:
    post:
      summary: User authentication
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
                mfaToken:
                  type: string
                  description: MFA token if enabled
      responses:
        '200':
          description: Authentication successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  accessToken:
                    type: string
                  refreshToken:
                    type: string
                  expiresIn:
                    type: integer
                  user:
                    $ref: '#/components/schemas/User'
        '401':
          description: Authentication failed
        '429':
          description: Rate limit exceeded

  /auth/refresh:
    post:
      summary: Refresh access token
      tags: [Authentication]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [refreshToken]
              properties:
                refreshToken:
                  type: string
      responses:
        '200':
          description: Token refreshed successfully
        '401':
          description: Invalid refresh token
```

### 1.3 Patient Management Endpoints

```yaml
  /patients:
    get:
      summary: List patients
      tags: [Patients]
      security:
        - BearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
        - name: status
          in: query
          schema:
            type: string
            enum: [ACTIVE, VIP, INACTIVE]
      responses:
        '200':
          description: List of patients
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Patient'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
        '403':
          description: Insufficient permissions

    post:
      summary: Create new patient
      tags: [Patients]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PatientCreate'
      responses:
        '201':
          description: Patient created successfully
        '400':
          description: Validation error
        '409':
          description: Patient already exists

  /patients/{patientId}:
    get:
      summary: Get patient details
      tags: [Patients]
      security:
        - BearerAuth: []
      parameters:
        - name: patientId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Patient details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Patient'
        '404':
          description: Patient not found
```

### 1.4 Appointment Management Endpoints

```yaml
  /appointments:
    get:
      summary: List appointments
      tags: [Appointments]
      security:
        - BearerAuth: []
      parameters:
        - name: startDate
          in: query
          schema:
            type: string
            format: date
        - name: endDate
          in: query
          schema:
            type: string
            format: date
        - name: status
          in: query
          schema:
            type: string
            enum: [SCHEDULED, CONFIRMED, CANCELLED, COMPLETED]
      responses:
        '200':
          description: List of appointments
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Appointment'
                  pagination:
                    $ref: '#/components/schemas/Pagination'

    post:
      summary: Create appointment
      tags: [Appointments]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AppointmentCreate'
      responses:
        '201':
          description: Appointment created successfully
        '400':
          description: Validation error
        '409':
          description: Time slot conflict
```

### 1.5 AI Reconciliation Endpoints

```yaml
  /ai/reconcile:
    post:
      summary: AI-powered data reconciliation
      tags: [AI]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [data]
              properties:
                data:
                  type: array
                  items:
                    type: object
                algorithm:
                  type: string
                  enum: [FUZZY_MATCH, ML_MODEL, HYBRID]
                  default: HYBRID
                confidence:
                  type: number
                  minimum: 0.1
                  maximum: 1.0
                  default: 0.8
      responses:
        '200':
          description: Reconciliation results
          content:
            application/json:
              schema:
                type: object
                properties:
                  matches:
                    type: array
                    items:
                      $ref: '#/components/schemas/ReconciliationMatch'
                  confidence:
                    type: number
                  processingTime:
                    type: number
        '400':
          description: Invalid input data
        '503':
          description: AI service unavailable
```

## 2. Authentication & Authorization Patterns

### 2.1 JWT Token Structure

```javascript
// JWT Payload Structure
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "PRACTITIONER",
  "practiceId": "practice_id",
  "permissions": ["read:patients", "write:appointments"],
  "iat": 1640995200,
  "exp": 1640998800,
  "jti": "unique_token_id"
}
```

### 2.2 Role-Based Access Control (RBAC)

```javascript
// Permission Matrix
const PERMISSIONS = {
  ADMIN: [
    'read:*', 'write:*', 'delete:*', 'admin:*'
  ],
  PRACTITIONER: [
    'read:patients', 'read:appointments', 'write:appointments',
    'read:services', 'read:reports'
  ],
  STAFF: [
    'read:patients', 'read:appointments', 'write:appointments',
    'read:services'
  ],
  MANAGER: [
    'read:*', 'write:appointments', 'write:services',
    'read:reports', 'write:reports'
  ]
};
```

### 2.3 Multi-Factor Authentication (MFA)

```javascript
// MFA Implementation
const mfaService = {
  async generateTOTP(userId) {
    const secret = await this.getUserSecret(userId);
    return speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      window: 2,
      algorithm: 'sha256'
    });
  },
  
  async verifyTOTP(userId, token) {
    const secret = await this.getUserSecret(userId);
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2,
      algorithm: 'sha256'
    });
  }
};
```

## 3. Rate Limiting & Throttling Strategies

### 3.1 Rate Limiting Configuration

```javascript
// Rate Limiting Implementation
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
};

// Different limits for different endpoints
const endpointLimits = {
  '/auth/login': { max: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  '/ai/reconcile': { max: 10, windowMs: 60 * 60 * 1000 }, // 10 requests per hour
  '/patients': { max: 1000, windowMs: 15 * 60 * 1000 }, // 1000 requests per 15 minutes
  '/appointments': { max: 500, windowMs: 15 * 60 * 1000 } // 500 requests per 15 minutes
};
```

### 3.2 Circuit Breaker Pattern

```javascript
// Circuit Breaker Implementation
const circuitBreaker = {
  failureThreshold: 5,
  recoveryTimeout: 60000, // 1 minute
  monitorInterval: 10000, // 10 seconds
  
  async execute(operation) {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
};
```

## 4. Error Handling & Response Patterns

### 4.1 Standard Error Response Format

```javascript
// Error Response Structure
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email format is invalid"
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789",
    "correlationId": "corr_987654321"
  }
}
```

### 4.2 HTTP Status Code Mapping

```javascript
// Status Code Strategy
const statusCodes = {
  // Success
  200: 'OK - Request successful',
  201: 'Created - Resource created successfully',
  204: 'No Content - Request successful, no response body',
  
  // Client Errors
  400: 'Bad Request - Invalid request data',
  401: 'Unauthorized - Authentication required',
  403: 'Forbidden - Insufficient permissions',
  404: 'Not Found - Resource not found',
  409: 'Conflict - Resource conflict',
  422: 'Unprocessable Entity - Validation error',
  429: 'Too Many Requests - Rate limit exceeded',
  
  // Server Errors
  500: 'Internal Server Error - Unexpected error',
  502: 'Bad Gateway - Upstream service error',
  503: 'Service Unavailable - Service temporarily unavailable',
  504: 'Gateway Timeout - Upstream timeout'
};
```

## 5. API Versioning Strategy

### 5.1 Versioning Approach

```javascript
// URL-based versioning
const apiVersions = {
  v1: {
    status: 'stable',
    deprecationDate: null,
    sunsetDate: null,
    features: ['basic_crud', 'authentication', 'appointments']
  },
  v2: {
    status: 'beta',
    deprecationDate: '2024-12-31',
    sunsetDate: '2025-12-31',
    features: ['advanced_ai', 'real_time_updates', 'webhooks']
  }
};

// Version migration strategy
const migrationStrategy = {
  backwardCompatibility: true,
  deprecationNotice: true,
  automaticUpgrade: false,
  migrationGuide: '/docs/migration'
};
```

### 5.2 Backward Compatibility

```javascript
// Backward Compatibility Rules
const compatibilityRules = {
  // Never remove fields, only deprecate
  deprecatedFields: {
    'v1.patients.phoneNumber': {
      deprecatedIn: 'v2.0.0',
      alternative: 'v2.patients.contact.phone',
      removalDate: 'v3.0.0'
    }
  },
  
  // Maintain response structure
  responseStructure: {
    data: 'Always present',
    pagination: 'Always present for list endpoints',
    meta: 'Optional metadata'
  }
};
```

This API architecture provides a robust, secure, and scalable foundation for the MedSpaSync Pro healthcare platform with comprehensive HIPAA compliance features. 