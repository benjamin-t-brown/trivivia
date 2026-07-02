#!/bin/bash
set -e

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir"

echo "Running server tests..."
cd server
yarn test:prod

echo "Running client tests..."
cd ../client
yarn test:prod

echo "All tests passed."
