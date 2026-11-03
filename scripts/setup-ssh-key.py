#!/usr/bin/env python3
"""
Sets up an SSH key and copies it to the target VPS using pexpect,
then configures ~/.ssh/config with the 'vps-prod' alias.
"""

import os
import subprocess
import sys
import pexpect

HOST_IP = "172.255.210.203"
SSH_USER = "root"
SSH_PASS = "z7kqGw9EQFK49wjA"
ALIAS = "vps-prod"

home = os.path.expanduser("~")
ssh_dir = os.path.join(home, ".ssh")
os.makedirs(ssh_dir, mode=0o700, exist_ok=True)

key_path = os.path.join(ssh_dir, "id_ed25519")
pub_key_path = key_path + ".pub"

# 1. Generate SSH key if not present
if not os.path.exists(pub_key_path):
    print("Generating new ed25519 SSH key...")
    subprocess.run(["ssh-keygen", "-t", "ed25519", "-N", "", "-f", key_path], check=True)
else:
    print(f"Using existing SSH key: {pub_key_path}")

with open(pub_key_path, "r") as f:
    pub_key_content = f.read().strip()

# 2. Configure ~/.ssh/config
config_path = os.path.join(ssh_dir, "config")
alias_block = f"""
Host {ALIAS}
    HostName {HOST_IP}
    User {SSH_USER}
    IdentityFile {key_path}
    StrictHostKeyChecking accept-new
"""

existing_config = ""
if os.path.exists(config_path):
    with open(config_path, "r") as f:
        existing_config = f.read()

if f"Host {ALIAS}" not in existing_config:
    print(f"Adding '{ALIAS}' alias to {config_path}...")
    with open(config_path, "a") as f:
        f.write(alias_block)
    os.chmod(config_path, 0o600)
else:
    print(f"'{ALIAS}' already defined in {config_path}")

# 3. Copy key to remote server via pexpect
print(f"Connecting to {SSH_USER}@{HOST_IP} to install public key...")
cmd = f"ssh -o StrictHostKeyChecking=accept-new {SSH_USER}@{HOST_IP} 'mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo \"{pub_key_content}\" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'"

child = pexpect.spawn(cmd, encoding="utf-8", timeout=30)
try:
    index = child.expect([
        r"password:",
        r"Password:",
        r"Are you sure you want to continue connecting",
        pexpect.EOF,
        pexpect.TIMEOUT
    ])
    if index == 2:
        child.sendline("yes")
        child.expect([r"password:", r"Password:"])
        child.sendline(SSH_PASS)
    elif index in (0, 1):
        child.sendline(SSH_PASS)

    child.expect(pexpect.EOF)
    print("Public key copied successfully!")
except Exception as e:
    print(f"Error transferring SSH key: {e}")
    sys.exit(1)

# 4. Verify passwordless access
print(f"Verifying passwordless SSH access to {ALIAS}...")
res = subprocess.run(["ssh", "-o", "BatchMode=yes", ALIAS, "echo 'Connection successful'"], capture_output=True, text=True)
if res.returncode == 0:
    print("Verification succeeded! Passwordless SSH is ready.")
else:
    print("Verification failed:", res.stderr)
    sys.exit(1)
