variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}

variable "project" {
  type    = string
  default = "smartqueue"
}

variable "dynamodb_table_name" {
  type    = string
  default = "Orders"
}

variable "restaurants_table_name" {
  type    = string
  default = "Restaurants"
}

variable "customers_table_name" {
  type    = string
  default = "Customers"
}

variable "users_table_name" {
  type    = string
  default = "Users"
}

variable "lambda_runtime" {
  type    = string
  default = "nodejs20.x"
}

variable "jwt_secret" {
  type      = string
  default   = "smartqueue-secret"
  sensitive = true
}

variable "master_key" {
  type      = string
  default   = "MASTER-SMARTQUEUE-2024"
  sensitive = true
}
