output "vpc_id" {
  description = "ID of the provisioned VPC."
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets."
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private application subnets."
  value       = module.vpc.private_subnet_ids
}

output "database_subnet_ids" {
  description = "IDs of the private database subnets."
  value       = module.vpc.database_subnet_ids
}

output "alb_security_group_id" {
  description = "Security group ID for the Application Load Balancer."
  value       = module.security.alb_security_group_id
}

output "ecs_security_group_id" {
  description = "Security group ID for ECS tasks."
  value       = module.security.ecs_security_group_id
}

output "rds_security_group_id" {
  description = "Security group ID for the RDS instance."
  value       = module.security.rds_security_group_id
}

output "rds_endpoint" {
  description = "RDS instance endpoint."
  value       = module.rds.db_endpoint
}

output "rds_reader_endpoint" {
  description = "RDS reader endpoint."
  value       = module.rds.db_reader_endpoint
}

output "rds_instance_id" {
  description = "RDS instance identifier."
  value       = module.rds.db_instance_id
}

output "documents_bucket_name" {
  description = "Name of the documents S3 bucket."
  value       = module.s3.documents_bucket_name
}

output "frontend_bucket_name" {
  description = "Name of the frontend S3 bucket."
  value       = module.s3.frontend_bucket_name
}

output "backups_bucket_name" {
  description = "Name of the backups S3 bucket."
  value       = module.s3.backups_bucket_name
}

output "logs_bucket_name" {
  description = "Name of the logs S3 bucket."
  value       = module.s3.logs_bucket_name
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer."
  value       = module.alb.alb_dns_name
}

output "alb_zone_id" {
  description = "Hosted zone ID of the Application Load Balancer."
  value       = module.alb.alb_zone_id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID."
  value       = module.cloudfront.distribution_id
}

output "cloudfront_distribution_domain_name" {
  description = "CloudFront distribution domain name."
  value       = module.cloudfront.distribution_domain_name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster."
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "Name of the ECS service."
  value       = module.ecs.service_name
}

output "ecs_log_group_name" {
  description = "CloudWatch log group used by the ECS service."
  value       = module.ecs.log_group_name
}

output "sns_alerts_topic_arn" {
  description = "SNS topic ARN for infrastructure alerts."
  value       = module.monitoring.sns_topic_arn
}

output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name."
  value       = module.monitoring.dashboard_name
}

output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role."
  value       = module.iam.ecs_task_execution_role_arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role."
  value       = module.iam.ecs_task_role_arn
}