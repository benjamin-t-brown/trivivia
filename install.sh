#!/bin/bash
set -e

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir"

yarn() {
  node .yarn/releases/yarn-4.17.0.cjs "$@"
}

# Print native build output to the terminal instead of hiding it in temp logs.
export YARN_ENABLE_INLINE_BUILDS=true

echo "Installing dependencies..."
yarn install --inline-builds

echo "Building native dependencies..."
yarn rebuild sqlite3 esbuild
