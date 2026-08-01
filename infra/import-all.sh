#!/bin/bash
# Run this once to import all existing AWS resources into Terraform state
# Usage: cd deliver_management_system/infra && bash import-all.sh

set -e

echo "=== Importing DynamoDB Tables ==="
terraform import aws_dynamodb_table.orders Orders 2>/dev/null || echo "already imported"
terraform import aws_dynamodb_table.restaurants Restaurants 2>/dev/null || echo "already imported"
terraform import aws_dynamodb_table.customers Customers 2>/dev/null || echo "already imported"
terraform import aws_dynamodb_table.users Users 2>/dev/null || echo "already imported"

echo "=== Importing IAM Role ==="
terraform import aws_iam_role.lambda_exec smartqueue-lambda-exec-role 2>/dev/null || echo "already imported"

echo "=== Importing Lambda Functions ==="
terraform import aws_lambda_function.register smartqueue-register 2>/dev/null || echo "already imported"
terraform import aws_lambda_function.login smartqueue-login 2>/dev/null || echo "already imported"
terraform import aws_lambda_function.get_orders smartqueue-getOrders 2>/dev/null || echo "already imported"
terraform import aws_lambda_function.place_order smartqueue-placeOrder 2>/dev/null || echo "already imported"
terraform import aws_lambda_function.update_order smartqueue-updateOrder 2>/dev/null || echo "already imported"
terraform import aws_lambda_function.get_restaurants smartqueue-getRestaurants 2>/dev/null || echo "already imported"
terraform import aws_lambda_function.get_restaurant_by_id smartqueue-getRestaurantById 2>/dev/null || echo "already imported"
terraform import aws_lambda_function.update_restaurant smartqueue-updateRestaurant 2>/dev/null || echo "already imported"
terraform import aws_lambda_function.delete_restaurant smartqueue-deleteRestaurant 2>/dev/null || echo "already imported"
terraform import aws_lambda_function.customer_register smartqueue-customerRegister 2>/dev/null || echo "already imported"
terraform import aws_lambda_function.customer_login smartqueue-customerLogin 2>/dev/null || echo "already imported"

echo "=== Importing API Gateway ==="
terraform import aws_apigatewayv2_api.main eml9ar85ug 2>/dev/null || echo "already imported"

echo "=== Importing CloudWatch Log Groups ==="
terraform import aws_cloudwatch_log_group.api_gw /aws/apigateway/smartqueue-api 2>/dev/null || echo "already imported"
terraform import aws_cloudwatch_log_group.place_order /aws/lambda/smartqueue-placeOrder 2>/dev/null || echo "already imported"
terraform import aws_cloudwatch_log_group.get_orders /aws/lambda/smartqueue-getOrders 2>/dev/null || echo "already imported"
terraform import aws_cloudwatch_log_group.update_order /aws/lambda/smartqueue-updateOrder 2>/dev/null || echo "already imported"
terraform import aws_cloudwatch_log_group.register /aws/lambda/smartqueue-register 2>/dev/null || echo "already imported"
terraform import aws_cloudwatch_log_group.login_fn /aws/lambda/smartqueue-login 2>/dev/null || echo "already imported"
terraform import aws_cloudwatch_log_group.get_restaurant_by_id /aws/lambda/smartqueue-getRestaurantById 2>/dev/null || echo "already imported"
terraform import aws_cloudwatch_log_group.get_restaurants /aws/lambda/smartqueue-getRestaurants 2>/dev/null || echo "already imported"
terraform import aws_cloudwatch_log_group.update_restaurant /aws/lambda/smartqueue-updateRestaurant 2>/dev/null || echo "already imported"
terraform import aws_cloudwatch_log_group.delete_restaurant /aws/lambda/smartqueue-deleteRestaurant 2>/dev/null || echo "already imported"
terraform import aws_cloudwatch_log_group.customer_register /aws/lambda/smartqueue-customerRegister 2>/dev/null || echo "already imported"
terraform import aws_cloudwatch_log_group.customer_login /aws/lambda/smartqueue-customerLogin 2>/dev/null || echo "already imported"

echo "=== Importing Lambda Permissions ==="
terraform import aws_lambda_permission.register smartqueue-register/AllowAPIGatewayInvoke 2>/dev/null || echo "already imported"
terraform import aws_lambda_permission.login smartqueue-login/AllowAPIGatewayInvoke 2>/dev/null || echo "already imported"
terraform import aws_lambda_permission.get_orders smartqueue-getOrders/AllowAPIGatewayInvoke 2>/dev/null || echo "already imported"
terraform import aws_lambda_permission.place_order smartqueue-placeOrder/AllowAPIGatewayInvoke 2>/dev/null || echo "already imported"
terraform import aws_lambda_permission.update_order smartqueue-updateOrder/AllowAPIGatewayInvoke 2>/dev/null || echo "already imported"
terraform import aws_lambda_permission.get_restaurants smartqueue-getRestaurants/AllowAPIGatewayInvoke 2>/dev/null || echo "already imported"
terraform import aws_lambda_permission.get_restaurant_by_id smartqueue-getRestaurantById/AllowAPIGatewayInvoke 2>/dev/null || echo "already imported"
terraform import aws_lambda_permission.update_restaurant smartqueue-updateRestaurant/AllowAPIGatewayInvoke 2>/dev/null || echo "already imported"
terraform import aws_lambda_permission.delete_restaurant smartqueue-deleteRestaurant/AllowAPIGatewayInvoke 2>/dev/null || echo "already imported"
terraform import aws_lambda_permission.customer_register smartqueue-customerRegister/AllowAPIGatewayInvoke 2>/dev/null || echo "already imported"
terraform import aws_lambda_permission.customer_login smartqueue-customerLogin/AllowAPIGatewayInvoke 2>/dev/null || echo "already imported"

echo ""
echo "=== All imports done. Running apply ==="
terraform apply -auto-approve
