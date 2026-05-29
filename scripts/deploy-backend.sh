#!/bin/bash

# Deploy Backend to ECS
# Usage: ./deploy-backend.sh [environment] [version]
# Example: ./deploy-backend.sh production v1.0.0

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
SKIP_BUILD=${SKIP_BUILD:-false}

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
ECS_CLUSTER=${ECS_CLUSTER:-los-cluster}
ECS_SERVICE=${ECS_SERVICE:-los-backend}
TASK_FAMILY=${TASK_FAMILY:-los-backend}

echo -e "${GREEN}=== Backend Deployment Script ===${NC}"
echo "Environment: ${ENVIRONMENT}"
echo "Version: ${VERSION}"
echo "AWS Region: ${AWS_REGION}"
echo "ECS Cluster: ${ECS_CLUSTER}"
echo "ECS Service: ${ECS_SERVICE}"
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

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed. Please install jq to continue.${NC}"
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

# Build and push Docker image if not skipped
if [ "$SKIP_BUILD" != "true" ]; then
    echo -e "${YELLOW}Building and pushing Docker image...${NC}"
    cd "$(dirname "$0")/../backend"
    
    if [ "$DRY_RUN" = "true" ]; then
        DRY_RUN=true ./scripts/build-and-push.sh ${ENVIRONMENT} ${VERSION}
    else
        ./scripts/build-and-push.sh ${ENVIRONMENT} ${VERSION}
    fi
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to build and push Docker image${NC}"
        exit 1
    fi
    
    cd - > /dev/null
else
    echo -e "${YELLOW}Skipping Docker build (SKIP_BUILD=true)${NC}"
fi

# Update task definition
echo -e "${YELLOW}Updating ECS task definition...${NC}"

# Read the task definition template
TASK_DEF_FILE="$(dirname "$0")/../backend/ecs-task-definition.json"

if [ ! -f "$TASK_DEF_FILE" ]; then
    echo -e "${RED}Error: Task definition file not found: ${TASK_DEF_FILE}${NC}"
    exit 1
fi

# Replace placeholders in task definition
TASK_DEFINITION=$(cat ${TASK_DEF_FILE} | \
    sed "s/ACCOUNT_ID/${AWS_ACCOUNT_ID}/g" | \
    sed "s/REGION/${AWS_REGION}/g" | \
    sed "s/:latest/:${VERSION}/g")

if [ "$DRY_RUN" = "true" ]; then
    echo -e "${YELLOW}DRY RUN: Would register task definition${NC}"
    echo "$TASK_DEFINITION" | jq '.'
else
    # Register new task definition
    NEW_TASK_DEF=$(echo "$TASK_DEFINITION" | \
        aws ecs register-task-definition \
            --cli-input-json file:///dev/stdin \
            --query 'taskDefinition.taskDefinitionArn' \
            --output text)
    
    if [ $? -ne 0 ] || [ -z "$NEW_TASK_DEF" ]; then
        echo -e "${RED}Error: Failed to register task definition${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}New task definition registered: ${NEW_TASK_DEF}${NC}"
fi

# Update ECS service
echo -e "${YELLOW}Updating ECS service...${NC}"

if [ "$DRY_RUN" = "true" ]; then
    echo -e "${YELLOW}DRY RUN: Would update ECS service${NC}"
else
    # Update the service with new task definition
    aws ecs update-service \
        --cluster ${ECS_CLUSTER} \
        --service ${ECS_SERVICE} \
        --task-definition ${NEW_TASK_DEF} \
        --force-new-deployment \
        --region ${AWS_REGION} \
        > /dev/null
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to update ECS service${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}ECS service updated${NC}"
fi

# Wait for deployment to complete
if [ "$DRY_RUN" != "true" ]; then
    echo -e "${YELLOW}Waiting for deployment to complete...${NC}"
    echo -e "${BLUE}This may take several minutes. Press Ctrl+C to stop waiting (deployment will continue).${NC}"
    
    # Wait for service to stabilize
    aws ecs wait services-stable \
        --cluster ${ECS_CLUSTER} \
        --services ${ECS_SERVICE} \
        --region ${AWS_REGION}
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Deployment completed successfully!${NC}"
    else
        echo -e "${YELLOW}Warning: Deployment may still be in progress${NC}"
    fi
    
    # Get service status
    echo -e "${YELLOW}Checking service status...${NC}"
    SERVICE_STATUS=$(aws ecs describe-services \
        --cluster ${ECS_CLUSTER} \
        --services ${ECS_SERVICE} \
        --region ${AWS_REGION} \
        --query 'services[0]' \
        --output json)
    
    RUNNING_COUNT=$(echo "$SERVICE_STATUS" | jq -r '.runningCount')
    DESIRED_COUNT=$(echo "$SERVICE_STATUS" | jq -r '.desiredCount')
    
    echo "Running tasks: ${RUNNING_COUNT}/${DESIRED_COUNT}"
    
    # Get deployment status
    DEPLOYMENTS=$(echo "$SERVICE_STATUS" | jq -r '.deployments[] | "\(.status): \(.runningCount) tasks"')
    echo -e "${BLUE}Deployments:${NC}"
    echo "$DEPLOYMENTS"
    
    # Check for any deployment failures
    FAILED_TASKS=$(aws ecs list-tasks \
        --cluster ${ECS_CLUSTER} \
        --service-name ${ECS_SERVICE} \
        --desired-status STOPPED \
        --region ${AWS_REGION} \
        --query 'taskArns[0]' \
        --output text)
    
    if [ "$FAILED_TASKS" != "None" ] && [ -n "$FAILED_TASKS" ]; then
        echo -e "${YELLOW}Warning: Some tasks have stopped. Checking last stopped task...${NC}"
        
        TASK_DETAILS=$(aws ecs describe-tasks \
            --cluster ${ECS_CLUSTER} \
            --tasks ${FAILED_TASKS} \
            --region ${AWS_REGION} \
            --query 'tasks[0]' \
            --output json)
        
        STOP_REASON=$(echo "$TASK_DETAILS" | jq -r '.stoppedReason // "Unknown"')
        echo "Last stopped task reason: ${STOP_REASON}"
    fi
fi

# Get load balancer URL
echo -e "${YELLOW}Getting application URL...${NC}"
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --region ${AWS_REGION} \
    --query "LoadBalancers[?contains(LoadBalancerName, 'los')].DNSName" \
    --output text 2>/dev/null || echo "")

if [ -n "$ALB_DNS" ]; then
    echo -e "${GREEN}Application URL: http://${ALB_DNS}${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}=== Deployment Summary ===${NC}"
echo "Environment: ${ENVIRONMENT}"
echo "Version: ${VERSION}"
echo "ECS Cluster: ${ECS_CLUSTER}"
echo "ECS Service: ${ECS_SERVICE}"
if [ "$DRY_RUN" != "true" ]; then
    echo "Task Definition: ${NEW_TASK_DEF}"
    echo "Running Tasks: ${RUNNING_COUNT}/${DESIRED_COUNT}"
fi
echo ""

if [ "$DRY_RUN" != "true" ]; then
    echo -e "${GREEN}Backend deployed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Monitor the deployment in AWS Console"
    echo "2. Check application logs in CloudWatch"
    echo "3. Verify health checks are passing"
    echo "4. Test the API endpoints"
    echo ""
    echo "To view logs:"
    echo "  aws logs tail /ecs/los-backend --follow --region ${AWS_REGION}"
    echo ""
    echo "To rollback if needed:"
    echo "  ./scripts/rollback-backend.sh ${ENVIRONMENT}"
else
    echo -e "${YELLOW}DRY RUN completed. No changes were made.${NC}"
fi

# Made with Bob
