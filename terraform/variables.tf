variable "aws_region" {
  description = "AWS region for regional resources."
  type        = string
  default     = "us-east-1"

  validation {
    condition     = length(var.aws_region) > 0
    error_message = "aws_region must not be empty."
  }
}

variable "environment" {
  description = "Deployment environment name."
  type        = string

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "environment must be one of: dev, staging, production."
  }
}

variable "project_name" {
  description = "Project name used for naming and tagging."
  type        = string
  default     = "los"

  validation {
    condition     = length(var.project_name) > 0
    error_message = "project_name must not be empty."
  }
}

variable "additional_tags" {
  description = "Additional tags applied to all supported resources."
  type        = map(string)
  default     = {}
}

variable "availability_zones" {
  description = "Optional explicit list of two availability zones. If empty, the first two available AZs are used."
  type        = list(string)
  default     = []

  validation {
    condition     = length(var.availability_zones) == 0 || length(var.availability_zones) == 2
    error_message = "availability_zones must contain exactly two AZs when provided."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "vpc_cidr must be a valid CIDR block."
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for the two public subnets."
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]

  validation {
    condition     = length(var.public_subnet_cidrs) == 2 && alltrue([for cidr in var.public_subnet_cidrs : can(cidrhost(cidr, 0))])
    error_message = "public_subnet_cidrs must contain exactly two valid CIDR blocks."
  }
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for the two private application subnets."
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]

  validation {
    condition     = length(var.private_subnet_cidrs) == 2 && alltrue([for cidr in var.private_subnet_cidrs : can(cidrhost(cidr, 0))])
    error_message = "private_subnet_cidrs must contain exactly two valid CIDR blocks."
  }
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for the two private database subnets."
  type        = list(string)
  default     = ["10.0.21.0/24", "10.0.22.0/24"]

  validation {
    condition     = length(var.database_subnet_cidrs) == 2 && alltrue([for cidr in var.database_subnet_cidrs : can(cidrhost(cidr, 0))])
    error_message = "database_subnet_cidrs must contain exactly two valid CIDR blocks."
  }
}

variable "domain_name" {
  description = "Primary frontend domain name."
  type        = string
  default     = ""
}

variable "frontend_domain_name" {
  description = "Optional additional frontend alias such as www.example.com."
  type        = string
  default     = ""
}

variable "api_domain_name" {
  description = "Optional API domain name pointing to the ALB."
  type        = string
  default     = ""
}

variable "route53_zone_id" {
  description = "Optional Route 53 hosted zone ID for DNS record creation."
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN used by ALB and CloudFront. CloudFront certificates must exist in us-east-1."
  type        = string
  default     = ""
}

variable "enable_https_listener" {
  description = "Whether to create the HTTPS listener on the ALB."
  type        = bool
  default     = true
}

variable "alb_health_check_path" {
  description = "Health check path for the backend target group."
  type        = string
  default     = "/health"
}

variable "alb_deletion_protection" {
  description = "Enable deletion protection on the ALB."
  type        = bool
  default     = false
}

variable "alb_idle_timeout" {
  description = "Idle timeout for the ALB in seconds."
  type        = number
  default     = 60

  validation {
    condition     = var.alb_idle_timeout >= 1 && var.alb_idle_timeout <= 4000
    error_message = "alb_idle_timeout must be between 1 and 4000 seconds."
  }
}

variable "backend_container_image" {
  description = "Container image URI for the backend service."
  type        = string

  validation {
    condition     = length(var.backend_container_image) > 0
    error_message = "backend_container_image must not be empty."
  }
}

variable "backend_container_port" {
  description = "Container port exposed by the backend service."
  type        = number
  default     = 3001

  validation {
    condition     = var.backend_container_port > 0 && var.backend_container_port < 65536
    error_message = "backend_container_port must be a valid TCP port."
  }
}

variable "ecs_task_cpu" {
  description = "CPU units for the ECS task definition."
  type        = number
  default     = 512
}

variable "ecs_task_memory" {
  description = "Memory in MiB for the ECS task definition."
  type        = number
  default     = 1024
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks."
  type        = number
  default     = 2
}

variable "ecs_min_capacity" {
  description = "Minimum ECS service autoscaling capacity."
  type        = number
  default     = 2
}

variable "ecs_max_capacity" {
  description = "Maximum ECS service autoscaling capacity."
  type        = number
  default     = 10
}

variable "ecs_cpu_target_utilization" {
  description = "Target CPU utilization percentage for ECS autoscaling."
  type        = number
  default     = 70
}

variable "ecs_memory_target_utilization" {
  description = "Target memory utilization percentage for ECS autoscaling."
  type        = number
  default     = 80
}

variable "ecs_log_retention_days" {
  description = "Retention period for ECS CloudWatch logs."
  type        = number
  default     = 30
}

variable "ecs_environment_variables" {
  description = "Plaintext environment variables for the ECS container."
  type = list(object({
    name  = string
    value = string
  }))
  default = [
    {
      name  = "NODE_ENV"
      value = "production"
    },
    {
      name  = "PORT"
      value = "3001"
    }
  ]
}

variable "ecs_secrets" {
  description = "Secrets injected into the ECS container from Secrets Manager or SSM Parameter Store."
  type = list(object({
    name      = string
    valueFrom = string
  }))
  default = []
}

variable "ecs_health_check_command" {
  description = "Optional ECS container health check command."
  type        = list(string)
  default     = ["CMD-SHELL", "node -e \"require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""]
}

variable "ecs_deployment_min_healthy_percent" {
  description = "Minimum healthy percent during ECS deployments."
  type        = number
  default     = 50
}

variable "ecs_deployment_max_percent" {
  description = "Maximum percent during ECS deployments."
  type        = number
  default     = 200
}

variable "db_name" {
  description = "PostgreSQL database name."
  type        = string
  default     = "los"

  validation {
    condition     = length(var.db_name) > 0
    error_message = "db_name must not be empty."
  }
}

variable "db_username" {
  description = "PostgreSQL master username."
  type        = string
  default     = "los_admin"

  validation {
    condition     = length(var.db_username) > 0
    error_message = "db_username must not be empty."
  }
}

variable "db_password" {
  description = "PostgreSQL master password. Supply securely through environment variables, CI secrets, or a secret manager integration."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.db_password) >= 16
    error_message = "db_password must be at least 16 characters long."
  }
}

variable "db_port" {
  description = "PostgreSQL port."
  type        = number
  default     = 5432
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB."
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum autoscaled storage for RDS in GB."
  type        = number
  default     = 100
}

variable "db_storage_type" {
  description = "RDS storage type."
  type        = string
  default     = "gp3"
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment for RDS."
  type        = bool
  default     = true
}

variable "db_backup_retention_period" {
  description = "Automated backup retention period in days."
  type        = number
  default     = 7
}

variable "db_backup_window" {
  description = "Preferred backup window for RDS."
  type        = string
  default     = "03:00-04:00"
}

variable "db_maintenance_window" {
  description = "Preferred maintenance window for RDS."
  type        = string
  default     = "Sun:04:00-Sun:05:00"
}

variable "db_deletion_protection" {
  description = "Enable deletion protection for RDS."
  type        = bool
  default     = true
}

variable "db_skip_final_snapshot" {
  description = "Skip final snapshot on RDS deletion."
  type        = bool
  default     = false
}

variable "db_performance_insights_enabled" {
  description = "Enable RDS Performance Insights."
  type        = bool
  default     = true
}

variable "db_monitoring_interval" {
  description = "Enhanced monitoring interval in seconds."
  type        = number
  default     = 60
}

variable "db_kms_key_id" {
  description = "Optional KMS key ID or ARN for RDS encryption."
  type        = string
  default     = null
}

variable "db_enabled_cloudwatch_logs" {
  description = "RDS log exports to CloudWatch."
  type        = list(string)
  default     = ["postgresql", "upgrade"]
}

variable "cors_allowed_origins" {
  description = "Allowed origins for the documents bucket CORS configuration."
  type        = list(string)
  default     = []
}

variable "logs_retention_days" {
  description = "Retention period for log objects stored in S3."
  type        = number
  default     = 90
}

variable "backups_expiration_days" {
  description = "Expiration period for backup objects in S3."
  type        = number
  default     = 365
}

variable "noncurrent_version_days" {
  description = "Expiration period for noncurrent S3 object versions."
  type        = number
  default     = 30
}

variable "cloudfront_price_class" {
  description = "CloudFront price class."
  type        = string
  default     = "PriceClass_100"
}

variable "cloudfront_web_acl_id" {
  description = "Optional WAF web ACL ID associated with the CloudFront distribution."
  type        = string
  default     = null
}

variable "cloudfront_api_path_pattern" {
  description = "Path pattern routed from CloudFront to the ALB."
  type        = string
  default     = "/api/*"
}

variable "secrets_manager_arns" {
  description = "Secrets Manager ARNs the ECS task role can read."
  type        = list(string)
  default     = []
}

variable "kms_key_arns" {
  description = "KMS key ARNs the ECS task execution role can decrypt."
  type        = list(string)
  default     = []
}

variable "alert_email_endpoints" {
  description = "Email endpoints subscribed to the SNS alerts topic."
  type        = list(string)
  default     = []
}

variable "alarm_ecs_cpu_threshold" {
  description = "CloudWatch alarm threshold for ECS CPU utilization."
  type        = number
  default     = 80
}

variable "alarm_ecs_memory_threshold" {
  description = "CloudWatch alarm threshold for ECS memory utilization."
  type        = number
  default     = 85
}

variable "alarm_alb_5xx_threshold" {
  description = "CloudWatch alarm threshold for ALB target 5XX errors."
  type        = number
  default     = 10
}

variable "alarm_unhealthy_hosts_threshold" {
  description = "CloudWatch alarm threshold for unhealthy ALB targets."
  type        = number
  default     = 1
}

variable "alarm_rds_connections_threshold" {
  description = "CloudWatch alarm threshold for RDS database connections."
  type        = number
  default     = 80
}

variable "alarm_rds_free_storage_threshold" {
  description = "CloudWatch alarm threshold for free RDS storage in bytes."
  type        = number
  default     = 10737418240
}