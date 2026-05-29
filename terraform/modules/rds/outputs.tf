output "db_instance_id" {
  description = "RDS instance identifier."
  value       = aws_db_instance.this.id
}

output "db_endpoint" {
  description = "Primary RDS endpoint."
  value       = aws_db_instance.this.address
}

output "db_reader_endpoint" {
  description = "Reader endpoint for the RDS instance."
  value       = aws_db_instance.this.address
}

output "db_port" {
  description = "Database port."
  value       = aws_db_instance.this.port
}

output "db_subnet_group_name" {
  description = "DB subnet group name."
  value       = aws_db_subnet_group.this.name
}

output "db_parameter_group_name" {
  description = "DB parameter group name."
  value       = aws_db_parameter_group.this.name
}