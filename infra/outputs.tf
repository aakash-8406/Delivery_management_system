output "api_gateway_url" {
  description = "API Gateway base URL — set as VITE_API_URL in both React apps"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "rds_endpoint" {
  description = "RDS MySQL endpoint"
  value       = var.db_host
}

output "rds_database" {
  description = "RDS database name"
  value       = var.db_name
}
