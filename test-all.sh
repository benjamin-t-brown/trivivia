#!/bin/bash
set -e

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir"

./test.sh
./test-integration.sh

echo "All unit and integration tests passed."
