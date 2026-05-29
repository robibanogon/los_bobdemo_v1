#!/bin/bash

# Build and Push Docker Image to Amazon ECR
# Usage: ./build-and-push.sh [environment] [version]
# Example: ./build-and-push.sh production v1.0.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-dev}
VERSION=${2:-latest}
DRY_RUN=${DRY_RUN:-false}

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
ECR_REPOSITORY=${ECR_REPOSITORY:-los-backend}
IMAGE_NAME="${ECR_REPOSITORY}"

echo -e "${GREEN}=== Docker Build and Push Script ===${NC}"
echo "Environment: ${ENVIRONMENT}"
echo "Version: ${VERSION}"
echo "AWS Region: ${AWS_REGION}"
echo "ECR Repository: ${ECR_REPOSITORY}"
echo ""

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|production)$ ]]; then
    echo -e "${RED}Error: Invalid environment. Must be dev, staging, or production${NC}"
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Error: Docker is not running${NC}"
    exit 1
fi

# Get AWS account ID
echo -e "${YELLOW}Getting AWS account ID...${NC}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}Error: Failed to get AWS account ID${NC}"
    exit 1
fi
echo -e "${GREEN}AWS Account ID: ${AWS_ACCOUNT_ID}${NC}"

# Construct ECR URI
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}"

# Login to ECR
echo -e "${YELLOW}Logging in to Amazon ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to login to ECR${NC}"
    exit 1
fi
echo -e "${GREEN}Successfully logged in to ECR${NC}"

# Create ECR repository if it doesn't exist
echo -e "${YELLOW}Checking if ECR repository exists...${NC}"
if ! aws ecr describe-repositories --repository-names ${ECR_REPOSITORY} --region ${AWS_REGION} &> /dev/null; then
    echo -e "${YELLOW}Creating ECR repository...${NC}"
    aws ecr create-repository \
        --repository-name ${ECR_REPOSITORY} \
        --region ${AWS_REGION} \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256
    echo -e "${GREEN}ECR repository created${NC}"
else
    echo -e "${GREEN}ECR repository already exists${NC}"
fi

# Build Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
cd "$(dirname "$0")/.."

if [ "$DRY_RUN" = "true" ]; then
    echo -e "${YELLOW}DRY RUN: Would build image with tags:${NC}"
    echo "  - ${ECR_URI}:${VERSION}"
    echo "  - ${ECR_URI}:${ENVIRONMENT}-latest"
    echo "  - ${ECR_URI}:latest"
else
    docker build \
        --platform linux/amd64 \
        --build-arg NODE_ENV=production \
        --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
        --build-arg VERSION=${VERSION} \
        --tag ${ECR_URI}:${VERSION} \
        --tag ${ECR_URI}:${ENVIRONMENT}-latest \
        --tag ${ECR_URI}:latest \
        -f Dockerfile \
        .

    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Docker build failed${NC}"
        exit 1
    fi
    echo -e "${GREEN}Docker image built successfully${NC}"
fi

# Push to ECR
echo -e "${YELLOW}Pushing Docker image to ECR...${NC}"

if [ "$DRY_RUN" = "true" ]; then
    echo -e "${YELLOW}DRY RUN: Would push images to ECR${NC}"
else
    # Push version tag
    docker push ${ECR_URI}:${VERSION}
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to push version tag${NC}"
        exit 1
    fi

    # Push environment-latest tag
    docker push ${ECR_URI}:${ENVIRONMENT}-latest
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to push environment-latest tag${NC}"
        exit 1
    fi

    # Push latest tag (only for production)
    if [ "$ENVIRONMENT" = "production" ]; then
        docker push ${ECR_URI}:latest
        if [ $? -ne 0 ]; then
            echo -e "${RED}Error: Failed to push latest tag${NC}"
            exit 1
        fi
    fi

    echo -e "${GREEN}Docker images pushed successfully${NC}"
fi

# Get image digest
if [ "$DRY_RUN" != "true" ]; then
    IMAGE_DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' ${ECR_URI}:${VERSION} 2>/dev/null || echo "N/A")
    echo -e "${GREEN}Image Digest: ${IMAGE_DIGEST}${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}=== Build and Push Complete ===${NC}"
echo "Repository: ${ECR_URI}"
echo "Tags pushed:"
echo "  - ${VERSION}"
echo "  - ${ENVIRONMENT}-latest"
if [ "$ENVIRONMENT" = "production" ]; then
    echo "  - latest"
fi
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Update ECS task definition with new image"
echo "2. Deploy to ECS cluster"
echo "3. Monitor deployment status"
echo ""
echo "To deploy, run:"
echo "  ./scripts/deploy-backend.sh ${ENVIRONMENT} ${VERSION}"

# Made with Bob
