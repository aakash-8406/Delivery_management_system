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

variable "dynamodb_table_name" {
  description = "DynamoDB orders table name"
  type        = string
  default     = "Orders"
}

variable "restaurants_table_name" {
  description = "DynamoDB restaurants table name"
  type        = string
  default     = "Restaurants"
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
