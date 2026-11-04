# PIXANDCO VPS Control Portal

PIXANDCO VPS Control Portal is a lightweight, single-binary infrastructure control nexus designed for VPS management, container orchestration, database provisioning, and host telemetry. Built with a high-performance Go 1.23 backend and a modern React 19 cybernetic interface (Black & Charm Red), it provides an all-in-one administration panel with zero third-party agent dependencies.

---

## 1. System Architecture

### Architectural Topology

```
+-------------------------------------------------------------------------+
|                              CLIENT BROWSER                             |
|         (React 19 + TypeScript + Tailwind CSS + Lucide + SSE)           |
+-------------------------------------------------------------------------+
                                    |
                            HTTPS / WSS (TLS)
                                    |
                                    v
+-------------------------------------------------------------------------+
|                    INVERSE PROXY / INGRESS LAYER                        |
|                     (Nginx Reverse Proxy & Certbot)                     |
|                   Public Ports: 80 (HTTP) / 443 (HTTPS)                 |
+-------------------------------------------------------------------------+
                                    |
                             Reverse Proxy
                                    |
                                    v
+-------------------------------------------------------------------------+
|                      PIXANDCO BACKEND CONTROL DAEMON                    |
|                (Go 1.23 + Chi Router + Static Asset Embed)              |
|                                                                         |
|  - JWT Session Auth (HttpOnly Cookies)   - gopsutil Telemetry Engine    |
|  - Docker Engine SDK Client              - Database Provisioning Engine |
|  - Real-time SSE Stream Hub              - Automated Backup Manager     |
+-------------------------------------------------------------------------+
         |                                                 |
         | Unix Domain Socket (/var/run/docker.sock)       | Internal Bridge Network
         v                                                 v
+---------------------+    +----------------------------------------------+
|    DOCKER ENGINE    |    |      INTERNAL ISOLATED DOCKER NETWORK        |
|                     |    |             ("shared-network")               |
| - Container Lifecycle|   |                                              |
| - Live Log Streams  |    |  +--------------------+ +-----------------+  |
| - Image & Prune Ops |    |  |  Shared MySQL 8.0  | |  Shared Redis 7 |  |
| - Container Metrics |    |  |   (Port 3306 int)  | | (Port 6379 int) |  |
+---------------------+    |  +--------------------+ +-----------------+  |
                           |  +--------------------+                      |
                           |  |  phpMyAdmin Web    |                      |
                           |  |  (Database GUI)    |                      |
                           |  +--------------------+                      |
                           +----------------------------------------------+
```

### Network & Security Isolation Model

* **Public Ingress Layer:** Only port 80 (HTTP redirect) and port 443 (HTTPS) are open to the public internet, fronted with Let's Encrypt TLS encryption.
* **Internal Bridge Network (`shared-network`):** Database services (MySQL 8.0) and cache stores (Redis 7) have no host port bindings on `0.0.0.0` and communicate exclusively across the private Docker bridge network.
* **Socket Isolation:** The control daemon communicates directly with the Docker daemon via the local `/var/run/docker.sock` UNIX domain socket without exposing the Docker daemon to TCP.
* **Single Binary Deployment:** The entire compiled React frontend is embedded directly into the Go binary (`embed.FS`), running in a unified ~20MB container footprint.

### Filesystem & Deployment Layout

```
/opt/
├── infra/
│   ├── proxy/                      # Nginx reverse proxy configuration & SSL certs
│   └── database/                   # Multi-tenant MySQL 8.0 and Redis 7 storage volumes
├── apps/
│   └── vps-portal/                 # Portal daemon stack & environment definitions
└── ops/
    ├── backups/                    # Daily automated mysqldump .sql.gz rolling archives
    └── maintenance/                # Builder cache and container prune automation
```

---

## 2. Functions & Capabilities

### 1. Host Telemetry & Infrastructure Monitoring
* **Real-time CPU Telemetry:** Multi-core usage percentage, AMD EPYC load averages (1m, 5m, 15m), and live historical sparkline visualization.
* **Memory & Swap Utilization:** Real-time RAM allocation monitoring, used vs. available memory bytes, and dedicated 4GB swap memory tracking.
* **Disk Capacity & Free Space:** Primary root filesystem (`/`) capacity tracking, used space percentage, and free gigabyte metrics.
* **Docker Network Health:** Live container count (active vs. total) and bridge network status verification.
* **Ping Latency Radar:** Real-time round-trip latency calculated over Server-Sent Events (SSE) displayed in milliseconds with color-coded performance thresholds.
* **Geographical Server Identification:** Automatic detection and display of datacenter region, carrier ASN, city, country, and timezone.

### 2. Application & Container Orchestration
* **Container Lifecycle Management:** View, inspect, start, stop, and restart any container running on the host.
* **Live Log Streaming Terminal:** Real-time container stdout/stderr log streaming with customizable tail lines via SSE.
* **In-Portal Environment Configuration:** View and edit `.env.production` files for managed applications directly through an interactive slide-over editor.
* **App Scaffolding Wizard:** Guided workflow to scaffold and deploy new containerized applications on the host filesystem.
* **Container Search & Filtering:** Fast client-side filtering across containers by name, image, state, and exposed ports.

### 3. Database Administration & Cache Management
* **Automated MySQL Provisioning:** One-click creation of isolated MySQL databases with unique credentials, dedicated database users, and restricted grants.
* **Instant Connection Strings:** Copy-ready connection environment blocks (`DATABASE_URL`, individual connection variables) for instant app configuration.
* **Integrated phpMyAdmin Interface:** Dedicated graphical web administration for full database queries, schema design, table management, and SQL execution.
* **Redis Cache Telemetry:** Live stats on connected clients, total keys, memory usage footprint, operations per second, and uptime.
* **On-Demand Cache Flush:** Fast manual clearing of Redis cache keys with confirmation safeguards.

### 4. Domain & Reverse Proxy Routing
* **Proxy Route Management:** Overview of reverse proxy routes mapping external hostnames to internal container ports.
* **Automated Let's Encrypt SSL:** SSL/TLS certificate request, verification, and automated renewal management.
* **HTTP to HTTPS Redirection:** Automatic enforcement of modern TLS encryption across all incoming traffic.

### 5. Automated Backups & Host Maintenance
* **Daily MySQL Automated Backups:** Scheduled automated backups generating compressed `.sql.gz` archives with timestamping.
* **Rolling Archive Retention:** Automatic retention management keeping a clean rolling history of daily archives while cleaning expired backups.
* **Manual Backup Execution:** One-click trigger to generate an immediate database backup archive.
* **Direct Archive Download:** In-portal listing of available backup files with size details and direct download capability.
* **Docker System Prune:** One-click cleanup of unused Docker builder caches, dangling images, and stopped containers to free up SSD space.

### 6. Security & Access Control
* **Cookie-Based JWT Authentication:** Stateless JSON Web Token authentication stored in secure `HttpOnly`, `SameSite=Strict` cookies to mitigate XSS risks.
* **Uncomplicated Firewall (UFW) Integration:** Continuous tracking and status verification of active host firewall rules.
* **Secret Protection:** Strict `.gitignore` rules preventing `.env` configurations, SSL keys, passwords, and database dumps from being committed.
* **Command Palette (Cmd+K / Ctrl+K):** Keyboard-driven universal navigation palette for rapid access to metrics, apps, databases, backups, and maintenance tasks.

---

## 3. Technology Stack

* **Backend:** Go 1.23, Chi Router, Docker Go SDK, gopsutil, Go-MySQL-Driver, Go-Redis, Golang-JWT.
* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI Primitives, Lucide Icons, Recharts, Sonner.
* **Infrastructure Services:** Docker Engine, Nginx Proxy Manager, MySQL 8.0, Redis 7 Alpine, phpMyAdmin.
