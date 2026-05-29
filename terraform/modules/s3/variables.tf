variable "name_prefix" {
  description = "Prefix used for naming S3 buckets."
  type        = string
}

variable "account_id" {
  description = "AWS account ID used to ensure globally unique bucket names."
  type        = string
}

variable "frontend_domain_name" {
  description = "Frontend domain name used for CORS and documentation."
  type        = string
  default     = ""
}

variable "cors_allowed_origins" {
  description = "Allowed origins for the documents bucket CORS configuration."
  type        = list(string)
  default     = []
}

variable "logs_retention_days" {
  description = "Retention period for log objects."
  type        = number
  default     = 90
}

variable "backups_expiration_days" {
  description = "Expiration period for backup objects."
  type        = number
  default     = 365
}

variable "noncurrent_version_days" {
  description = "Expiration period for noncurrent object versions."
  type        = number
  default     = 30
}

variable "cloudfront_oac_iam_arn" {
  description = "IAM ARN used by CloudFront origin access control to read frontend assets."
  type        = string
}

variable "enable_frontend_public_alias" {
  description = "Reserved toggle for future public website access patterns."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags applied to S3 resources."
  type        = map(string)
  default     = {}
}