output "alb_security_group_id" {
  description = "Security group ID for the ALB."
  value       = aws_security_group.alb.id
}

output "ecs_security_group_id" {
  description = "Security group ID for ECS tasks."
  value       = aws_security_group.ecs.id
}

output "rds_security_group_id" {
  description = "Security group ID for RDS."
  value       = aws_security_group.rds.id
}

output "public_network_acl_id" {
  description = "Network ACL ID for public subnets."
  value       = aws_network_acl.public.id
}

output "private_network_acl_id" {
  description = "Network ACL ID for private and database subnets."
  value       = aws_network_acl.private.id
}