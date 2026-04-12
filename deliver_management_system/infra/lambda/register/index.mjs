import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { createHash } from "crypto";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE  = process.env.RESTAURANTS_TABLE;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json",
};

// Simple SHA-256 hash — same in both register and login
const hashPassword = (pw) => createHash("sha256").update(pw).digest("hex");

export const handler = async (event) => {
  try {
    const { name, location, email, password } = JSON.parse(event.body ?? "{}");

    if (!name || !email || !password)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "name, email and password are required" }) };

    // Check if email already registered
    const { Item: existing } = await client.send(
      new GetCommand({ TableName: TABLE, Key: { restaurantId: email } })
    );
    if (existing)
      return { statusCode: 409, headers: cors, body: JSON.stringify({ error: "Email already registered" }) };

    // Store restaurant in DynamoDB
    const restaurant = {
      restaurantId: email,
      email,
      name,
      location:     location ?? "",
      password:     hashPassword(password),
      cuisine:      "",
      rating:       "",
      deliveryTime: "",
      deliveryFee:  "",
      offer:        "",
      isVeg:        false,
      menu:         [],
      createdAt:    new Date().toISOString(),
    };

    await client.send(new PutCommand({ TableName: TABLE, Item: restaurant }));

    // Return restaurant data without password
    const { password: _, ...safe } = restaurant;
    return {
      statusCode: 201,
      headers: cors,
      body: JSON.stringify({ data: { token: "registered", restaurant: safe } }),
    };
  } catch (err) {
    console.error("Register error:", err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
