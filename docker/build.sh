#!/bin/bash

set -e

# Verify .env
if [ ! -f .env ]; then
    echo "ERROR: File .env not found. Please create it from .env.example"
    exit 1
fi

# Load enviroment variables
source .env

# Verify DOCKER_USERNAME
if [ -z "$DOCKER_USERNAME" ]; then
    echo "ERROR: DOCKER_USERNAME is not set in .env file"
    exit 1
fi

# Version
VERSION=${1:-dev}

echo "Building Apartments Application Docker Image"
echo "Docker Username: $DOCKER_USERNAME"
echo "Version: $VERSION"
echo ""

# Verify Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running. Please start Docker Desktop."
    exit 1
fi

cd ..

echo "Building Docker image..."
docker build \
    -t ${DOCKER_USERNAME}/apartments-app:${VERSION} \
    -t ${DOCKER_USERNAME}/apartments-app:latest \
    -f docker/Dockerfile \
    .

echo "Build completed successfully!"
echo ""
echo "Image created:"
echo "  - ${DOCKER_USERNAME}/apartments-app:${VERSION}"
echo "  - ${DOCKER_USERNAME}/apartments-app:latest"
echo ""

# Show image size
docker images ${DOCKER_USERNAME}/apartments-app:${VERSION} --format "Size: {{.Size}}"
echo ""

echo "Pushing to DockerHub..."
docker push ${DOCKER_USERNAME}/apartments-app:${VERSION}
    
if [ "$VERSION" != "latest" ]; then
    docker push ${DOCKER_USERNAME}/apartments-app:latest
fi
    
echo "Images pushed successfully!"
echo ""
echo "You can now pull the image with:"
echo "  docker pull ${DOCKER_USERNAME}/apartments-app:${VERSION}"

cd docker