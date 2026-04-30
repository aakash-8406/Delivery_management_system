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
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }
}

provider "aws" { region = var.aws_region }

data "aws_caller_identity" "current" {}
data "aws_availability_zones" "available" { state = "available" }

# ─── VPC ──────────────────────────────────────────────────────────────────────

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = { Name = "${var.project}-vpc", Project = var.project }
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]
  tags = { Name = "${var.project}-private-a", Project = var.project }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]
  tags = { Name = "${var.project}-private-b", Project = var.project }
}

resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.3.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true
  tags = { Name = "${var.project}-public-a", Project = var.project }
}

# ─── Internet Gateway + NAT (Lambda needs outbound for RDS) ───────────────────

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project}-igw", Project = var.project }
}

resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = { Project = var.project }
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_a.id
  tags          = { Name = "${var.project}-nat", Project = var.project }
  depends_on    = [aws_internet_gateway.igw]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = { Name = "${var.project}-public-rt", Project = var.project }
}

resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }
  tags = { Name = "${var.project}-private-rt", Project = var.project }
}

resource "aws_route_table_association" "private_a" {
  subnet_id      = aws_subnet.private_a.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_b" {
  subnet_id      = aws_subnet.private_b.id
  route_table_id = aws_route_table.private.id
}

# ─── Security Groups ──────────────────────────────────────────────────────────

resource "aws_security_group" "lambda_sg" {
  name        = "${var.project}-lambda-sg"
  description = "Lambda functions security group"
  vpc_id      = aws_vpc.main.id
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Project = var.project }
}

resource "aws_security_group" "rds_sg" {
  name        = "${var.project}-rds-sg"
  description = "RDS MySQL security group"
  vpc_id      = aws_vpc.main.id
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda_sg.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Project = var.project }
}

# ─── RDS MySQL (Free Tier) ────────────────────────────────────────────────────

resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-db-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  tags       = { Project = var.project }
}

resource "aws_db_instance" "mysql" {
  identifier             = "${var.project}-mysql"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.micro"   # free tier eligible
  allocated_storage      = 20              # free tier: up to 20 GB
  storage_type           = "gp2"
  db_name                = var.db_name
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  publicly_accessible    = false
  skip_final_snapshot    = true
  deletion_protection    = false
  multi_az               = false
  backup_retention_period = 0              # disable backups to stay free tier
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

# VPC access needed for Lambda → RDS
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# ─── Locals ───────────────────────────────────────────────────────────────────

locals {
  account_id     = data.aws_caller_identity.current.account_id
  api_arn_prefix = "arn:aws:execute-api:${var.aws_region}:${local.account_id}:${aws_apigatewayv2_api.main.id}/*/*"

  rds_env = {
    DB_HOST     = aws_db_instance.mysql.address
    DB_PORT     = "3306"
    DB_NAME     = var.db_name
    DB_USER     = var.db_username
    DB_PASSWORD = var.db_password
    JWT_SECRET  = var.jwt_secret
    MASTER_KEY  = var.master_key
  }

  lambda_vpc_config = {
    subnet_ids         = [aws_subnet.private_a.id, aws_subnet.private_b.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }
}

# ─── Lambda zips ──────────────────────────────────────────────────────────────

data "archive_file" "place_order_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/placeOrder"
  output_path = "${path.module}/.build/placeOrder.zip"
  excludes    = ["package-lock.json"]
}
data "archive_file" "get_orders_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/getOrders"
  output_path = "${path.module}/.build/getOrders.zip"
  excludes    = ["package-lock.json"]
}
data "archive_file" "update_order_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/updateOrder"
  output_path = "${path.module}/.build/updateOrder.zip"
  excludes    = ["package-lock.json"]
}
data "archive_file" "register_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/register"
  output_path = "${path.module}/.build/register.zip"
  excludes    = ["package-lock.json"]
}
data "archive_file" "login_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/login"
  output_path = "${path.module}/.build/login.zip"
  excludes    = ["package-lock.json"]
}
data "archive_file" "delete_restaurant_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/deleteRestaurant"
  output_path = "${path.module}/.build/deleteRestaurant.zip"
  excludes    = ["package-lock.json"]
}
data "archive_file" "get_restaurant_by_id_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/getRestaurantById"
  output_path = "${path.module}/.build/getRestaurantById.zip"
  excludes    = ["package-lock.json"]
}
data "archive_file" "get_restaurants_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/getRestaurants"
  output_path = "${path.module}/.build/getRestaurants.zip"
  excludes    = ["package-lock.json"]
}
data "archive_file" "update_restaurant_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/updateRestaurant"
  output_path = "${path.module}/.build/updateRestaurant.zip"
  excludes    = ["package-lock.json"]
}

# ─── Lambda functions ─────────────────────────────────────────────────────────

resource "aws_lambda_function" "place_order" {
  function_name    = "${var.project}-placeOrder"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = var.lambda_runtime
  handler          = "index.handler"
  filename         = data.archive_file.place_order_zip.output_path
  source_code_hash = data.archive_file.place_order_zip.output_base64sha256
  timeout          = 15
  environment { variables = local.rds_env }
  vpc_config {
    subnet_ids         = local.lambda_vpc_config.subnet_ids
    security_group_ids = local.lambda_vpc_config.security_group_ids
  }
  tags = { Project = var.project }
}

resource "aws_lambda_function" "get_orders" {
  function_name    = "${var.project}-getOrders"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = var.lambda_runtime
  handler          = "index.handler"
  filename         = data.archive_file.get_orders_zip.output_path
  source_code_hash = data.archive_file.get_orders_zip.output_base64sha256
  timeout          = 15
  environment { variables = local.rds_env }
  vpc_config {
    subnet_ids         = local.lambda_vpc_config.subnet_ids
    security_group_ids = local.lambda_vpc_config.security_group_ids
  }
  tags = { Project = var.project }
}

resource "aws_lambda_function" "update_order" {
  function_name    = "${var.project}-updateOrder"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = var.lambda_runtime
  handler          = "index.handler"
  filename         = data.archive_file.update_order_zip.output_path
  source_code_hash = data.archive_file.update_order_zip.output_base64sha256
  timeout          = 15
  environment { variables = local.rds_env }
  vpc_config {
    subnet_ids         = local.lambda_vpc_config.subnet_ids
    security_group_ids = local.lambda_vpc_config.security_group_ids
  }
  tags = { Project = var.project }
}

resource "aws_lambda_function" "register" {
  function_name    = "${var.project}-register"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = var.lambda_runtime
  handler          = "index.handler"
  filename         = data.archive_file.register_zip.output_path
  source_code_hash = data.archive_file.register_zip.output_base64sha256
  timeout          = 15
  environment { variables = local.rds_env }
  vpc_config {
    subnet_ids         = local.lambda_vpc_config.subnet_ids
    security_group_ids = local.lambda_vpc_config.security_group_ids
  }
  tags = { Project = var.project }
}

resource "aws_lambda_function" "login" {
  function_name    = "${var.project}-login"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = var.lambda_runtime
  handler          = "index.handler"
  filename         = data.archive_file.login_zip.output_path
  source_code_hash = data.archive_file.login_zip.output_base64sha256
  timeout          = 15
  environment { variables = local.rds_env }
  vpc_config {
    subnet_ids         = local.lambda_vpc_config.subnet_ids
    security_group_ids = local.lambda_vpc_config.security_group_ids
  }
  tags = { Project = var.project }
}

resource "aws_lambda_function" "delete_restaurant" {
  function_name    = "${var.project}-deleteRestaurant"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = var.lambda_runtime
  handler          = "index.handler"
  filename         = data.archive_file.delete_restaurant_zip.output_path
  source_code_hash = data.archive_file.delete_restaurant_zip.output_base64sha256
  timeout          = 15
  environment { variables = local.rds_env }
  vpc_config {
    subnet_ids         = local.lambda_vpc_config.subnet_ids
    security_group_ids = local.lambda_vpc_config.security_group_ids
  }
  tags = { Project = var.project }
}

resource "aws_lambda_function" "get_restaurant_by_id" {
  function_name    = "${var.project}-getRestaurantById"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = var.lambda_runtime
  handler          = "index.handler"
  filename         = data.archive_file.get_restaurant_by_id_zip.output_path
  source_code_hash = data.archive_file.get_restaurant_by_id_zip.output_base64sha256
  timeout          = 15
  environment { variables = local.rds_env }
  vpc_config {
    subnet_ids         = local.lambda_vpc_config.subnet_ids
    security_group_ids = local.lambda_vpc_config.security_group_ids
  }
  tags = { Project = var.project }
}

resource "aws_lambda_function" "get_restaurants" {
  function_name    = "${var.project}-getRestaurants"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = var.lambda_runtime
  handler          = "index.handler"
  filename         = data.archive_file.get_restaurants_zip.output_path
  source_code_hash = data.archive_file.get_restaurants_zip.output_base64sha256
  timeout          = 15
  environment { variables = local.rds_env }
  vpc_config {
    subnet_ids         = local.lambda_vpc_config.subnet_ids
    security_group_ids = local.lambda_vpc_config.security_group_ids
  }
  tags = { Project = var.project }
}

resource "aws_lambda_function" "update_restaurant" {
  function_name    = "${var.project}-updateRestaurant"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = var.lambda_runtime
  handler          = "index.handler"
  filename         = data.archive_file.update_restaurant_zip.output_path
  source_code_hash = data.archive_file.update_restaurant_zip.output_base64sha256
  timeout          = 15
  environment { variables = local.rds_env }
  vpc_config {
    subnet_ids         = local.lambda_vpc_config.subnet_ids
    security_group_ids = local.lambda_vpc_config.security_group_ids
  }
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
resource "aws_cloudwatch_log_group" "delete_restaurant" {
  name              = "/aws/lambda/${aws_lambda_function.delete_restaurant.function_name}"
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
resource "aws_apigatewayv2_integration" "delete_restaurant" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.delete_restaurant.invoke_arn
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
resource "aws_apigatewayv2_route" "delete_restaurant" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /restaurants/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.delete_restaurant.id}"
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
resource "aws_lambda_permission" "delete_restaurant" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.delete_restaurant.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.api_arn_prefix}/restaurants/*"
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

# ─── DB Init Lambda (creates tables on first deploy) ─────────────────────────

data "archive_file" "db_init_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/dbInit"
  output_path = "${path.module}/.build/dbInit.zip"
  excludes    = ["package-lock.json"]
}

resource "aws_lambda_function" "db_init" {
  function_name    = "${var.project}-dbInit"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = var.lambda_runtime
  handler          = "index.handler"
  filename         = data.archive_file.db_init_zip.output_path
  source_code_hash = data.archive_file.db_init_zip.output_base64sha256
  timeout          = 30
  environment { variables = local.rds_env }
  vpc_config {
    subnet_ids         = local.lambda_vpc_config.subnet_ids
    security_group_ids = local.lambda_vpc_config.security_group_ids
  }
  tags = { Project = var.project }
  depends_on = [aws_db_instance.mysql]
}

resource "aws_cloudwatch_log_group" "db_init" {
  name              = "/aws/lambda/${aws_lambda_function.db_init.function_name}"
  retention_in_days = 7
}

# Invoke dbInit once after deploy to create tables
resource "null_resource" "run_db_init" {
  triggers = { always = timestamp() }
  provisioner "local-exec" {
    command = "aws lambda invoke --function-name ${aws_lambda_function.db_init.function_name} --region ${var.aws_region} /dev/null"
  }
  depends_on = [aws_lambda_function.db_init]
}
