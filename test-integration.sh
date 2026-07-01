#!/bin/bash
set -e

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir"

echo "Running integration tests..."
cd integration
yarn test:prod

echo "Integration tests passed."
