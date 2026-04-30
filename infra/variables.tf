variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "ap-southeast-1"
}

variable "project" {
  description = "Project name prefix for all resources"
  type        = string
  default     = "smartqueue"
}

variable "lambda_runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "nodejs20.x"
}

variable "jwt_secret" {
  description = "Secret key for signing JWT tokens"
  type        = string
  default     = "smartqueue-jwt-secret-change-in-prod"
  sensitive   = true
}

variable "master_key" {
  description = "Master admin key for managing all restaurants"
  type        = string
  default     = "MASTER-SMARTQUEUE-2024"
  sensitive   = true
}

variable "db_name" {
  description = "RDS database name"
  type        = string
  default     = "smartqueue"
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}
