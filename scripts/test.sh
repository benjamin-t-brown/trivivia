#!/bin/bash
set -e

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
cd "$repo_root"

echo "Running server tests..."
cd server
yarn test:prod

echo "Running client tests..."
cd ../client
yarn test:prod

echo "All tests passed."
