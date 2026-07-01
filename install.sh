#!/bin/bash
set -e

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir"

yarn() {
  node .yarn/releases/yarn-4.17.0.cjs "$@"
}

echo "Installing dependencies..."
yarn install

echo "Building native dependencies..."
yarn rebuild sqlite3 esbuild
