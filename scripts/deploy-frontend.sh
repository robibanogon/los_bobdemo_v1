#!/bin/bash

# Deploy Frontend to S3 and CloudFront
# Usage: ./deploy-frontend.sh [environment]
# Example: ./deploy-frontend.sh production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-dev}
DRY_RUN=${DRY_RUN:-false}

echo -e "${GREEN}=== Frontend Deployment Script ===${NC}"
echo "Environment: ${ENVIRONMENT}"
echo ""

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|production)$ ]]; then
    echo -e "${RED}Error: Invalid environment. Must be dev, staging, or production${NC}"
    exit 1
fi

# Navigate to frontend directory and run build-and-deploy script
cd "$(dirname "$0")/../frontend"

if [ ! -f "scripts/build-and-deploy.sh" ]; then
    echo -e "${RED}Error: Frontend build-and-deploy script not found${NC}"
    exit 1
fi

echo -e "${YELLOW}Running frontend build and deploy...${NC}"

if [ "$DRY_RUN" = "true" ]; then
    DRY_RUN=true ./scripts/build-and-deploy.sh ${ENVIRONMENT}
else
    ./scripts/build-and-deploy.sh ${ENVIRONMENT}
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Frontend deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}Frontend deployment completed successfully!${NC}"

# Made with Bob
