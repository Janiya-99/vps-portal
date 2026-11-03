# VPS Infrastructure & Deployment Portal (`vps-portal`)

Target Host: `172.255.210.203` (SSH alias: `vps-prod`)

## Repository Overview
- `GUIDELINES.md`: Infrastructure guidelines, execution constraints, directory standards, bootstrap playbook, and project deployment SOP.
- `scripts/setup-ssh-key.py`: Generates/configures local SSH key, sets up `vps-prod` in `~/.ssh/config`, and installs the public key on the remote VPS for passwordless access.
- `scripts/bootstrap.sh`: Remote execution script for full VPS bootstrapping (swap, UFW, Docker, NPM proxy, MySQL 8.0, Redis 7, automated daily backups & weekly maintenance).
- `scripts/provision-db.sh`: Non-interactive CLI helper to provision an isolated MySQL database and user per project.
- `scripts/deploy-app.sh`: Scaffolding helper for new application stacks in `/opt/apps/<slug>`.

## Quick Start
1. **Set up SSH key & alias:**
   ```bash
   python3 scripts/setup-ssh-key.py
   ```
2. **Bootstrap the VPS:**
   ```bash
   ./scripts/bootstrap.sh
   ```
3. **Provision a new project database:**
   ```bash
   ./scripts/provision-db.sh <project-slug>
   ```

