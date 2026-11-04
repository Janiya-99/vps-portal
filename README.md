# VPS Infrastructure & Control Portal ("VPS Nexus")

**Host IP:** `172.255.210.203` (SSH alias: `vps-prod`)  
**Portal Web URL:** [`http://172.255.210.203`](http://172.255.210.203)  
**NPM Admin Console:** [`http://172.255.210.203:81`](http://172.255.210.203:81)  

---

## 1. Quick Access Credentials

### VPS Nexus Control Portal
- **URL:** [`http://172.255.210.203`](http://172.255.210.203)
- **Username:** `admin`
- **Default Password:** `NexusVps2026!` *(Configurable in `/opt/apps/vps-portal/.env.production`)*

### Nginx Proxy Manager (Port 81)
- **URL:** [`http://172.255.210.203:81`](http://172.255.210.203:81)
- **Default User:** `admin@example.com`
- **Default Password:** `changeme`

### Core Database & Cache Credentials
- Stored on server at `/opt/infra/database/.env` (`chmod 600`)
- `MYSQL_ROOT_PASSWORD`: `7axxwAI6Ru2aDBXQoOnAdTxV`
- `REDIS_PASSWORD`: `fxYQHrUaFl9C90MG2A0BNpfM`

---

## 2. Portal Features & Tech Stack

- **Backend:** Go 1.23+ with `chi` router, Docker SDK over `/var/run/docker.sock`, `gopsutil` host telemetry, MySQL & Redis clients, JWT authentication in `HttpOnly, SameSite=Strict` cookies.
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui (Radix primitives) + Lucide icons + Recharts + Sonner.
- **Architecture:** Embedded single Go binary (~20MB memory footprint) serving API and static assets directly from memory.
- **Modules:**
  1. **Overview & Metrics:** 4-card symmetrical KPI strip (CPU sparkline, RAM & 4GB Swap bar, 200GB SSD usage, Docker bridge stats) + Core Infra restart strip.
  2. **Apps & Containers:** Docker container list, start/stop/restart, live SSE log streaming terminal (`Sheet`), key-value `.env` editor (`Sheet`), and new app scaffolding wizard.
  3. **Databases & Cache:** 1-click isolated MySQL schema/user provisioner with copyable `.env` block, and Redis memory/keys/flush inspector.
  4. **Domains & Reverse Proxy:** Nginx Proxy Manager route overview and automated Let's Encrypt SSL certificate provisioning.
  5. **Backups & Operations:** Rolling 7-day MySQL `.sql.gz` backup manager with 1-click download/run, and Docker image/cache prune tool.

---

## 3. Deployment Directory Layout (`/opt`)

```
/opt/
├── infra/
│   ├── proxy/                      # Nginx Proxy Manager (Ports 80, 443, 81)
│   └── database/                   # Shared MySQL 8.0 & Redis 7 stacks
├── apps/
│   └── vps-portal/                 # VPS Nexus Control Panel Stack (app-vps-portal:8080)
└── ops/
    ├── backups/                    # Daily automated mysqldump & 7-day .sql.gz archives
    └── maintenance/                # Weekly Docker builder & image pruning script
```
