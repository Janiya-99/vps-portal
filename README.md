# PIXANDCO VPS Infrastructure & Control Portal

**Brand:** `PIXANDCO`  
**Host IP:** `172.255.210.203` (SSH alias: `vps-prod`)  
**Secure Domain:** [`https://vps.pixandco.lk`](https://vps.pixandco.lk) (Let's Encrypt SSL)  
**Portal Web URL:** [`http://172.255.210.203`](http://172.255.210.203)  
**phpMyAdmin Console:** [`http://172.255.210.203:8085`](http://172.255.210.203:8085)  
**NPM Admin Console:** [`http://172.255.210.203:81`](http://172.255.210.203:81)  

---

## 1. Quick Access Information

### PIXANDCO Control Portal
- **Primary Domain:** [`https://vps.pixandco.lk`](https://vps.pixandco.lk) (Auto HTTP -> HTTPS redirect)
- **Direct IP Fallback:** [`http://172.255.210.203`](http://172.255.210.203)
- **Username:** `admin`
- **Default Password:** Stored securely in `/opt/apps/vps-portal/.env.production` on the host (`chmod 600`)

### phpMyAdmin Web Console (Port 8085)
- **URL:** [`http://172.255.210.203:8085`](http://172.255.210.203:8085)
- **Server:** `shared-mysql` (Port `3306`)
- **Username:** `root`
- **Password:** Stored in `/opt/infra/database/.env` (`MYSQL_ROOT_PASSWORD`)

### Nginx Proxy Manager (Port 81)
- **URL:** [`http://172.255.210.203:81`](http://172.255.210.203:81)
- **Default User:** `admin@example.com`
- **Default Password:** `changeme` *(Prompted to change on first login)*

### Core Database & Cache Credentials
- Stored securely on server in `/opt/infra/database/.env` (`chmod 600`)
- `MYSQL_ROOT_PASSWORD`: `<Configured in /opt/infra/database/.env>`
- `REDIS_PASSWORD`: `<Configured in /opt/infra/database/.env>`

---

## 2. Portal Features & Tech Stack

- **Branding & UI Theme:** Obsidian pitch-black (`#050508`) with neon Charm Red (`#e11d48` / `#f43f5e`) glowing accents, symmetrical cards, live ping latency radar, and Singapore datacenter telemetry.
- **Backend:** Go 1.23+ with `chi` router, Docker SDK over `/var/run/docker.sock`, `gopsutil` host telemetry, MySQL & Redis clients, JWT authentication in `HttpOnly, SameSite=Strict` cookies.
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui (Radix primitives) + Lucide icons + Recharts + Sonner.
- **Architecture:** Embedded single Go binary (~20MB memory footprint) serving API and static assets directly from memory. Complete architecture details in [`SOFTWARE_ARCHITECTURE_AND_GUIDE.md`](./SOFTWARE_ARCHITECTURE_AND_GUIDE.md).
- **Modules:**
  1. **Overview & Metrics:** 4-card symmetrical KPI strip (CPU sparkline, RAM & 4GB Swap bar, 200GB SSD usage, Docker bridge stats) + Core Infra restart strip.
  2. **Apps & Containers:** Docker container list, start/stop/restart, live SSE log streaming terminal (`Sheet`), key-value `.env` editor (`Sheet`), and new app scaffolding wizard.
  3. **Databases & Cache:** 1-click isolated MySQL schema/user provisioner with copyable `.env` block, phpMyAdmin web console card, and Redis memory/keys/flush inspector.
  4. **Domains & Reverse Proxy:** Nginx Proxy Manager route overview and automated Let's Encrypt SSL certificate provisioning.
  5. **Backups & Operations:** Rolling 7-day MySQL `.sql.gz` backup manager with 1-click download/run, and Docker image/cache prune tool.

---

## 3. Deployment Directory Layout (`/opt`)

```
/opt/
├── infra/
│   ├── proxy/                      # Nginx Proxy Manager (Ports 80, 443, 81)
│   └── database/                   # Shared MySQL 8.0 & Redis 7 stacks + phpMyAdmin (8085)
├── apps/
│   └── vps-portal/                 # PIXANDCO Control Panel Stack (app-vps-portal:8080)
└── ops/
    ├── backups/                    # Daily automated mysqldump & 7-day .sql.gz archives
    └── maintenance/                # Weekly Docker builder & image pruning script
```
