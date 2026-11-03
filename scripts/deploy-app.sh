#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <project-slug> [target-host]"
  echo "Example: $0 myapp vps-prod"
  exit 1
fi

PROJECT_SLUG="$1"
TARGET_HOST="${2:-vps-prod}"

ssh "${TARGET_HOST}" "bash -s -- '${PROJECT_SLUG}'" << 'ENDSSH'
set -euo pipefail
SLUG="$1"
APP_DIR="/opt/apps/${SLUG}"

mkdir -p "${APP_DIR}/app"
cd "${APP_DIR}"

echo "Project directory structure ready at ${APP_DIR}."
echo "App container name must be: app-${SLUG}"
echo "Network attachment must be: shared-network"
ENDSSH
