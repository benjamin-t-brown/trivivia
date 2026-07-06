#!/bin/bash
set -e

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
cd "$repo_root"

IMAGE_NAME="${INTEGRATION_IMAGE:-revirtualis/trivivia:latest}"

echo "Building docker image for integration tests..."
docker build -t "${IMAGE_NAME}" .

echo "Running integration tests against docker container..."
export INTEGRATION_DOCKER=true
export INTEGRATION_IMAGE="${IMAGE_NAME}"

cd integration
yarn test:prod

echo "Docker integration tests passed."
