output "vpc_id" {
  description = "VPC ID."
  value       = aws_vpc.this.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs."
  value       = [for subnet in aws_subnet.public : subnet.id]
}

output "private_subnet_ids" {
  description = "Private application subnet IDs."
  value       = [for subnet in aws_subnet.private : subnet.id]
}

output "database_subnet_ids" {
  description = "Private database subnet IDs."
  value       = [for subnet in aws_subnet.database : subnet.id]
}

output "internet_gateway_id" {
  description = "Internet Gateway ID."
  value       = aws_internet_gateway.this.id
}

output "nat_gateway_ids" {
  description = "NAT Gateway IDs."
  value       = [for nat in aws_nat_gateway.this : nat.id]
}

output "public_route_table_id" {
  description = "Public route table ID."
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "Private route table IDs."
  value       = [for route_table in aws_route_table.private : route_table.id]
}

output "database_route_table_ids" {
  description = "Database route table IDs."
  value       = [for route_table in aws_route_table.database : route_table.id]
}