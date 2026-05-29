# Deployment Guide

This guide covers deployment of the Loan Origination System (LOS) to Red Hat OpenShift, while intentionally ignoring the previous AWS-focused deployment flow.

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Prerequisites](#prerequisites)
3. [Architecture on OpenShift](#architecture-on-openshift)
4. [Container Build Strategy](#container-build-strategy)
5. [Environment Configuration](#environment-configuration)
6. [OpenShift Resources](#openshift-resources)
7. [Deployment Steps](#deployment-steps)
8. [Database and Storage Considerations](#database-and-storage-considerations)
9. [Operations](#operations)
10. [Rollback Procedures](#rollback-procedures)
11. [Troubleshooting](#troubleshooting)

---

## Deployment Overview

The application consists of:

- A React/Vite frontend
- A Node.js/Express backend API
- A PostgreSQL database
- Persistent file storage for uploaded documents

For OpenShift, the recommended deployment model is:

- Build container images for frontend and backend
- Push images to an OpenShift-accessible registry
- Deploy workloads as OpenShift `Deployment` resources
- Expose services internally with `Service`
- Expose HTTP endpoints externally with `Route`
- Store configuration in `ConfigMap`
- Store secrets in `Secret`
- Use persistent volumes for uploads if object storage is not used
- Use either an in-cluster PostgreSQL instance for non-production or a managed PostgreSQL service for production

---

## Prerequisites

### Required Tools

- **OpenShift CLI (`oc`)**
  ```bash
  oc version
  ```

- **Docker or Podman**
  ```bash
  podman --version
  ```

- **Node.js** (v18.x or later)
  ```bash
  node --version
  ```

- **Git**
  ```bash
  git --version
  ```

### Cluster Access

You need:

1. Access to a Red Hat OpenShift cluster
2. Permission to create projects, deployments, services, routes, configmaps, secrets, and PVCs
3. Access to an image registry reachable by OpenShift
4. A target OpenShift project/namespace, for example `los-demo`

### Login Example

```bash
oc login https://api.openshift.example.com:6443
oc new-project los-demo
```

If the project already exists:

```bash
oc project los-demo
```

---

## Architecture on OpenShift

### Recommended Runtime Topology

- **Frontend**
  - Containerized static site served by NGINX
  - Exposed through an OpenShift route such as `https://los.apps.example.com`

- **Backend**
  - Node.js API container
  - Exposed internally through a service
  - Optionally exposed externally through a route such as `https://los-api.apps.example.com`

- **Database**
  - Preferred for production: managed PostgreSQL outside the cluster or OpenShift database service
  - Acceptable for demos/non-production: PostgreSQL deployed inside OpenShift with persistent storage

- **Uploads**
  - Preferred for production: S3-compatible object storage
  - Acceptable for demos/non-production: persistent volume mounted to the backend container

### Networking Model

- Frontend route sends browser traffic to the frontend service
- Frontend calls backend route using `VITE_API_URL`
- Backend connects to PostgreSQL using service DNS or managed DB hostname
- Backend stores uploaded files either on mounted storage or object storage

---

## Container Build Strategy

### Backend Container

The backend already includes a production-ready [`backend/Dockerfile`](backend/Dockerfile) that:

- Uses Node.js 18 Alpine
- Runs as a non-root user
- Exposes port `3001`
- Includes a health check on `/health`

Build example:

```bash
podman build -t image-registry.example.com/los-demo/los-backend:latest ./backend
podman push image-registry.example.com/los-demo/los-backend:latest
```

### Frontend Container

The frontend currently has build scripts but no production container definition. For OpenShift, add a production Dockerfile that:

- Builds the Vite app
- Serves the generated `dist/` directory with NGINX or a similar static server
- Exposes port `8080`

A sample OpenShift-ready frontend container file is provided separately in the manifests/templates section.

Build example after adding the frontend Dockerfile:

```bash
podman build -t image-registry.example.com/los-demo/los-frontend:latest ./frontend
podman push image-registry.example.com/los-demo/los-frontend:latest
```

---

## Environment Configuration

### Backend Environment Variables

Use a `ConfigMap` for non-sensitive values and a `Secret` for sensitive values.

Important backend settings based on [`backend/.env.production.example`](backend/.env.production.example):

**ConfigMap candidates**
- `NODE_ENV=production`
- `PORT=3001`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `CORS_ORIGIN`
- `LOG_LEVEL`
- `ENABLE_DOCUMENT_UPLOAD`
- `ENABLE_CREDIT_ANALYSIS`
- `ENABLE_AGENT_REVIEW`
- `ENABLE_DECISION_WORKFLOW`
- `MAX_FILE_SIZE`
- `ALLOWED_FILE_TYPES`
- `HEALTH_CHECK_PATH`

**Secret candidates**
- `DB_PASSWORD`
- `JWT_SECRET`
- `SESSION_SECRET`
- External API keys if later introduced

### Frontend Environment Variables

The frontend reads its API base URL from [`frontend/src/services/api.js`](frontend/src/services/api.js), where `VITE_API_URL` defaults to `http://localhost:3001/api`.

For OpenShift production builds, set:

```bash
VITE_API_URL=https://los-api.apps.example.com/api
```

Relevant values from [`frontend/.env.production.example`](frontend/.env.production.example):

- `VITE_API_URL`
- `VITE_APP_NAME`
- `VITE_APP_VERSION`
- `VITE_ENVIRONMENT`
- Feature flags as needed

Because Vite embeds environment variables at build time, frontend environment values must be present during image build unless you implement runtime config injection.

---

## OpenShift Resources

A typical deployment should include:

### Core Resources

- `Namespace` or existing OpenShift project
- `ConfigMap` for backend configuration
- `Secret` for backend secrets
- `PersistentVolumeClaim` for backend uploads
- `Deployment` for backend
- `Service` for backend
- `Route` for backend
- `Deployment` for frontend
- `Service` for frontend
- `Route` for frontend

### Optional Resources

- PostgreSQL `Deployment`, `Service`, `PVC`, and `Secret` for demo environments
- HorizontalPodAutoscaler
- NetworkPolicy
- PodDisruptionBudget
- ResourceQuota and LimitRange
- ImageStreams and BuildConfigs if you want native OpenShift builds instead of external image builds

---

## Deployment Steps

### 1. Prepare the Project

Create or select the OpenShift project:

```bash
oc new-project los-demo
# or
oc project los-demo
```

### 2. Create Secrets and Config

Create backend secret values:

```bash
oc create secret generic los-backend-secret \
  --from-literal=DB_PASSWORD='change-me' \
  --from-literal=JWT_SECRET='change-me' \
  --from-literal=SESSION_SECRET='change-me'
```

Create backend config values:

```bash
oc create configmap los-backend-config \
  --from-literal=NODE_ENV=production \
  --from-literal=PORT=3001 \
  --from-literal=DB_HOST=postgres \
  --from-literal=DB_PORT=5432 \
  --from-literal=DB_NAME=los_db \
  --from-literal=DB_USER=los_user \
  --from-literal=CORS_ORIGIN=https://los.apps.example.com \
  --from-literal=ENABLE_DOCUMENT_UPLOAD=true \
  --from-literal=ENABLE_CREDIT_ANALYSIS=true \
  --from-literal=ENABLE_AGENT_REVIEW=true \
  --from-literal=ENABLE_DECISION_WORKFLOW=true
```

### 3. Build and Push Images

Build backend:

```bash
podman build -t image-registry.example.com/los-demo/los-backend:latest ./backend
podman push image-registry.example.com/los-demo/los-backend:latest
```

Build frontend after adding the production Dockerfile:

```bash
podman build -t image-registry.example.com/los-demo/los-frontend:latest ./frontend
podman push image-registry.example.com/los-demo/los-frontend:latest
```

### 4. Apply OpenShift Manifests

Apply the manifests directory once added:

```bash
oc apply -f openshift/
```

Or apply files individually:

```bash
oc apply -f openshift/backend-configmap.yaml
oc apply -f openshift/backend-secret.example.yaml
oc apply -f openshift/backend-pvc.yaml
oc apply -f openshift/backend-deployment.yaml
oc apply -f openshift/backend-service.yaml
oc apply -f openshift/backend-route.yaml
oc apply -f openshift/frontend-deployment.yaml
oc apply -f openshift/frontend-service.yaml
oc apply -f openshift/frontend-route.yaml
```

### 5. Verify Rollout

```bash
oc get pods
oc get svc
oc get routes
oc rollout status deployment/los-backend
oc rollout status deployment/los-frontend
```

### 6. Run Database Migration and Seed Data

If using PostgreSQL and the migration scripts:

```bash
oc exec deploy/los-backend -- node migrations/run_migration.js
oc exec deploy/los-backend -- node src/utils/seedData.js
```

If multiple backend pods exist, use a specific pod name instead of the deployment shortcut.

---

## Database and Storage Considerations

### PostgreSQL

The repository includes PostgreSQL-oriented configuration in [`docker-compose.yml`](docker-compose.yml) and backend environment examples.

Recommended options:

- **Production**: managed PostgreSQL with backups, HA, and monitoring
- **Demo / sandbox**: PostgreSQL deployed in OpenShift with a PVC

Minimum required backend DB variables:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

### File Upload Storage

The backend stores uploads under `data/uploads`.

Options:

1. **Persistent volume mount**
   - Mount a PVC to `/app/data/uploads`
   - Simple for demos and internal environments

2. **Object storage**
   - Preferable for production
   - Can be AWS S3, Red Hat OpenShift Data Foundation object storage, MinIO, or another S3-compatible service
   - Requires validating how [`backend/src/services/s3Service.js`](backend/src/services/s3Service.js) is configured in your target environment

If you do not want AWS dependencies in production, use PVC-backed local storage or replace S3 usage with an S3-compatible non-AWS endpoint.

---

## Operations

### View Logs

```bash
oc logs deployment/los-backend
oc logs deployment/los-frontend
```

Follow logs:

```bash
oc logs -f deployment/los-backend
```

### Restart Deployments

```bash
oc rollout restart deployment/los-backend
oc rollout restart deployment/los-frontend
```

### Scale Deployments

```bash
oc scale deployment/los-backend --replicas=2
oc scale deployment/los-frontend --replicas=2
```

### Inspect Environment

```bash
oc set env deployment/los-backend --list
oc describe deployment los-backend
```

---

## Rollback Procedures

### Roll Back to Previous Deployment Revision

```bash
oc rollout undo deployment/los-backend
oc rollout undo deployment/los-frontend
```

### Check Rollout History

```bash
oc rollout history deployment/los-backend
oc rollout history deployment/los-frontend
```

### Image Rollback

If rollback requires a previous image tag:

```bash
oc set image deployment/los-backend backend=image-registry.example.com/los-demo/los-backend:v1.0.0
oc set image deployment/los-frontend frontend=image-registry.example.com/los-demo/los-frontend:v1.0.0
```

---

## Troubleshooting

### Pod Fails to Start

Check pod events and logs:

```bash
oc describe pod <pod-name>
oc logs <pod-name>
```

Common causes:

- Missing secret values
- Wrong image reference
- Port mismatch
- Volume mount permission issues
- Database connectivity failures

### Frontend Cannot Reach Backend

Verify:

- `VITE_API_URL` was set correctly during frontend image build
- Backend route is reachable
- CORS origin matches the frontend route
- Backend service and route target the correct port

### Backend Cannot Connect to Database

Verify:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`
- PostgreSQL service name or external hostname
- Network policies are not blocking traffic
- Database schema has been initialized

### Uploads Are Not Persisted

Verify:

- PVC is bound
- Volume is mounted at `/app/data/uploads`
- Container user has write permission
- Object storage credentials and endpoint are correct if using S3-compatible storage

### Health Checks Fail

The backend container health check targets `/health` on port `3001` as defined in [`backend/Dockerfile`](backend/Dockerfile). Ensure:

- The application listens on `3001`
- The route and service target the correct container port
- Startup time is sufficient for readiness/liveness probes

---

## Notes on AWS-Specific Assets

This deployment guide intentionally excludes the AWS-specific flow previously documented, including:

- Terraform-managed AWS infrastructure
- ECS/Fargate deployment steps
- ECR push workflows
- CloudFront distribution setup
- AWS Secrets Manager procedures
- CloudWatch-specific operational steps

Those files may still exist in the repository for historical reference, but they are not part of the recommended OpenShift deployment path.