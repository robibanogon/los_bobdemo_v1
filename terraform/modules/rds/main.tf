terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

resource "aws_db_subnet_group" "this" {
  name       = "${var.name_prefix}-db-subnet-group"
  subnet_ids = var.database_subnet_ids

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-db-subnet-group"
  })
}

resource "aws_db_parameter_group" "this" {
  name        = "${var.name_prefix}-postgres15"
  family      = "postgres15"
  description = "Custom PostgreSQL 15 parameter group for ${var.name_prefix}."

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-postgres15"
  })
}

resource "aws_db_instance" "this" {
  identifier                          = "${var.name_prefix}-postgres"
  engine                              = "postgres"
  engine_version                      = "15.7"
  instance_class                      = var.db_instance_class
  allocated_storage                   = var.allocated_storage
  max_allocated_storage               = var.max_allocated_storage
  storage_type                        = var.storage_type
  storage_encrypted                   = true
  kms_key_id                          = var.kms_key_id
  db_name                             = var.db_name
  username                            = var.db_username
  password                            = var.db_password
  port                                = var.db_port
  multi_az                            = var.multi_az
  db_subnet_group_name                = aws_db_subnet_group.this.name
  vpc_security_group_ids              = [var.rds_security_group_id]
  parameter_group_name                = aws_db_parameter_group.this.name
  backup_retention_period             = var.backup_retention_period
  backup_window                       = var.backup_window
  maintenance_window                  = var.maintenance_window
  deletion_protection                 = var.deletion_protection
  skip_final_snapshot                 = var.skip_final_snapshot
  final_snapshot_identifier           = var.final_snapshot_identifier
  auto_minor_version_upgrade          = true
  apply_immediately                   = false
  copy_tags_to_snapshot               = true
  performance_insights_enabled        = var.performance_insights_enabled
  performance_insights_retention_period = var.performance_insights_enabled ? 7 : null
  monitoring_interval                 = var.monitoring_interval
  enabled_cloudwatch_logs_exports     = var.enabled_cloudwatch_logs
  publicly_accessible                 = false
  deletion_protection                 = var.deletion_protection

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-postgres"
    Tier = "database"
  })
}