#!/bin/bash
set -e

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
cd "$repo_root"

DB_PATH="${DB_PATH:-db/prod.sqlite}"
BACKUP_DIR="${BACKUP_DIR:-db/backups}"

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <backup-file>" >&2
  echo "Copies a backup into local ${DB_PATH} for development (does not change the remote server)." >&2
  exit 1
fi

backup_path="$1"

if [ ! -f "$backup_path" ]; then
  echo "Backup not found: $backup_path" >&2
  exit 1
fi

mkdir -p "$(dirname "$DB_PATH")"

if [ -f "$DB_PATH" ]; then
  timestamp="$(date +"%Y-%m-%d-%H%M%S")"
  safety_backup="${BACKUP_DIR}/prod-local-previous-${timestamp}.sqlite"
  mkdir -p "$BACKUP_DIR"
  cp "$DB_PATH" "$safety_backup"
  echo "Saved previous local database to ${safety_backup}"
fi

cp "$backup_path" "$DB_PATH"

echo "Using ${backup_path} as local ${DB_PATH}"
