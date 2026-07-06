#!/bin/bash
set -e

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
cd "$repo_root"

SSH_HOST="${SSH_HOST:-54.235.23.2}"
SSH_USER="${SSH_USER:-admin}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_rsa}"
REMOTE_DB_PATH="${REMOTE_DB_PATH:-/home/admin/trivivia/db/prod.sqlite}"
BACKUP_DIR="${BACKUP_DIR:-db/backups}"

if [ -n "${1:-}" ]; then
  backup_path="$1"
else
  mkdir -p "$BACKUP_DIR"
  timestamp="$(date +"%Y-%m-%d-%H%M%S")"
  backup_path="${BACKUP_DIR}/prod-${timestamp}.sqlite"
fi

mkdir -p "$(dirname "$backup_path")"

scp_args=()
if [ -f "$SSH_KEY" ]; then
  scp_args=(-i "$SSH_KEY")
fi

echo "Downloading ${SSH_USER}@${SSH_HOST}:${REMOTE_DB_PATH}..."
scp "${scp_args[@]}" "${SSH_USER}@${SSH_HOST}:${REMOTE_DB_PATH}" "$backup_path"

echo "Backed up to ${backup_path}"
