variable "name_prefix" {
  description = "Prefix used for naming ECS resources."
  type        = string
}

variable "aws_region" {
  description = "AWS region for logging configuration."
  type        = string
}

variable "cluster_name" {
  description = "Name of the ECS cluster."
  type        = string
}

variable "service_name" {
  description = "Name of the ECS service and task family."
  type        = string
}

variable "container_name" {
  description = "Name of the backend container."
  type        = string
}

variable "container_image" {
  description = "Container image URI."
  type        = string
}

variable "container_port" {
  description = "Container port exposed by the backend."
  type        = number
  default     = 3001
}

variable "task_cpu" {
  description = "Task CPU units."
  type        = number
  default     = 512
}

variable "task_memory" {
  description = "Task memory in MiB."
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Desired number of ECS tasks."
  type        = number
  default     = 2
}

variable "min_capacity" {
  description = "Minimum autoscaling capacity."
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum autoscaling capacity."
  type        = number
  default     = 10
}

variable "cpu_target_utilization" {
  description = "Target CPU utilization percentage."
  type        = number
  default     = 70
}

variable "memory_target_utilization" {
  description = "Target memory utilization percentage."
  type        = number
  default     = 80
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for ECS tasks."
  type        = list(string)
}

variable "ecs_security_group_id" {
  description = "Security group ID attached to ECS tasks."
  type        = string
}

variable "target_group_arn" {
  description = "ALB target group ARN."
  type        = string
}

variable "task_execution_role_arn" {
  description = "ECS task execution role ARN."
  type        = string
}

variable "task_role_arn" {
  description = "ECS task role ARN."
  type        = string
}

variable "log_retention_days" {
  description = "Retention period for ECS logs."
  type        = number
  default     = 30
}

variable "assign_public_ip" {
  description = "Whether to assign public IPs to ECS tasks."
  type        = bool
  default     = false
}

variable "environment_variables" {
  description = "Plaintext environment variables for the container."
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "secrets" {
  description = "Secrets injected into the container."
  type = list(object({
    name      = string
    valueFrom = string
  }))
  default = []
}

variable "health_check_command" {
  description = "Container health check command."
  type        = list(string)
  default     = ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"]
}

variable "deployment_min_healthy_pct" {
  description = "Minimum healthy percent during deployments."
  type        = number
  default     = 50
}

variable "deployment_max_percent" {
  description = "Maximum percent during deployments."
  type        = number
  default     = 200
}

variable "tags" {
  description = "Tags applied to ECS resources."
  type        = map(string)
  default     = {}
}