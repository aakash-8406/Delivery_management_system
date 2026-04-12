output "api_gateway_url" {
  description = "API Gateway base URL — set as VITE_API_URL in both React apps"
  value       = aws_apigatewayv2_stage.default.invoke_url
}
output "dynamodb_orders_table"      { value = aws_dynamodb_table.orders.name }
output "dynamodb_restaurants_table" { value = aws_dynamodb_table.restaurants.name }
