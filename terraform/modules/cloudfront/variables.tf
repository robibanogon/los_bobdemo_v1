variable "name_prefix" {
  description = "Prefix used for naming CloudFront resources."
  type        = string
}

variable "frontend_bucket_name" {
  description = "Frontend bucket name."
  type        = string
}

variable "frontend_bucket_regional_domain_name" {
  description = "Regional domain name of the frontend bucket."
  type        = string
}

variable "alb_dns_name" {
  description = "DNS name of the Application Load Balancer."
  type        = string
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN in us-east-1."
  type        = string
}

variable "aliases" {
  description = "Custom domain aliases for the distribution."
  type        = list(string)
  default     = []
}

variable "logs_bucket_domain_name" {
  description = "S3 bucket domain name for CloudFront logs."
  type        = string
}

variable "logs_prefix" {
  description = "Prefix for CloudFront logs."
  type        = string
  default     = "cloudfront/"
}

variable "default_root_object" {
  description = "Default root object."
  type        = string
  default     = "index.html"
}

variable "price_class" {
  description = "CloudFront price class."
  type        = string
  default     = "PriceClass_100"
}

variable "web_acl_id" {
  description = "Optional WAF web ACL ID."
  type        = string
  default     = null
}

variable "api_path_pattern" {
  description = "Path pattern routed to the ALB origin."
  type        = string
  default     = "/api/*"
}

variable "origin_access_control_id" {
  description = "CloudFront origin access control ID for the frontend bucket."
  type        = string
}

variable "tags" {
  description = "Tags applied to CloudFront resources."
  type        = map(string)
  default     = {}
}