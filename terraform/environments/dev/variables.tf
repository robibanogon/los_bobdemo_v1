variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project_name" {
  type    = string
  default = "los"
}

variable "availability_zones" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b"]
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "database_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.21.0/24", "10.0.22.0/24"]
}

variable "domain_name" {
  type    = string
  default = "dev.los.example.com"
}

variable "frontend_domain_name" {
  type    = string
  default = "www.dev.los.example.com"
}

variable "api_domain_name" {
  type    = string
  default = "api.dev.los.example.com"
}

variable "route53_zone_id" {
  type    = string
  default = ""
}

variable "acm_certificate_arn" {
  type    = string
  default = ""
}

variable "enable_https_listener" {
  type    = bool
  default = true
}

variable "alb_health_check_path" {
  type    = string
  default = "/health"
}

variable "alb_idle_timeout" {
  type    = number
  default = 60
}

variable "backend_container_image" {
  type = string
}

variable "backend_container_port" {
  type    = number
  default = 3001
}

variable "ecs_environment_variables" {
  type = list(object({
    name  = string
    value = string
  }))
  default = [
    {
      name  = "NODE_ENV"
      value = "development"
    },
    {
      name  = "PORT"
      value = "3001"
    }
  ]
}

variable "ecs_secrets" {
  type = list(object({
    name      = string
    valueFrom = string
  }))
  default = []
}

variable "ecs_health_check_command" {
  type    = list(string)
  default = ["CMD-SHELL", "node -e \"require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""]
}

variable "db_name" {
  type    = string
  default = "los_dev"
}

variable "db_username" {
  type    = string
  default = "los_admin"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "cors_allowed_origins" {
  type    = list(string)
  default = ["https://dev.los.example.com", "https://www.dev.los.example.com"]
}

variable "cloudfront_web_acl_id" {
  type    = string
  default = null
}

variable "secrets_manager_arns" {
  type    = list(string)
  default = []
}

variable "kms_key_arns" {
  type    = list(string)
  default = []
}

variable "alert_email_endpoints" {
  type    = list(string)
  default = []
}

variable "additional_tags" {
  type    = map(string)
  default = {}
}