output "api_gateway_url" {
  description = "API Gateway base URL — set as VITE_API_URL in both React apps"
  value       = aws_apigatewayv2_stage.default.invoke_url
}
output "dynamodb_orders_table"      { value = aws_dynamodb_table.orders.name }
output "dynamodb_restaurants_table" { value = aws_dynamodb_table.restaurants.name }

output "cognito_customer_pool_id"     { value = aws_cognito_user_pool.customers.id }
output "cognito_customer_client_id"   { value = aws_cognito_user_pool_client.customers.id }
output "cognito_restaurant_pool_id"   { value = aws_cognito_user_pool.restaurants.id }
output "cognito_restaurant_client_id" { value = aws_cognito_user_pool_client.restaurants.id }
