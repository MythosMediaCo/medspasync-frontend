#!/bin/bash
# Usage: ./scripts/load-env.sh [frontend|backend] [development|staging|production]
SERVICE=${1:-backend}
ENVIRONMENT=${2:-development}

if [ "$SERVICE" == "frontend" ]; then
  ENV_FILE="./frontend/.env.$ENVIRONMENT"
else
  ENV_FILE="./backend/.env.$ENVIRONMENT"
fi

if [ -f "$ENV_FILE" ]; then
  echo "Loading $ENV_FILE"
  export $(grep -v '^#' "$ENV_FILE" | xargs)
else
  echo "Environment file $ENV_FILE not found!"
  exit 1
fi 