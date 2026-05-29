#!/bin/bash

# Build and Deploy Frontend to S3 and CloudFront
# Usage: ./build-and-deploy.sh [environment]
# Example: ./build-and-deploy.sh production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-dev}
DRY_RUN=${DRY_RUN:-false}

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}

echo -e "${GREEN}=== Frontend Build and Deploy Script ===${NC}"
echo "Environment: ${ENVIRONMENT}"
echo "AWS Region: ${AWS_REGION}"
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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

# Get S3 bucket name and CloudFront distribution ID from environment or AWS
echo -e "${YELLOW}Getting deployment configuration...${NC}"

if [ -z "$S3_BUCKET" ]; then
    # Try to get from Terraform outputs
    S3_BUCKET=$(cd ../../terraform && terraform output -raw frontend_bucket_name 2>/dev/null || echo "")
    
    if [ -z "$S3_BUCKET" ]; then
        echo -e "${RED}Error: S3_BUCKET not set. Please set S3_BUCKET environment variable${NC}"
        echo "Example: export S3_BUCKET=los-frontend-production"
        exit 1
    fi
fi

if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    # Try to get from Terraform outputs
    CLOUDFRONT_DISTRIBUTION_ID=$(cd ../../terraform && terraform output -raw cloudfront_distribution_id 2>/dev/null || echo "")
    
    if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
        echo -e "${YELLOW}Warning: CLOUDFRONT_DISTRIBUTION_ID not set. CloudFront cache will not be invalidated${NC}"
    fi
fi

echo "S3 Bucket: ${S3_BUCKET}"
echo "CloudFront Distribution: ${CLOUDFRONT_DISTRIBUTION_ID:-N/A}"
echo ""

# Set API URL based on environment
case $ENVIRONMENT in
    production)
        API_URL=${API_URL:-"https://api.los.example.com"}
        ;;
    staging)
        API_URL=${API_URL:-"https://api-staging.los.example.com"}
        ;;
    dev)
        API_URL=${API_URL:-"https://api-dev.los.example.com"}
        ;;
esac

echo "API URL: ${API_URL}"
echo ""

# Navigate to frontend directory
cd "$(dirname "$0")/.."

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm ci

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}Dependencies installed${NC}"

# Create .env.production file
echo -e "${YELLOW}Creating production environment file...${NC}"
cat > .env.production << EOF
VITE_API_URL=${API_URL}
VITE_ENVIRONMENT=${ENVIRONMENT}
EOF

# Build the application
echo -e "${YELLOW}Building frontend application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}Build completed successfully${NC}"

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo -e "${RED}Error: dist directory not found${NC}"
    exit 1
fi

# Sync to S3
echo -e "${YELLOW}Deploying to S3...${NC}"

if [ "$DRY_RUN" = "true" ]; then
    echo -e "${YELLOW}DRY RUN: Would sync to s3://${S3_BUCKET}${NC}"
    aws s3 sync dist/ s3://${S3_BUCKET}/ --dryrun --delete
else
    # Sync files with appropriate cache headers
    aws s3 sync dist/ s3://${S3_BUCKET}/ \
        --delete \
        --cache-control "public, max-age=31536000, immutable" \
        --exclude "index.html" \
        --exclude "*.html"
    
    # Upload HTML files with no-cache
    aws s3 sync dist/ s3://${S3_BUCKET}/ \
        --exclude "*" \
        --include "*.html" \
        --cache-control "no-cache, no-store, must-revalidate"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to sync to S3${NC}"
        exit 1
    fi
    echo -e "${GREEN}Successfully deployed to S3${NC}"
fi

# Invalidate CloudFront cache
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo -e "${YELLOW}Invalidating CloudFront cache...${NC}"
    
    if [ "$DRY_RUN" = "true" ]; then
        echo -e "${YELLOW}DRY RUN: Would invalidate CloudFront distribution ${CLOUDFRONT_DISTRIBUTION_ID}${NC}"
    else
        INVALIDATION_ID=$(aws cloudfront create-invalidation \
            --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} \
            --paths "/*" \
            --query 'Invalidation.Id' \
            --output text)
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}Error: Failed to create CloudFront invalidation${NC}"
            exit 1
        fi
        
        echo -e "${GREEN}CloudFront invalidation created: ${INVALIDATION_ID}${NC}"
        echo -e "${YELLOW}Waiting for invalidation to complete...${NC}"
        
        aws cloudfront wait invalidation-completed \
            --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} \
            --id ${INVALIDATION_ID}
        
        echo -e "${GREEN}CloudFront cache invalidated${NC}"
    fi
fi

# Get CloudFront URL
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ] && [ "$DRY_RUN" != "true" ]; then
    CLOUDFRONT_URL=$(aws cloudfront get-distribution \
        --id ${CLOUDFRONT_DISTRIBUTION_ID} \
        --query 'Distribution.DomainName' \
        --output text)
    
    if [ -n "$CLOUDFRONT_URL" ]; then
        echo ""
        echo -e "${GREEN}Frontend URL: https://${CLOUDFRONT_URL}${NC}"
    fi
fi

# Summary
echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo "Environment: ${ENVIRONMENT}"
echo "S3 Bucket: ${S3_BUCKET}"
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo "CloudFront Distribution: ${CLOUDFRONT_DISTRIBUTION_ID}"
fi
echo ""
echo -e "${GREEN}Frontend deployed successfully!${NC}"

# Made with Bob
