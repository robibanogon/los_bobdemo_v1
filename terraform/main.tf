terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = local.common_tags
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

locals {
  selected_azs = length(var.availability_zones) > 0 ? var.availability_zones : slice(data.aws_availability_zones.available.names, 0, 2)

  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = merge(
    {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    },
    var.additional_tags
  )

  frontend_aliases = compact(distinct([
    var.domain_name,
    var.frontend_domain_name
  ]))

  create_dns_records = var.route53_zone_id != null && var.route53_zone_id != ""
}

module "vpc" {
  source = "./modules/vpc"

  name_prefix           = local.name_prefix
  vpc_cidr              = var.vpc_cidr
  availability_zones    = local.selected_azs
  public_subnet_cidrs   = var.public_subnet_cidrs
  private_subnet_cidrs  = var.private_subnet_cidrs
  database_subnet_cidrs = var.database_subnet_cidrs
  tags                  = local.common_tags
}

module "security" {
  source = "./modules/security"

  name_prefix = local.name_prefix
  vpc_id      = module.vpc.vpc_id
  vpc_cidr    = var.vpc_cidr
  tags        = local.common_tags
}

module "iam" {
  source = "./modules/iam"

  name_prefix            = local.name_prefix
  aws_region             = var.aws_region
  account_id             = data.aws_caller_identity.current.account_id
  documents_bucket_arn   = module.s3.documents_bucket_arn
  backups_bucket_arn     = module.s3.backups_bucket_arn
  logs_bucket_arn        = module.s3.logs_bucket_arn
  secrets_manager_arns   = var.secrets_manager_arns
  kms_key_arns           = var.kms_key_arns
  frontend_bucket_arn    = module.s3.frontend_bucket_arn
  tags                   = local.common_tags
}

module "s3" {
  source = "./modules/s3"

  name_prefix                  = local.name_prefix
  account_id                   = data.aws_caller_identity.current.account_id
  frontend_domain_name         = var.frontend_domain_name != "" ? var.frontend_domain_name : var.domain_name
  cors_allowed_origins         = var.cors_allowed_origins
  logs_retention_days          = var.logs_retention_days
  backups_expiration_days      = var.backups_expiration_days
  noncurrent_version_days      = var.noncurrent_version_days
  cloudfront_oac_iam_arn       = module.iam.cloudfront_origin_access_control_iam_arn
  enable_frontend_public_alias = false
  tags                         = local.common_tags
}

module "alb" {
  source = "./modules/alb"

  name_prefix              = local.name_prefix
  vpc_id                   = module.vpc.vpc_id
  public_subnet_ids        = module.vpc.public_subnet_ids
  alb_security_group_id    = module.security.alb_security_group_id
  target_group_port        = var.backend_container_port
  health_check_path        = var.alb_health_check_path
  certificate_arn          = var.acm_certificate_arn
  enable_https_listener    = var.enable_https_listener
  access_logs_bucket_name  = module.s3.logs_bucket_name
  access_logs_prefix       = "alb"
  deletion_protection      = var.alb_deletion_protection
  idle_timeout             = var.alb_idle_timeout
  tags                     = local.common_tags
}

module "rds" {
  source = "./modules/rds"

  name_prefix                  = local.name_prefix
  db_name                      = var.db_name
  db_username                  = var.db_username
  db_password                  = var.db_password
  db_port                      = var.db_port
  db_instance_class            = var.db_instance_class
  allocated_storage            = var.db_allocated_storage
  max_allocated_storage        = var.db_max_allocated_storage
  storage_type                 = var.db_storage_type
  multi_az                     = var.db_multi_az
  backup_retention_period      = var.db_backup_retention_period
  backup_window                = var.db_backup_window
  maintenance_window           = var.db_maintenance_window
  database_subnet_ids          = module.vpc.database_subnet_ids
  rds_security_group_id        = module.security.rds_security_group_id
  deletion_protection          = var.db_deletion_protection
  skip_final_snapshot          = var.db_skip_final_snapshot
  final_snapshot_identifier    = var.db_skip_final_snapshot ? null : "${local.name_prefix}-final-${replace(timestamp(), ":", "-")}"
  performance_insights_enabled = var.db_performance_insights_enabled
  monitoring_interval          = var.db_monitoring_interval
  kms_key_id                   = var.db_kms_key_id
  enabled_cloudwatch_logs      = var.db_enabled_cloudwatch_logs
  tags                         = local.common_tags
}

module "ecs" {
  source = "./modules/ecs"

  name_prefix                = local.name_prefix
  aws_region                 = var.aws_region
  cluster_name               = "${local.name_prefix}-cluster"
  service_name               = "${local.name_prefix}-backend"
  container_name             = "${var.project_name}-backend"
  container_image            = var.backend_container_image
  container_port             = var.backend_container_port
  task_cpu                   = var.ecs_task_cpu
  task_memory                = var.ecs_task_memory
  desired_count              = var.ecs_desired_count
  min_capacity               = var.ecs_min_capacity
  max_capacity               = var.ecs_max_capacity
  cpu_target_utilization     = var.ecs_cpu_target_utilization
  memory_target_utilization  = var.ecs_memory_target_utilization
  private_subnet_ids         = module.vpc.private_subnet_ids
  ecs_security_group_id      = module.security.ecs_security_group_id
  target_group_arn           = module.alb.target_group_arn
  task_execution_role_arn    = module.iam.ecs_task_execution_role_arn
  task_role_arn              = module.iam.ecs_task_role_arn
  log_retention_days         = var.ecs_log_retention_days
  assign_public_ip           = false
  environment_variables      = var.ecs_environment_variables
  secrets                    = var.ecs_secrets
  health_check_command       = var.ecs_health_check_command
  deployment_min_healthy_pct = var.ecs_deployment_min_healthy_percent
  deployment_max_percent     = var.ecs_deployment_max_percent
  tags                       = local.common_tags
}

module "cloudfront" {
  source = "./modules/cloudfront"

  providers = {
    aws.us_east_1 = aws.us_east_1
  }

  name_prefix                    = local.name_prefix
  frontend_bucket_name           = module.s3.frontend_bucket_name
  frontend_bucket_regional_domain_name = module.s3.frontend_bucket_regional_domain_name
  alb_dns_name                   = module.alb.alb_dns_name
  acm_certificate_arn            = var.acm_certificate_arn
  aliases                        = local.frontend_aliases
  logs_bucket_domain_name        = module.s3.logs_bucket_domain_name
  logs_prefix                    = "cloudfront/"
  default_root_object            = "index.html"
  price_class                    = var.cloudfront_price_class
  web_acl_id                     = var.cloudfront_web_acl_id
  api_path_pattern               = var.cloudfront_api_path_pattern
  tags                           = local.common_tags
}

module "monitoring" {
  source = "./modules/monitoring"

  name_prefix               = local.name_prefix
  ecs_cluster_name          = module.ecs.cluster_name
  ecs_service_name          = module.ecs.service_name
  ecs_log_group_name        = module.ecs.log_group_name
  alb_arn_suffix            = module.alb.alb_arn_suffix
  target_group_arn_suffix   = module.alb.target_group_arn_suffix
  rds_instance_id           = module.rds.db_instance_id
  sns_topic_name            = "${local.name_prefix}-alerts"
  alert_email_endpoints     = var.alert_email_endpoints
  ecs_cpu_threshold         = var.alarm_ecs_cpu_threshold
  ecs_memory_threshold      = var.alarm_ecs_memory_threshold
  alb_5xx_threshold         = var.alarm_alb_5xx_threshold
  unhealthy_hosts_threshold = var.alarm_unhealthy_hosts_threshold
  rds_connections_threshold = var.alarm_rds_connections_threshold
  rds_free_storage_threshold = var.alarm_rds_free_storage_threshold
  dashboard_name            = "${upper(var.project_name)}-${upper(var.environment)}-Overview"
  tags                      = local.common_tags
}

resource "aws_route53_record" "frontend_alias_a" {
  count = local.create_dns_records && length(local.frontend_aliases) > 0 ? 1 : 0

  zone_id = var.route53_zone_id
  name    = local.frontend_aliases[0]
  type    = "A"

  alias {
    name                   = module.cloudfront.distribution_domain_name
    zone_id                = module.cloudfront.distribution_hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "frontend_alias_aaaa" {
  count = local.create_dns_records && length(local.frontend_aliases) > 0 ? 1 : 0

  zone_id = var.route53_zone_id
  name    = local.frontend_aliases[0]
  type    = "AAAA"

  alias {
    name                   = module.cloudfront.distribution_domain_name
    zone_id                = module.cloudfront.distribution_hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "frontend_www_a" {
  count = local.create_dns_records && var.frontend_domain_name != "" && var.frontend_domain_name != local.frontend_aliases[0] ? 1 : 0

  zone_id = var.route53_zone_id
  name    = var.frontend_domain_name
  type    = "A"

  alias {
    name                   = module.cloudfront.distribution_domain_name
    zone_id                = module.cloudfront.distribution_hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "frontend_www_aaaa" {
  count = local.create_dns_records && var.frontend_domain_name != "" && var.frontend_domain_name != local.frontend_aliases[0] ? 1 : 0

  zone_id = var.route53_zone_id
  name    = var.frontend_domain_name
  type    = "AAAA"

  alias {
    name                   = module.cloudfront.distribution_domain_name
    zone_id                = module.cloudfront.distribution_hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "api_alias" {
  count = local.create_dns_records && var.api_domain_name != "" ? 1 : 0

  zone_id = var.route53_zone_id
  name    = var.api_domain_name
  type    = "A"

  alias {
    name                   = module.alb.alb_dns_name
    zone_id                = module.alb.alb_zone_id
    evaluate_target_health = true
  }
}