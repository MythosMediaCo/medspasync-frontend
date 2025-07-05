#!/bin/bash
# Usage: ./scripts/validate-env.sh [frontend|backend] [development|staging|production]
SERVICE=${1:-backend}
ENVIRONMENT=${2:-development}

if [ "$SERVICE" == "frontend" ]; then
  ENV_FILE="./frontend/.env.$ENVIRONMENT"
  REQUIRED_VARS=(VITE_API_URL VITE_WS_URL VITE_ENABLE_AI_RECONCILIATION VITE_ENABLE_REAL_TIME_UPDATES VITE_HIPAA_MODE VITE_SESSION_TIMEOUT_MINUTES)
else
  ENV_FILE="./backend/.env.$ENVIRONMENT"
  REQUIRED_VARS=(NODE_ENV PORT MONGO_URI STRIPE_SECRET_KEY JWT_SECRET EMAIL_USER RATE_LIMIT_MAX_REQUESTS)
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Environment file $ENV_FILE not found!"
  exit 1
fi

MISSING=0
for VAR in "${REQUIRED_VARS[@]}"; do
  if ! grep -q "^$VAR=" "$ENV_FILE"; then
    echo "Missing $VAR in $ENV_FILE"
    MISSING=1
  fi
done

if [ $MISSING -eq 1 ]; then
  echo "Validation failed."
  exit 1
else
  echo "All required variables present in $ENV_FILE."
fi 