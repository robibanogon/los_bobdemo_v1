variable "name_prefix" {
  description = "Prefix used for naming ALB resources."
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for the target group."
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for the ALB."
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "Security group ID attached to the ALB."
  type        = string
}

variable "target_group_port" {
  description = "Backend target group port."
  type        = number
  default     = 3001
}

variable "health_check_path" {
  description = "Health check path for the backend service."
  type        = string
  default     = "/health"
}

variable "certificate_arn" {
  description = "ACM certificate ARN for the HTTPS listener."
  type        = string
  default     = ""
}

variable "enable_https_listener" {
  description = "Whether to create the HTTPS listener."
  type        = bool
  default     = true
}

variable "access_logs_bucket_name" {
  description = "S3 bucket name for ALB access logs."
  type        = string
}

variable "access_logs_prefix" {
  description = "S3 prefix for ALB access logs."
  type        = string
  default     = "alb"
}

variable "deletion_protection" {
  description = "Enable deletion protection on the ALB."
  type        = bool
  default     = false
}

variable "idle_timeout" {
  description = "Idle timeout in seconds."
  type        = number
  default     = 60
}

variable "tags" {
  description = "Tags applied to ALB resources."
  type        = map(string)
  default     = {}
}