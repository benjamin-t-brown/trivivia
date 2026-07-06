#!/bin/bash
set -e

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
cd "$repo_root"

IMAGE_NAME="${IMAGE_NAME:-revirtualis/trivivia}"
ECR_REGISTRY="${ECR_REGISTRY:-442979135069.dkr.ecr.us-east-1.amazonaws.com}"
ECR_IMAGE="${ECR_IMAGE:-${ECR_REGISTRY}/revirtualis/trivivia:latest}"
AWS_REGION="${AWS_REGION:-us-east-1}"

"$script_dir/build.sh"

echo "Building docker image..."
docker build -t "${IMAGE_NAME}:latest" .

echo "Tagging image for ECR..."
docker tag "${IMAGE_NAME}:latest" "${ECR_IMAGE}"

echo "Logging in to ECR..."
aws ecr get-login-password --region "${AWS_REGION}" \
  | docker login --username AWS --password-stdin "${ECR_REGISTRY}"

echo "Pushing image to ECR..."
docker push "${ECR_IMAGE}"

echo "Build and deploy complete. Image pushed to ${ECR_IMAGE}"
