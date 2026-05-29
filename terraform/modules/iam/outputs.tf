output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role."
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role."
  value       = aws_iam_role.ecs_task.arn
}

output "cloudfront_origin_access_control_id" {
  description = "CloudFront origin access control ID."
  value       = aws_cloudfront_origin_access_control.frontend.id
}

output "cloudfront_origin_access_control_iam_arn" {
  description = "IAM ARN used by CloudFront origin access control."
  value       = "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${aws_cloudfront_origin_access_control.frontend.id}"
}