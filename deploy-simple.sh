#!/bin/bash

set -e

echo "=== Simple OpenShift Deployment ==="
echo "Project: los-demo"
echo ""

# Clean up existing resources
echo "Cleaning up existing resources..."
oc delete all -l app=los-backend 2>/dev/null || true
oc delete all -l app=los-frontend 2>/dev/null || true
oc delete secret los-backend-secret 2>/dev/null || true
oc delete configmap los-backend-config 2>/dev/null || true
oc delete pvc los-backend-uploads 2>/dev/null || true

# Create backend secret
echo "Creating backend secret..."
oc create secret generic los-backend-secret \
  --from-literal=DB_PASSWORD="changeme123" \
  --from-literal=JWT_SECRET="your-jwt-secret-key-change-in-production" \
  --from-literal=SESSION_SECRET="your-session-secret-key-change-in-production"

# Create backend configmap
echo "Creating backend configmap..."
cat <<EOF | oc apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: los-backend-config
data:
  NODE_ENV: "production"
  PORT: "3001"
  DB_HOST: "postgres"
  DB_PORT: "5432"
  DB_NAME: "los_db"
  DB_USER: "los_user"
  CORS_ORIGIN: "*"
  ENABLE_DOCUMENT_UPLOAD: "true"
  ENABLE_CREDIT_ANALYSIS: "true"
  ENABLE_AGENT_REVIEW: "true"
  ENABLE_DECISION_WORKFLOW: "true"
  MAX_FILE_SIZE: "10485760"
  ALLOWED_FILE_TYPES: "pdf,doc,docx,xls,xlsx,jpg,jpeg,png"
  HEALTH_CHECK_PATH: "/health"
EOF

# Create PVC for uploads
echo "Creating PVC for uploads..."
oc apply -f openshift/backend-pvc.yaml

# Deploy backend using Node.js image
echo "Deploying backend..."
oc new-app nodejs:20-ubi9~https://github.com/robibanogon/los_bobdemo_v1.git#main \
  --context-dir=backend \
  --name=los-backend \
  --labels=app=los-backend

# Wait for build to start
echo "Waiting for build to start..."
sleep 5

# Patch deployment to add env and volumes
echo "Patching backend deployment..."
oc set env deployment/los-backend --from=configmap/los-backend-config
oc set env deployment/los-backend --from=secret/los-backend-secret
oc set volume deployment/los-backend --add --name=uploads --type=persistentVolumeClaim --claim-name=los-backend-uploads --mount-path=/app/data/uploads

# Create backend route
echo "Creating backend route..."
oc create route edge los-backend --service=los-backend --port=8080 || oc expose service/los-backend

# Deploy frontend
echo "Deploying frontend..."
oc new-app nodejs:20-ubi9~https://github.com/robibanogon/los_bobdemo_v1.git#main \
  --context-dir=frontend \
  --name=los-frontend \
  --labels=app=los-frontend

# Create frontend route
echo "Creating frontend route..."
oc create route edge los-frontend --service=los-frontend --port=8080 || oc expose service/los-frontend

echo ""
echo "=== Deployment Initiated ==="
echo ""
echo "Monitor builds with: oc get builds -w"
echo "Check pods with: oc get pods"
echo ""
echo "Once builds complete, access your application at:"
echo "Backend: https://\$(oc get route los-backend -o jsonpath='{.spec.host}')"
echo "Frontend: https://\$(oc get route los-frontend -o jsonpath='{.spec.host}')"

# Made with Bob
