# VPS Infrastructure & Deployment Guideline (172.255.210.203)

## 1. Agent Execution Constraints
- **Target Host:** `root@172.255.210.203` (or SSH alias `vps-prod`).
- **Non-Interactive Mandate:** Never run interactive editors (`nano`, `vim`, `htop`) or commands without non-interactive flags. Always use `DEBIAN_FRONTEND=noninteractive` for `apt-get`, `cat << 'EOF' > file` for file creation, and `docker exec -i` (without `-t`) for automated SQL queries.
- **Network Architecture:** All containers MUST attach to the external Docker bridge network `shared-network`. Never expose database ports (`3306`, `6379`) to the public host (`0.0.0.0`).

## 2. Directory Standard (`/opt`)
- `/opt/infra/proxy` — Nginx Proxy Manager (`infra-proxy`)
- `/opt/infra/database` — Shared MySQL 8.0 (`shared-mysql`) & Redis 7 (`shared-redis`)
- `/opt/apps/<project-slug>` — Individual application stacks (`Dockerfile`, `docker-compose.yml`, `.env.production`, and `app/` source directory)
- `/opt/ops/backups` — Daily `mysqldump` script and 7-day rolling `.sql.gz` archives
- `/opt/ops/maintenance` — Weekly Docker image and build-cache pruning script

---

## 3. Initial VPS Bootstrap Playbook
When instructed to initialize or provision the fresh VPS, execute this idempotent script over SSH in a single remote execution:

```bash
ssh vps-prod 'bash -s' << 'ENDSSH'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

echo "=== [1/6] Updating OS & Configuring 4GB Swap ==="
apt-get update -y
apt-get upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"
apt-get install -y curl git ufw ca-certificates gnupg openssl

if [ ! -f /swapfile ]; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo "/swapfile none swap sw 0 0" >> /etc/fstab
fi

echo "=== [2/6] Configuring UFW Firewall ==="
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 81/tcp
ufw --force enable

echo "=== [3/6] Installing Docker & Log Rotation ==="
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

mkdir -p /etc/docker
cat << 'EOF' > /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
systemctl restart docker

docker network inspect shared-network >/dev/null 2>&1 || docker network create shared-network

echo "=== [4/6] Scaffolding /opt & Deploying Proxy ==="
mkdir -p /opt/infra/proxy/{data,letsencrypt} \
         /opt/infra/database/{data,init} \
         /opt/apps \
         /opt/ops/{backups/archives,maintenance}

chmod 700 /opt/infra/database/data /opt/ops/backups

cat << 'EOF' > /opt/infra/proxy/docker-compose.yml
services:
  npm:
    image: jc21/nginx-proxy-manager:latest
    container_name: infra-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "81:81"
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
    networks:
      - shared-network

networks:
  shared-network:
    external: true
EOF
docker compose -f /opt/infra/proxy/docker-compose.yml up -d

echo "=== [5/6] Deploying Shared MySQL 8.0 & Redis ==="
if [ ! -f /opt/infra/database/.env ]; then
  MYSQL_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
  REDIS_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
  cat << EOF > /opt/infra/database/.env
MYSQL_ROOT_PASSWORD=${MYSQL_PASS}
REDIS_PASSWORD=${REDIS_PASS}
EOF
  chmod 600 /opt/infra/database/.env
fi

cat << 'EOF' > /opt/infra/database/docker-compose.yml
services:
  mysql:
    image: mysql:8.0
    container_name: shared-mysql
    restart: unless-stopped
    env_file: .env
    command: --binlog-expire-logs-seconds=259200 --default-authentication-plugin=mysql_native_password
    volumes:
      - ./data:/var/lib/mysql
      - ./init:/docker-entrypoint-initdb.d
    networks:
      - shared-network

  redis:
    image: redis:7-alpine
    container_name: shared-redis
    restart: unless-stopped
    env_file: .env
    command: ["sh", "-c", "redis-server --appendonly yes --requirepass \"$$REDIS_PASSWORD\""]
    networks:
      - shared-network

networks:
  shared-network:
    external: true
EOF
docker compose -f /opt/infra/database/docker-compose.yml up -d

echo "=== [6/6] Configuring Automated Backups & Maintenance ==="
cat << 'EOF' > /opt/ops/backups/db-backup.sh
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/opt/ops/backups/archives"
source /opt/infra/database/.env
docker exec shared-mysql mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --all-databases --single-transaction --quick --lock-tables=false | gzip > "$BACKUP_DIR/all_db_$TIMESTAMP.sql.gz"
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +7 -delete
EOF

cat << 'EOF' > /opt/ops/maintenance/docker-cleanup.sh
#!/bin/bash
docker image prune -af --filter "until=168h"
docker builder prune -af --filter "until=168h"
EOF

chmod +x /opt/ops/backups/db-backup.sh /opt/ops/maintenance/docker-cleanup.sh

(crontab -l 2>/dev/null | grep -v '/opt/ops/' || true; \
 echo "0 2 * * * /opt/ops/backups/db-backup.sh"; \
 echo "0 4 * * 0 /opt/ops/maintenance/docker-cleanup.sh") | crontab -

echo "=== PROVISIONING COMPLETE ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo "Generated Database Credentials:"
cat /opt/infra/database/.env
ENDSSH
```

---

## 4. Standard Operating Procedure: Deploying New Projects

Whenever deploying a new project (`<slug>`), follow this workflow:

### 4.1 Create an Isolated Database (If Required)
Never use `root` for application connections. Provision a dedicated database and user non-interactively:

```bash
ssh vps-prod 'bash -s' << 'ENDSSH'
source /opt/infra/database/.env
APP_DB="db_projectname"
APP_USER="user_projectname"
APP_PASS=$(openssl rand -base64 18 | tr -dc 'a-zA-Z0-9' | head -c 16)

docker exec -i shared-mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<SQL
CREATE DATABASE IF NOT EXISTS \`${APP_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${APP_USER}'@'%' IDENTIFIED BY '${APP_PASS}';
GRANT ALL PRIVILEGES ON \`${APP_DB}\`.* TO '${APP_USER}'@'%';
FLUSH PRIVILEGES;
SQL

echo "DB_HOST=shared-mysql"
echo "DB_PORT=3306"
echo "DB_DATABASE=${APP_DB}"
echo "DB_USERNAME=${APP_USER}"
echo "DB_PASSWORD=${APP_PASS}"
ENDSSH
```

### 4.2 Container Naming & Networking Rules
1. Create project directory `/opt/apps/<slug>/app`.
2. Container name MUST be `app-<slug>`.
3. Attach container to external network `shared-network`.
4. Do NOT bind host ports (`ports:`) in `docker-compose.yml`. Route traffic internally through `infra-proxy` using container name `app-<slug>` and its internal port (`3000` for Next.js, `80` for Vue/Nginx).

