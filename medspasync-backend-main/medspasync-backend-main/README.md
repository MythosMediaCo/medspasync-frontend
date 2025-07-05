# MedSpaSync Backend

This Node.js/Express API powers the MedSpaSync Pro application.

## Requirements
 - Node.js 18+
- MongoDB database

## Setup
1. Copy `.env.example` to `.env` and fill in the required values.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   NODE_ENV=production npm start
   ```

## Environment Variables
See `.env.example` for all required variables. In addition to `JWT_SECRET`, a
`JWT_REFRESH_SECRET` value is used for issuing refresh tokens.

## User Roles
The API uses role-based access control. Supported roles are:

- `admin` – full access to management endpoints
- `staff` – limited practice management access
- `client` – client portal access only

Routes under `server/routes` enforce these roles using the `requireRole` middleware.

## AI Model Metrics

If `ML_SERVICE_URL` is configured, you can query the current machine learning
model statistics using the endpoint:

```http
GET /api/ai/model/metrics
```

This forwards the request to your external ML service located at
`ML_SERVICE_URL` and returns the JSON response.

## Running Tests

npm test
```

