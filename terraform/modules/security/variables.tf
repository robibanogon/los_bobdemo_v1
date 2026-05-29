variable "name_prefix" {
  description = "Prefix used for naming security resources."
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where security resources are created."
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block of the VPC."
  type        = string
}

variable "backend_port" {
  description = "Backend application port exposed by ECS."
  type        = number
  default     = 3001
}

variable "db_port" {
  description = "Database port exposed by RDS."
  type        = number
  default     = 5432
}

variable "tags" {
  description = "Tags applied to security resources."
  type        = map(string)
  default     = {}
}