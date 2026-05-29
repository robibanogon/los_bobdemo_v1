# Terraform AWS Infrastructure for Loan Origination System

This directory contains production-ready Terraform Infrastructure as Code templates for deploying the Loan Origination System (LOS) to AWS. The design follows the architecture defined in `Plan/AWS_DEPLOYMENT_ARCHITECTURE.md` and is structured for reuse across development, staging, and production environments.

## Architecture Overview

The Terraform configuration provisions:

- VPC with public, private application, and private database subnets across two Availability Zones
- Internet Gateway, NAT Gateways, route tables, and subnet associations
- Security groups and network ACLs for ALB, ECS, and RDS traffic isolation
- ECS Fargate cluster and backend service with autoscaling
- Application Load Balancer with HTTP to HTTPS redirect and TLS termination
- PostgreSQL RDS instance with Multi-AZ, encryption, backups, and subnet isolation
- S3 buckets for documents, frontend assets, backups, and logs
- CloudFront distribution for frontend delivery and API proxying
- IAM roles and least-privilege policies for ECS workloads and CloudFront access
- CloudWatch log groups, alarms, dashboard, and SNS alerting
- Environment-specific overlays for dev, staging, and production

## Directory Structure

```text
terraform/
├── README.md
├── main.tf
├── variables.tf
├── outputs.tf
├── terraform.tfvars.example
├── modules/
│   ├── alb/
│   ├── cloudfront/
│   ├── ecs/
│   ├── iam/
│   ├── monitoring/
│   ├── rds/
│   ├── s3/
│   ├── security/
│   └── vpc/
└── environments/
    ├── dev/
    ├── staging/
    └── production/
```

## Prerequisites

Install and configure the following before deployment:

- Terraform 1.5 or later
- AWS CLI v2
- An AWS account with permissions to create networking, compute, storage, IAM, CloudFront, ACM, and monitoring resources
- AWS credentials configured locally using one of:
  - `aws configure`
  - environment variables
  - AWS SSO
  - an assumed IAM role
- A Route 53 hosted zone if using custom domains
- An ACM certificate in `us-east-1` for CloudFront custom domains
- A container image for the backend application pushed to Amazon ECR or another supported registry
- Existing Secrets Manager secrets for application runtime secrets

## Recommended Bootstrap for Remote State

This configuration expects remote state in S3 with DynamoDB locking. Create the backend resources once before running normal Terraform workflows.

Example bootstrap resources:

- S3 bucket for Terraform state
- DynamoDB table for state locking

Example backend configuration used by environment overlays:

```hcl
terraform {
  backend "s3" {
    bucket         = "los-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "los-terraform-locks"
    encrypt        = true
  }
}
```

## Setup Instructions

### 1. Copy example variables

From the `terraform/` directory:

```bash
cp terraform.tfvars.example terraform.tfvars
```

### 2. Update variable values

Set values for:

- AWS region
- environment name
- project name
- domain names
- ACM certificate ARN
- Route 53 hosted zone ID
- backend container image
- database configuration
- Secrets Manager ARNs
- alert email endpoints

Do not place plaintext secrets in Terraform variables for runtime application secrets. Use AWS Secrets Manager ARNs and let ECS inject them into containers.

### 3. Choose an environment

Each environment folder contains a backend configuration and environment-specific variable values.

Examples:

- `environments/dev`
- `environments/staging`
- `environments/production`

### 4. Initialize Terraform

Example for development:

```bash
terraform -chdir=environments/dev init
```

### 5. Review the execution plan

```bash
terraform -chdir=environments/dev plan
```

### 6. Apply the infrastructure

```bash
terraform -chdir=environments/dev apply
```

## Deployment Commands

### Development

```bash
terraform -chdir=environments/dev init
terraform -chdir=environments/dev plan
terraform -chdir=environments/dev apply
```

### Staging

```bash
terraform -chdir=environments/staging init
terraform -chdir=environments/staging plan
terraform -chdir=environments/staging apply
```

### Production

```bash
terraform -chdir=environments/production init
terraform -chdir=environments/production plan
terraform -chdir=environments/production apply
```

### Destroy non-production environments

```bash
terraform -chdir=environments/dev destroy
terraform -chdir=environments/staging destroy
```

Use extreme caution with destroy operations. Production should be protected using Terraform lifecycle controls, IAM guardrails, and change approval processes.

## Variable Reference

Key variables defined in `variables.tf` include:

| Variable | Description |
|---|---|
| `aws_region` | AWS region for regional resources |
| `environment` | Environment name such as dev, staging, or production |
| `project_name` | Project identifier used in naming and tagging |
| `vpc_cidr` | CIDR block for the VPC |
| `availability_zones` | Two AZs used for high availability |
| `public_subnet_cidrs` | CIDRs for public subnets |
| `private_subnet_cidrs` | CIDRs for ECS application subnets |
| `database_subnet_cidrs` | CIDRs for RDS subnets |
| `db_name` | PostgreSQL database name |
| `db_username` | PostgreSQL master username |
| `db_password` | PostgreSQL master password, marked sensitive |
| `db_instance_class` | RDS instance class |
| `db_allocated_storage` | Initial RDS storage in GB |
| `backend_container_image` | Container image URI for the backend |
| `backend_container_port` | Backend application port |
| `ecs_task_cpu` | ECS task CPU units |
| `ecs_task_memory` | ECS task memory in MiB |
| `ecs_desired_count` | Desired ECS task count |
| `ecs_min_capacity` | Minimum autoscaling capacity |
| `ecs_max_capacity` | Maximum autoscaling capacity |
| `domain_name` | Primary application domain |
| `frontend_domain_name` | Optional frontend alias |
| `api_domain_name` | Optional API alias |
| `acm_certificate_arn` | ACM certificate ARN for ALB and CloudFront |
| `route53_zone_id` | Hosted zone ID for DNS records |
| `secrets_manager_arns` | Secrets injected into ECS tasks |
| `alert_email_endpoints` | Email subscriptions for SNS alerts |

## Security Notes

This Terraform stack follows AWS security best practices:

- Private application and database tiers
- Security groups restricted by source security group where possible
- Encryption enabled for RDS, S3, CloudWatch logs, and Terraform state
- Public access blocked on private buckets
- Least-privilege IAM policies for ECS tasks
- Secrets consumed from AWS Secrets Manager
- HTTPS enforced at ALB and CloudFront
- CloudFront origin access control used for frontend bucket access

## Environment Strategy

The root module in `terraform/` contains the reusable infrastructure definition. Each environment folder references the root module and supplies environment-specific values such as:

- naming
- scaling thresholds
- instance sizes
- domain aliases
- retention periods
- deletion protection

This keeps the infrastructure consistent while allowing safe differences between dev, staging, and production.

## Troubleshooting

### Terraform init fails for backend
Verify that the remote state S3 bucket and DynamoDB lock table already exist and that your AWS credentials have access.

### ACM certificate errors with CloudFront
CloudFront requires the certificate to exist in `us-east-1`. Confirm the ARN points to a certificate in that region.

### ECS tasks fail to start
Check:

- container image URI
- task execution role permissions
- Secrets Manager ARNs
- CloudWatch logs in `/ecs/<project>-backend`
- security group egress to AWS APIs and database

### ALB health checks fail
Confirm the backend exposes the configured health endpoint and that the ECS security group allows traffic from the ALB security group on the container port.

### RDS connectivity issues
Verify:

- ECS tasks are in private subnets
- RDS is in database subnets
- RDS security group allows inbound PostgreSQL from ECS only
- application secrets contain the correct endpoint and credentials

### CloudFront returns 403 for frontend assets
Check the frontend bucket policy, CloudFront origin access control configuration, and object deployment paths.

### Route 53 records are not created
Ensure `route53_zone_id` is set and the hosted zone exists in the same AWS account or is accessible by the deployment credentials.

## Operational Recommendations

- Use separate AWS accounts for dev, staging, and production where possible
- Enable AWS Budgets and Cost Anomaly Detection
- Integrate Terraform into CI/CD with plan and approval gates
- Store sensitive Terraform input values in a secure secret store or CI variable manager
- Review IAM policies regularly
- Enable AWS Config, GuardDuty, and Security Hub for production workloads

## Notes

- Runtime application secrets should come from Secrets Manager, not plaintext Terraform variables
- The example `db_password` variable exists to support initial provisioning, but production deployments should source it securely from CI or secret injection workflows
- CloudFront and ACM resources may take several minutes to provision
- Some resources, such as Route 53 records and custom domains, are optional and controlled by variables