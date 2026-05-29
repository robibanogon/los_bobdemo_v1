#!/bin/bash

# Deploy Full Application (Backend + Frontend)
# Usage: ./deploy-all.sh [environment] [version]
# Example: ./deploy-all.sh production v1.0.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-dev}
VERSION=${2:-latest}
DRY_RUN=${DRY_RUN:-false}
SKIP_MIGRATIONS=${SKIP_MIGRATIONS:-false}
SKIP_BACKEND=${SKIP_BACKEND:-false}
SKIP_FRONTEND=${SKIP_FRONTEND:-false}

echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Full Application Deployment Script            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Environment: ${ENVIRONMENT}"
echo "Version: ${VERSION}"
echo "Dry Run: ${DRY_RUN}"
echo ""

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|production)$ ]]; then
    echo -e "${RED}Error: Invalid environment. Must be dev, staging, or production${NC}"
    exit 1
fi

# Confirmation for production
if [ "$ENVIRONMENT" = "production" ] && [ "$DRY_RUN" != "true" ]; then
    echo -e "${YELLOW}⚠️  WARNING: You are about to deploy to PRODUCTION${NC}"
    echo -e "${YELLOW}This will affect live users and services.${NC}"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo -e "${RED}Deployment cancelled${NC}"
        exit 1
    fi
fi

# Start deployment
START_TIME=$(date +%s)
echo -e "${BLUE}Starting deployment at $(date)${NC}"
echo ""

# Step 1: Run database migrations
if [ "$SKIP_MIGRATIONS" != "true" ]; then
    echo -e "${GREEN}═══ Step 1: Database Migrations ═══${NC}"
    
    if [ "$DRY_RUN" = "true" ]; then
        echo -e "${YELLOW}DRY RUN: Would run database migrations${NC}"
    else
        echo -e "${YELLOW}Running database migrations...${NC}"
        
        # Get database credentials from AWS Secrets Manager
        DB_SECRET=$(aws secretsmanager get-secret-value \
            --secret-id los/database \
            --query SecretString \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$DB_SECRET" ]; then
            DB_HOST=$(echo "$DB_SECRET" | jq -r '.host')
            DB_PORT=$(echo "$DB_SECRET" | jq -r '.port')
            DB_NAME=$(echo "$DB_SECRET" | jq -r '.dbname')
            DB_USER=$(echo "$DB_SECRET" | jq -r '.username')
            DB_PASSWORD=$(echo "$DB_SECRET" | jq -r '.password')
            
            # Run migrations
            cd "$(dirname "$0")/../backend"
            
            export DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD
            node migrations/run_migration.js
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓ Database migrations completed${NC}"
            else
                echo -e "${RED}✗ Database migrations failed${NC}"
                exit 1
            fi
            
            cd - > /dev/null
        else
            echo -e "${YELLOW}Warning: Could not retrieve database credentials. Skipping migrations.${NC}"
        fi
    fi
    echo ""
else
    echo -e "${YELLOW}Skipping database migrations (SKIP_MIGRATIONS=true)${NC}"
    echo ""
fi

# Step 2: Deploy backend
if [ "$SKIP_BACKEND" != "true" ]; then
    echo -e "${GREEN}═══ Step 2: Backend Deployment ═══${NC}"
    
    cd "$(dirname "$0")"
    
    if [ "$DRY_RUN" = "true" ]; then
        DRY_RUN=true ./deploy-backend.sh ${ENVIRONMENT} ${VERSION}
    else
        ./deploy-backend.sh ${ENVIRONMENT} ${VERSION}
    fi
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Backend deployment failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Backend deployment completed${NC}"
    echo ""
else
    echo -e "${YELLOW}Skipping backend deployment (SKIP_BACKEND=true)${NC}"
    echo ""
fi

# Step 3: Wait for backend to be healthy
if [ "$SKIP_BACKEND" != "true" ] && [ "$DRY_RUN" != "true" ]; then
    echo -e "${GREEN}═══ Step 3: Health Check ═══${NC}"
    echo -e "${YELLOW}Waiting for backend to be healthy...${NC}"
    
    # Get ALB URL
    ALB_DNS=$(aws elbv2 describe-load-balancers \
        --region ${AWS_REGION:-us-east-1} \
        --query "LoadBalancers[?contains(LoadBalancerName, 'los')].DNSName" \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$ALB_DNS" ]; then
        MAX_ATTEMPTS=30
        ATTEMPT=0
        
        while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://${ALB_DNS}/health || echo "000")
            
            if [ "$HTTP_CODE" = "200" ]; then
                echo -e "${GREEN}✓ Backend is healthy${NC}"
                break
            fi
            
            ATTEMPT=$((ATTEMPT + 1))
            echo -e "${YELLOW}Attempt ${ATTEMPT}/${MAX_ATTEMPTS}: Backend not ready yet (HTTP ${HTTP_CODE})${NC}"
            sleep 10
        done
        
        if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
            echo -e "${RED}✗ Backend health check failed after ${MAX_ATTEMPTS} attempts${NC}"
            echo -e "${YELLOW}Continuing with frontend deployment, but backend may not be fully operational${NC}"
        fi
    else
        echo -e "${YELLOW}Warning: Could not find load balancer. Skipping health check.${NC}"
    fi
    echo ""
fi

# Step 4: Deploy frontend
if [ "$SKIP_FRONTEND" != "true" ]; then
    echo -e "${GREEN}═══ Step 4: Frontend Deployment ═══${NC}"
    
    cd "$(dirname "$0")"
    
    if [ "$DRY_RUN" = "true" ]; then
        DRY_RUN=true ./deploy-frontend.sh ${ENVIRONMENT}
    else
        ./deploy-frontend.sh ${ENVIRONMENT}
    fi
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Frontend deployment failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Frontend deployment completed${NC}"
    echo ""
else
    echo -e "${YELLOW}Skipping frontend deployment (SKIP_FRONTEND=true)${NC}"
    echo ""
fi

# Calculate deployment time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

# Final summary
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            Deployment Summary                          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Environment: ${ENVIRONMENT}"
echo "Version: ${VERSION}"
echo "Duration: ${MINUTES}m ${SECONDS}s"
echo ""

if [ "$DRY_RUN" = "true" ]; then
    echo -e "${YELLOW}DRY RUN completed. No changes were made.${NC}"
else
    echo -e "${GREEN}✓ Full deployment completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Deployment Steps Completed:${NC}"
    [ "$SKIP_MIGRATIONS" != "true" ] && echo "  ✓ Database migrations"
    [ "$SKIP_BACKEND" != "true" ] && echo "  ✓ Backend deployment"
    [ "$SKIP_FRONTEND" != "true" ] && echo "  ✓ Frontend deployment"
    echo ""
    
    # Get application URLs
    echo -e "${BLUE}Application URLs:${NC}"
    
    # Backend URL
    ALB_DNS=$(aws elbv2 describe-load-balancers \
        --region ${AWS_REGION:-us-east-1} \
        --query "LoadBalancers[?contains(LoadBalancerName, 'los')].DNSName" \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$ALB_DNS" ]; then
        echo "  Backend API: http://${ALB_DNS}"
    fi
    
    # Frontend URL
    CLOUDFRONT_DOMAIN=$(aws cloudfront list-distributions \
        --query "DistributionList.Items[?contains(Comment, 'los-frontend')].DomainName" \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$CLOUDFRONT_DOMAIN" ]; then
        echo "  Frontend: https://${CLOUDFRONT_DOMAIN}"
    fi
    
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "  1. Verify application functionality"
    echo "  2. Monitor CloudWatch logs for errors"
    echo "  3. Check application metrics"
    echo "  4. Perform smoke tests"
    echo ""
    echo -e "${BLUE}Monitoring Commands:${NC}"
    echo "  Backend logs:  aws logs tail /ecs/los-backend --follow"
    echo "  ECS service:   aws ecs describe-services --cluster los-cluster --services los-backend"
    echo ""
    echo -e "${BLUE}Rollback (if needed):${NC}"
    echo "  ./scripts/rollback-backend.sh ${ENVIRONMENT}"
fi

# Made with Bob
