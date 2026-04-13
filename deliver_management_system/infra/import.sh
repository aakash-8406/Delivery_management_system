#!/bin/bash
# Run this once to import all existing AWS resources into Terraform state
# Usage: bash import.sh

set -e
REGION=ap-southeast-1
API_ID=eml9ar85ug
PROJECT=smartqueue

echo "=== Importing CloudWatch Log Groups ==="
terraform import aws_cloudwatch_log_group.delete_restaurant /aws/lambda/smartqueue-deleteRestaurant
terraform import aws_cloudwatch_log_group.place_order       /aws/lambda/smartqueue-placeOrder
terraform import aws_cloudwatch_log_group.get_orders        /aws/lambda/smartqueue-getOrders
terraform import aws_cloudwatch_log_group.update_order      /aws/lambda/smartqueue-updateOrder
terraform import aws_cloudwatch_log_group.register          /aws/lambda/smartqueue-register
terraform import aws_cloudwatch_log_group.login_fn          /aws/lambda/smartqueue-login
terraform import aws_cloudwatch_log_group.get_restaurant_by_id /aws/lambda/smartqueue-getRestaurantById
terraform import aws_cloudwatch_log_group.get_restaurants   /aws/lambda/smartqueue-getRestaurants
terraform import aws_cloudwatch_log_group.update_restaurant /aws/lambda/smartqueue-updateRestaurant

echo "=== Importing Lambda Permissions ==="
terraform import aws_lambda_permission.delete_restaurant    smartqueue-deleteRestaurant/AllowAPIGatewayInvoke
terraform import aws_lambda_permission.place_order          smartqueue-placeOrder/AllowAPIGatewayInvoke
terraform import aws_lambda_permission.get_orders           smartqueue-getOrders/AllowAPIGatewayInvoke
terraform import aws_lambda_permission.update_order         smartqueue-updateOrder/AllowAPIGatewayInvoke
terraform import aws_lambda_permission.register             smartqueue-register/AllowAPIGatewayInvoke
terraform import aws_lambda_permission.login                smartqueue-login/AllowAPIGatewayInvoke
terraform import aws_lambda_permission.get_restaurant_by_id smartqueue-getRestaurantById/AllowAPIGatewayInvoke
terraform import aws_lambda_permission.get_restaurants      smartqueue-getRestaurants/AllowAPIGatewayInvoke
terraform import aws_lambda_permission.update_restaurant    smartqueue-updateRestaurant/AllowAPIGatewayInvoke

echo "=== All imports done. Running apply ==="
terraform apply -auto-approve
