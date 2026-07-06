#!/bin/bash
set -e

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"$script_dir/test.sh"
"$script_dir/test-integration.sh"

echo "All unit and integration tests passed."
