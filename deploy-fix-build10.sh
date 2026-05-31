#!/bin/bash

# Deploy Build 10 - Run Agent Review Fix
# This script deploys the cleaned-up Run Agent Review feature

set -e

echo "=== Deploying Build 10: Run Agent Review Fix ==="
echo ""
echo "This will deploy the following changes:"
echo "  - Simplified handleRunReview function"
echo "  - Cleaned up button onClick handler"
echo "  - Added getReview API method"
echo ""
echo "Commit: 955f2b2"
echo "Files changed:"
echo "  - frontend/src/pages/ApplicationDetail.jsx"
echo "  - frontend/src/services/api.js"
echo ""

# Check if logged in to OpenShift
if ! oc whoami &> /dev/null; then
    echo "ERROR: Not logged in to OpenShift"
    echo ""
    echo "Please login first:"
    echo "  oc login --token=<your-token> --server=<your-server>"
    echo ""
    exit 1
fi

# Check if in correct project
CURRENT_PROJECT=$(oc project -q)
if [ "$CURRENT_PROJECT" != "los-demo" ]; then
    echo "Switching to los-demo project..."
    oc project los-demo
fi

echo "Current project: $(oc project -q)"
echo ""

# Check if build config exists
if ! oc get bc/los-frontend &> /dev/null; then
    echo "ERROR: Build config 'los-frontend' not found"
    echo "Please run the initial deployment first: ./deploy-to-openshift.sh"
    exit 1
fi

# Trigger new build
echo "Triggering new frontend build..."
echo "This will pull the latest code from GitHub (commit 955f2b2)"
echo ""

oc start-build los-frontend --follow

echo ""
echo "Build complete! Waiting for deployment to roll out..."
echo ""

# Wait for rollout
oc rollout status deployment/los-frontend

echo ""
echo "=== Deployment Complete ==="
echo ""

# Get application URLs
FRONTEND_URL=$(oc get route los-frontend -o jsonpath='{.spec.host}' 2>/dev/null || echo "Not found")
BACKEND_URL=$(oc get route los-backend -o jsonpath='{.spec.host}' 2>/dev/null || echo "Not found")

echo "Application URLs:"
echo "  Frontend: https://$FRONTEND_URL"
echo "  Backend:  https://$BACKEND_URL"
echo ""

# Get pod status
echo "Pod Status:"
oc get pods -l app=los-frontend

echo ""
echo "=== Next Steps ==="
echo ""
echo "1. Open the frontend URL in your browser"
echo "2. Login as analyst1 / password123"
echo "3. Navigate to Applications"
echo "4. Open an application with 'In Review' status"
echo "5. Click 'Run Agent Review' button"
echo "6. Verify success message and navigation to review page"
echo ""
echo "If the feature still fails, check backend logs:"
echo "  oc logs deployment/los-backend --tail=100"
echo ""

# Made with Bob