variable "name_prefix" {
  description = "Prefix used for naming IAM resources."
  type        = string
}

variable "aws_region" {
  description = "AWS region for policy scoping."
  type        = string
}

variable "account_id" {
  description = "AWS account ID."
  type        = string
}

variable "documents_bucket_arn" {
  description = "ARN of the documents bucket."
  type        = string
}

variable "backups_bucket_arn" {
  description = "ARN of the backups bucket."
  type        = string
}

variable "logs_bucket_arn" {
  description = "ARN of the logs bucket."
  type        = string
}

variable "frontend_bucket_arn" {
  description = "ARN of the frontend bucket."
  type        = string
}

variable "secrets_manager_arns" {
  description = "Secrets Manager ARNs accessible by ECS."
  type        = list(string)
  default     = []
}

variable "kms_key_arns" {
  description = "KMS key ARNs accessible by ECS."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags applied to IAM resources."
  type        = map(string)
  default     = {}
}