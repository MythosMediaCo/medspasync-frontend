#!/bin/bash
# Usage: ./scripts/deploy-env.sh [frontend|backend] [development|staging|production] [destination]
SERVICE=${1:-backend}
ENVIRONMENT=${2:-development}
DEST=${3:-/etc/medspasync-pro/envs}

if [ "$SERVICE" == "frontend" ]; then
  ENV_FILE="./frontend/.env.$ENVIRONMENT"
else
  ENV_FILE="./backend/.env.$ENVIRONMENT"
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Environment file $ENV_FILE not found!"
  exit 1
fi

mkdir -p "$DEST"
cp "$ENV_FILE" "$DEST/$(basename $ENV_FILE)"
echo "Deployed $ENV_FILE to $DEST/$(basename $ENV_FILE)" 