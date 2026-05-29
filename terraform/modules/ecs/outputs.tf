output "cluster_name" {
  description = "ECS cluster name."
  value       = aws_ecs_cluster.this.name
}

output "cluster_arn" {
  description = "ECS cluster ARN."
  value       = aws_ecs_cluster.this.arn
}

output "service_name" {
  description = "ECS service name."
  value       = aws_ecs_service.backend.name
}

output "service_arn" {
  description = "ECS service ARN."
  value       = aws_ecs_service.backend.id
}

output "task_definition_arn" {
  description = "Task definition ARN."
  value       = aws_ecs_task_definition.backend.arn
}

output "log_group_name" {
  description = "CloudWatch log group name for ECS."
  value       = aws_cloudwatch_log_group.ecs.name
}