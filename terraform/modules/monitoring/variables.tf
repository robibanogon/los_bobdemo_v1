variable "name_prefix" {
  description = "Prefix used for naming monitoring resources."
  type        = string
}

variable "ecs_cluster_name" {
  description = "ECS cluster name."
  type        = string
}

variable "ecs_service_name" {
  description = "ECS service name."
  type        = string
}

variable "ecs_log_group_name" {
  description = "ECS log group name."
  type        = string
}

variable "alb_arn_suffix" {
  description = "ALB ARN suffix."
  type        = string
}

variable "target_group_arn_suffix" {
  description = "Target group ARN suffix."
  type        = string
}

variable "rds_instance_id" {
  description = "RDS instance identifier."
  type        = string
}

variable "sns_topic_name" {
  description = "SNS topic name for alerts."
  type        = string
}

variable "alert_email_endpoints" {
  description = "Email endpoints subscribed to alerts."
  type        = list(string)
  default     = []
}

variable "ecs_cpu_threshold" {
  description = "Threshold for ECS CPU alarm."
  type        = number
  default     = 80
}

variable "ecs_memory_threshold" {
  description = "Threshold for ECS memory alarm."
  type        = number
  default     = 85
}

variable "alb_5xx_threshold" {
  description = "Threshold for ALB 5XX alarm."
  type        = number
  default     = 10
}

variable "unhealthy_hosts_threshold" {
  description = "Threshold for unhealthy ALB targets."
  type        = number
  default     = 1
}

variable "rds_connections_threshold" {
  description = "Threshold for RDS connections alarm."
  type        = number
  default     = 80
}

variable "rds_free_storage_threshold" {
  description = "Threshold for free RDS storage alarm in bytes."
  type        = number
  default     = 10737418240
}

variable "dashboard_name" {
  description = "CloudWatch dashboard name."
  type        = string
}

variable "tags" {
  description = "Tags applied to monitoring resources."
  type        = map(string)
  default     = {}
}