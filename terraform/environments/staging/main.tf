terraform {
  required_version = ">= 1.5.0"

  backend "s3" {
    bucket         = "los-terraform-state"
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "los-terraform-locks"
    encrypt        = true
  }
}

module "los_infrastructure" {
  source = "../../"

  aws_region                    = var.aws_region
  environment                   = "staging"
  project_name                  = var.project_name
  availability_zones            = var.availability_zones
  vpc_cidr                      = var.vpc_cidr
  public_subnet_cidrs           = var.public_subnet_cidrs
  private_subnet_cidrs          = var.private_subnet_cidrs
  database_subnet_cidrs         = var.database_subnet_cidrs
  domain_name                   = var.domain_name
  frontend_domain_name          = var.frontend_domain_name
  api_domain_name               = var.api_domain_name
  route53_zone_id               = var.route53_zone_id
  acm_certificate_arn           = var.acm_certificate_arn
  enable_https_listener         = var.enable_https_listener
  alb_health_check_path         = var.alb_health_check_path
  alb_deletion_protection       = true
  alb_idle_timeout              = var.alb_idle_timeout
  backend_container_image       = var.backend_container_image
  backend_container_port        = var.backend_container_port
  ecs_task_cpu                  = 512
  ecs_task_memory               = 1024
  ecs_desired_count             = 2
  ecs_min_capacity              = 2
  ecs_max_capacity              = 6
  ecs_cpu_target_utilization    = 70
  ecs_memory_target_utilization = 80
  ecs_log_retention_days        = 30
  ecs_environment_variables     = var.ecs_environment_variables
  ecs_secrets                   = var.ecs_secrets
  ecs_health_check_command      = var.ecs_health_check_command
  db_name                       = var.db_name
  db_username                   = var.db_username
  db_password                   = var.db_password
  db_instance_class             = "db.t3.micro"
  db_allocated_storage          = 20
  db_max_allocated_storage      = 150
  db_storage_type               = "gp3"
  db_multi_az                   = true
  db_backup_retention_period    = 7
  db_backup_window              = "03:00-04:00"
  db_maintenance_window         = "Sun:04:00-Sun:05:00"
  db_deletion_protection        = true
  db_skip_final_snapshot        = false
  cors_allowed_origins          = var.cors_allowed_origins
  logs_retention_days           = 60
  backups_expiration_days       = 180
  noncurrent_version_days       = 30
  cloudfront_price_class        = "PriceClass_100"
  cloudfront_web_acl_id         = var.cloudfront_web_acl_id
  secrets_manager_arns          = var.secrets_manager_arns
  kms_key_arns                  = var.kms_key_arns
  alert_email_endpoints         = var.alert_email_endpoints
  additional_tags               = merge(var.additional_tags, { EnvironmentType = "staging" })
}