output "documents_bucket_name" {
  description = "Documents bucket name."
  value       = aws_s3_bucket.documents.bucket
}

output "documents_bucket_arn" {
  description = "Documents bucket ARN."
  value       = aws_s3_bucket.documents.arn
}

output "frontend_bucket_name" {
  description = "Frontend bucket name."
  value       = aws_s3_bucket.frontend.bucket
}

output "frontend_bucket_arn" {
  description = "Frontend bucket ARN."
  value       = aws_s3_bucket.frontend.arn
}

output "frontend_bucket_regional_domain_name" {
  description = "Regional domain name for the frontend bucket."
  value       = aws_s3_bucket.frontend.bucket_regional_domain_name
}

output "backups_bucket_name" {
  description = "Backups bucket name."
  value       = aws_s3_bucket.backups.bucket
}

output "backups_bucket_arn" {
  description = "Backups bucket ARN."
  value       = aws_s3_bucket.backups.arn
}

output "logs_bucket_name" {
  description = "Logs bucket name."
  value       = aws_s3_bucket.logs.bucket
}

output "logs_bucket_arn" {
  description = "Logs bucket ARN."
  value       = aws_s3_bucket.logs.arn
}

output "logs_bucket_domain_name" {
  description = "Logs bucket domain name."
  value       = aws_s3_bucket.logs.bucket_domain_name
}