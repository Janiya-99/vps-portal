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
source /opt/infra/database/.env

APP_DB="db_${SLUG}"
APP_USER="user_${SLUG}"
APP_PASS=$(openssl rand -base64 18 | tr -dc 'a-zA-Z0-9' | head -c 16)

docker exec -i shared-mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<SQL
CREATE DATABASE IF NOT EXISTS \`${APP_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${APP_USER}'@'%' IDENTIFIED BY '${APP_PASS}';
GRANT ALL PRIVILEGES ON \`${APP_DB}\`.* TO '${APP_USER}'@'%';
FLUSH PRIVILEGES;
SQL

echo "Database Provisioned Successfully:"
echo "---------------------------------"
echo "DB_HOST=shared-mysql"
echo "DB_PORT=3306"
echo "DB_DATABASE=${APP_DB}"
echo "DB_USERNAME=${APP_USER}"
echo "DB_PASSWORD=${APP_PASS}"
echo "---------------------------------"
ENDSSH
