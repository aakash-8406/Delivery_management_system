import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { createHash } from "crypto";

const client      = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const USERS_TABLE = process.env.USERS_TABLE;        // stores credentials
const REST_TABLE  = process.env.RESTAURANTS_TABLE;  // stores restaurant profile

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json",
};

const hash = (pw) => createHash("sha256").update(pw).digest("hex");

export const handler = async (event) => {
  try {
    const { name, email: rawEmail, password, location = "" } = JSON.parse(event.body ?? "{}");
    const email = rawEmail?.toLowerCase().trim();
    if (!name || !email || !password)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "name, email and password required" }) };

    // Check if user already exists in Users table
    const { Item: existing } = await client.send(
      new GetCommand({ TableName: USERS_TABLE, Key: { email } })
    );
    if (existing)
      return { statusCode: 409, headers: cors, body: JSON.stringify({ error: "Email already registered" }) };

    // 1. Save credentials to Users table
    await client.send(new PutCommand({
      TableName: USERS_TABLE,
      Item: {
        email,
        passwordHash: hash(password),
        restaurantId: email,
        createdAt: new Date().toISOString(),
      },
    }));

    // 2. Save restaurant profile to Restaurants table
    const restaurant = {
      restaurantId: email,
      email,
      name,
      location,
      cuisine:      "",
      rating:       "",
      deliveryTime: "",
      deliveryFee:  "",
      offer:        "",
      isVeg:        false,
      menu:         [],
      createdAt:    new Date().toISOString(),
    };
    await client.send(new PutCommand({ TableName: REST_TABLE, Item: restaurant }));

    const token = "sq_" + Buffer.from(email).toString("base64");
    return {
      statusCode: 201,
      headers: cors,
      body: JSON.stringify({ data: { token, restaurant } }),
    };
  } catch (err) {
    console.error("Register error:", err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
