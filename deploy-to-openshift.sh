#!/bin/bash

set -e

echo "=== Deploying LOS Application to OpenShift ==="
echo "Project: los-demo"
echo ""

# Create backend secret
echo "Creating backend secret..."
oc create secret generic los-backend-secret \
  --from-literal=DB_PASSWORD="changeme123" \
  --from-literal=JWT_SECRET="your-jwt-secret-key-change-in-production" \
  --from-literal=SESSION_SECRET="your-session-secret-key-change-in-production" \
  --dry-run=client -o yaml | oc apply -f -

# Create backend configmap
echo "Creating backend configmap..."
oc apply -f openshift/backend-configmap.yaml

# Create PVC for uploads
echo "Creating PVC for uploads..."
oc apply -f openshift/backend-pvc.yaml

# Build and deploy backend using Docker strategy
echo "Creating backend build config..."
oc new-build --name=los-backend \
  --binary \
  --strategy=docker \
  --to=los-backend:latest || echo "Build config already exists"

echo "Starting backend build from local source..."
oc start-build los-backend --from-dir=./backend --follow

# Create backend deployment
echo "Creating backend deployment..."
cat <<EOF | oc apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: los-backend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: los-backend
  template:
    metadata:
      labels:
        app: los-backend
    spec:
      containers:
        - name: backend
          image: image-registry.openshift-image-registry.svc:5000/los-demo/los-backend:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 3001
              name: http
          envFrom:
            - configMapRef:
                name: los-backend-config
            - secretRef:
                name: los-backend-secret
          volumeMounts:
            - name: uploads
              mountPath: /app/data/uploads
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
      volumes:
        - name: uploads
          persistentVolumeClaim:
            claimName: los-backend-uploads
EOF

# Create backend service
echo "Creating backend service..."
oc apply -f openshift/backend-service.yaml

# Create backend route
echo "Creating backend route..."
oc apply -f openshift/backend-route.yaml

# Build and deploy frontend
echo "Creating frontend build config..."
oc new-build --name=los-frontend \
  --binary \
  --strategy=docker \
  --to=los-frontend:latest || echo "Build config already exists"

echo "Starting frontend build from local source..."
oc start-build los-frontend --from-dir=./frontend --follow

# Create frontend deployment
echo "Creating frontend deployment..."
cat <<EOF | oc apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: los-frontend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: los-frontend
  template:
    metadata:
      labels:
        app: los-frontend
    spec:
      containers:
        - name: frontend
          image: image-registry.openshift-image-registry.svc:5000/los-demo/los-frontend:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 8080
              name: http
          resources:
            requests:
              cpu: 50m
              memory: 128Mi
            limits:
              cpu: 300m
              memory: 256Mi
EOF

# Create frontend service
echo "Creating frontend service..."
oc apply -f openshift/frontend-service.yaml

# Create frontend route
echo "Creating frontend route..."
oc apply -f openshift/frontend-route.yaml

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Getting application URLs..."
echo "Backend URL: https://$(oc get route los-backend -o jsonpath='{.spec.host}')"
echo "Frontend URL: https://$(oc get route los-frontend -o jsonpath='{.spec.host}')"
echo ""
echo "Check deployment status with: oc get pods"

# Made with Bob
