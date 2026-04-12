terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" { region = var.aws_region }

data "aws_caller_identity" "current" {}

# ─── DynamoDB ─────────────────────────────────────────────────────────────────

resource "aws_dynamodb_table" "orders" {
  name         = var.dynamodb_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  attribute {
    name = "id"
    type = "S"
  }
  tags = { Project = var.project }
}

resource "aws_dynamodb_table" "restaurants" {
  name         = var.restaurants_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "restaurantId"
  attribute {
    name = "restaurantId"
    type = "S"
  }
  tags = { Project = var.project }
}

# ─── IAM ──────────────────────────────────────────────────────────────────────

resource "aws_iam_role" "lambda_exec" {
  name = "${var.project}-lambda-exec-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
  tags = { Project = var.project }
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "dynamodb_access" {
  name = "${var.project}-dynamodb-policy"
  role = aws_iam_role.lambda_exec.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:UpdateItem",
        "dynamodb:DeleteItem", "dynamodb:Scan", "dynamodb:Query"
      ]
      Resource = [
        aws_dynamodb_table.orders.arn,
        aws_dynamodb_table.restaurants.arn
      ]
    }]
  })
}

# ─── Locals ───────────────────────────────────────────────────────────────────

locals {
  account_id      = data.aws_caller_identity.current.account_id
  api_arn_prefix  = "arn:aws:execute-api:${var.aws_region}:${local.account_id}:${aws_apigatewayv2_api.main.id}/*/*"
  orders_env = {
    TABLE_NAME = aws_dynamodb_table.orders.name
    JWT_SECRET = var.jwt_secret
  }
  restaurants_env = {
    RESTAURANTS_TABLE = aws_dynamodb_table.restaurants.name
    JWT_SECRET        = var.jwt_secret
    MASTER_KEY        = var.master_key
  }
}

# ─── Lambda zips ──────────────────────────────────────────────────────────────

data "archive_file" "place_order_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/placeOrder/index.mjs"
  output_path = "${path.module}/.build/placeOrder.zip"
}
data "archive_file" "get_orders_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/getOrders/index.mjs"
  output_path = "${path.module}/.build/getOrders.zip"
}
data "archive_file" "update_order_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/updateOrder/index.mjs"
  output_path = "${path.module}/.build/updateOrder.zip"
}
data "archive_file" "register_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/register/index.mjs"
  output_path = "${path.module}/.build/register.zip"
}
data "archive_file" "login_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/login/index.mjs"
  output_path = "${path.module}/.build/login.zip"
}
data "archive_file" "delete_restaurant_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/deleteRestaurant/index.mjs"
  output_path = "${path.module}/.build/deleteRestaurant.zip"
}
data "archive_file" "get_restaurant_by_id_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/getRestaurantById/index.mjs"
  output_path = "${path.module}/.build/getRestaurantById.zip"
}
data "archive_file" "get_restaurants_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/getRestaurants/index.mjs"
  output_path = "${path.module}/.build/getRestaurants.zip"
}
data "archive_file" "update_restaurant_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/updateRestaurant/index.mjs"
  output_path = "${path.module}/.build/updateRestaurant.zip"
}

# ─── Lambda functions ─────────────────────────────────────────────────────────

resource "aws_lambda_function" "place_order" {
  function_name    = "${var.project}-placeOrder"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = var.lambda_runtime
  handler          = "index.handler"
  filename         = data.archive_file.place_order_zip.output_path
  source_code_hash = data.archive_file.place_order_zip.output_base64sha256
  environment { variables = local.orders_env }
  tags = { Project = var.project }
}

resource "aws_lambda_function" "get_orders" {
  function_name    = "${var.project}-getOrders"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = var.lambda_runtime
  handler          = "index.handler"
  filename         = data.archive_file.get_orders_zip.output_path
  source_code_hash = data.archive_file.get_orders_zip.output_base64sha256
  environment { variables = local.orders_env }
  tags = { Project = var.project }
}

resource "aws_lambda_function" "update_order" {
  function_name    = "${var.project}-updateOrder"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = var.lambda_runtime
  handler          = "index.handler"
  filename         = data.archive_file.update_order_zip.output_path
  source_code_hash = data.archive_file.update_order_zip.output_base64sha256
  environment { variables = local.orders_env }
  tags = { Project = var.project }
}

resource "aws_lambda_function" "register" {
  function_name    = "${var.project}-register"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = var.lambda_runtime
  handler          = "index.handler"
  filename         = data.archive_file.register_zip.output_path
  source_code_hash = data.archive_file.register_zip.output_base64sha256
  environment { variables = local.restaurants_env }
  tags = { Project = var.project }
}

resource "aws_lambda_function" "login" {
  function_name    = "${var.project}-login"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = var.lambda_runtime
  handler          = "index.handler"
  filename         = data.archive_file.login_zip.output_path
  source_code_hash = data.archive_file.login_zip.output_base64sha256
  environment { variables = local.restaurants_env }
  tags = { Project = var.project }
}

resource "aws_lambda_function" "delete_restaurant" {
  function_name    = "${var.project}-deleteRestaurant"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = var.lambda_runtime
  handler          = "index.handler"
  filename         = data.archive_file.delete_restaurant_zip.output_path
  source_code_hash = data.archive_file.delete_restaurant_zip.output_base64sha256
  environment { variables = local.restaurants_env }
  tags = { Project = var.project }
}

resource "aws_cloudwatch_log_group" "delete_restaurant" {
  name              = "/aws/lambda/${aws_lambda_function.delete_restaurant.function_name}"
  retention_in_days = 7
}

resource "aws_apigatewayv2_integration" "delete_restaurant" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.delete_restaurant.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "delete_restaurant" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /restaurants/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.delete_restaurant.id}"
}

resource "aws_lambda_permission" "delete_restaurant" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.delete_restaurant.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.api_arn_prefix}/restaurants/*"
}

resource "aws_lambda_function" "get_restaurant_by_id" {
  function_name    = "${var.project}-getRestaurantById"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = var.lambda_runtime
  handler          = "index.handler"
  filename         = data.archive_file.get_restaurant_by_id_zip.output_path
  source_code_hash = data.archive_file.get_restaurant_by_id_zip.output_base64sha256
  environment { variables = local.restaurants_env }
  tags = { Project = var.project }
}

resource "aws_lambda_function" "get_restaurants" {
  function_name    = "${var.project}-getRestaurants"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = var.lambda_runtime
  handler          = "index.handler"
  filename         = data.archive_file.get_restaurants_zip.output_path
  source_code_hash = data.archive_file.get_restaurants_zip.output_base64sha256
  environment { variables = local.restaurants_env }
  tags = { Project = var.project }
}

resource "aws_lambda_function" "update_restaurant" {
  function_name    = "${var.project}-updateRestaurant"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = var.lambda_runtime
  handler          = "index.handler"
  filename         = data.archive_file.update_restaurant_zip.output_path
  source_code_hash = data.archive_file.update_restaurant_zip.output_base64sha256
  environment { variables = local.restaurants_env }
  tags = { Project = var.project }
}

# ─── CloudWatch ───────────────────────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "api_gw" {
  name              = "/aws/apigateway/${var.project}-api"
  retention_in_days = 7
}
resource "aws_cloudwatch_log_group" "place_order" {
  name              = "/aws/lambda/${aws_lambda_function.place_order.function_name}"
  retention_in_days = 7
}
resource "aws_cloudwatch_log_group" "get_orders" {
  name              = "/aws/lambda/${aws_lambda_function.get_orders.function_name}"
  retention_in_days = 7
}
resource "aws_cloudwatch_log_group" "update_order" {
  name              = "/aws/lambda/${aws_lambda_function.update_order.function_name}"
  retention_in_days = 7
}
resource "aws_cloudwatch_log_group" "register" {
  name              = "/aws/lambda/${aws_lambda_function.register.function_name}"
  retention_in_days = 7
}
resource "aws_cloudwatch_log_group" "login_fn" {
  name              = "/aws/lambda/${aws_lambda_function.login.function_name}"
  retention_in_days = 7
}
resource "aws_cloudwatch_log_group" "get_restaurant_by_id" {
  name              = "/aws/lambda/${aws_lambda_function.get_restaurant_by_id.function_name}"
  retention_in_days = 7
}
resource "aws_cloudwatch_log_group" "get_restaurants" {
  name              = "/aws/lambda/${aws_lambda_function.get_restaurants.function_name}"
  retention_in_days = 7
}
resource "aws_cloudwatch_log_group" "update_restaurant" {
  name              = "/aws/lambda/${aws_lambda_function.update_restaurant.function_name}"
  retention_in_days = 7
}

# ─── API Gateway ──────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_api" "main" {
  name          = "${var.project}-api"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization", "x-master-key"]
    max_age       = 300
  }
  tags = { Project = var.project }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gw.arn
    format = jsonencode({
      requestId    = "$context.requestId"
      routeKey     = "$context.routeKey"
      status       = "$context.status"
      errorMessage = "$context.error.message"
    })
  }
}

# ─── Integrations ─────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_integration" "place_order" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.place_order.invoke_arn
  payload_format_version = "2.0"
}
resource "aws_apigatewayv2_integration" "get_orders" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_orders.invoke_arn
  payload_format_version = "2.0"
}
resource "aws_apigatewayv2_integration" "update_order" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.update_order.invoke_arn
  payload_format_version = "2.0"
}
resource "aws_apigatewayv2_integration" "register" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.register.invoke_arn
  payload_format_version = "2.0"
}
resource "aws_apigatewayv2_integration" "login" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.login.invoke_arn
  payload_format_version = "2.0"
}
resource "aws_apigatewayv2_integration" "get_restaurant_by_id" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_restaurant_by_id.invoke_arn
  payload_format_version = "2.0"
}
resource "aws_apigatewayv2_integration" "get_restaurants" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_restaurants.invoke_arn
  payload_format_version = "2.0"
}
resource "aws_apigatewayv2_integration" "update_restaurant" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.update_restaurant.invoke_arn
  payload_format_version = "2.0"
}

# ─── Routes ───────────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_route" "place_order" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /placeOrder"
  target    = "integrations/${aws_apigatewayv2_integration.place_order.id}"
}
resource "aws_apigatewayv2_route" "get_orders" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /getOrders"
  target    = "integrations/${aws_apigatewayv2_integration.get_orders.id}"
}
resource "aws_apigatewayv2_route" "update_order" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PATCH /updateOrder/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.update_order.id}"
}
resource "aws_apigatewayv2_route" "register" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /register"
  target    = "integrations/${aws_apigatewayv2_integration.register.id}"
}
resource "aws_apigatewayv2_route" "login" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /login"
  target    = "integrations/${aws_apigatewayv2_integration.login.id}"
}
resource "aws_apigatewayv2_route" "get_restaurant_by_id" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /restaurants/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.get_restaurant_by_id.id}"
}
resource "aws_apigatewayv2_route" "get_restaurants" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /restaurants"
  target    = "integrations/${aws_apigatewayv2_integration.get_restaurants.id}"
}
resource "aws_apigatewayv2_route" "update_restaurant" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PATCH /restaurants/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.update_restaurant.id}"
}

# ─── Lambda permissions ───────────────────────────────────────────────────────

resource "aws_lambda_permission" "place_order" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.place_order.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.api_arn_prefix}/placeOrder"
}
resource "aws_lambda_permission" "get_orders" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_orders.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.api_arn_prefix}/getOrders"
}
resource "aws_lambda_permission" "update_order" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update_order.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.api_arn_prefix}/updateOrder/*"
}
resource "aws_lambda_permission" "register" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.register.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.api_arn_prefix}/register"
}
resource "aws_lambda_permission" "login" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.login.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.api_arn_prefix}/login"
}
resource "aws_lambda_permission" "get_restaurant_by_id" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_restaurant_by_id.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.api_arn_prefix}/restaurants/*"
}
resource "aws_lambda_permission" "get_restaurants" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_restaurants.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.api_arn_prefix}/restaurants"
}
resource "aws_lambda_permission" "update_restaurant" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update_restaurant.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.api_arn_prefix}/restaurants/*"
}
