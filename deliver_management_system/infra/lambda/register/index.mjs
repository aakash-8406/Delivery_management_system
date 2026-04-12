import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { createHash, createHmac } from "crypto";

const client       = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const USERS_TABLE  = process.env.USERS_TABLE;        // credentials table
const REST_TABLE   = process.env.RESTAURANTS_TABLE;  // restaurant profile table
const SECRET       = process.env.JWT_SECRET ?? "smartqueue-secret";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json",
};

// Plain SHA-256 — no secret dependency, always consistent
const hashPassword = (pw) => createHash("sha256").update(pw).digest("hex");

const makeToken = (payload) => {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body   = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString("base64url");
  const sig    = createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
};

export const handler = async (event) => {
  try {
    const { name, location, email, password } = JSON.parse(event.body ?? "{}");

    if (!name || !email || !password)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "name, email and password are required" }) };

    // Check if email already exists in Users table
    const { Item: existing } = await client.send(
      new GetCommand({ TableName: USERS_TABLE, Key: { email } })
    );
    if (existing)
      return { statusCode: 409, headers: cors, body: JSON.stringify({ error: "Email already registered" }) };

    // 1. Store credentials in Users table
    await client.send(new PutCommand({
      TableName: USERS_TABLE,
      Item: {
        email,
        password:     hashPassword(password),
        restaurantId: email,   // link to restaurant profile
        createdAt:    new Date().toISOString(),
      },
    }));

    // 2. Store restaurant profile in Restaurants table
    const restaurant = {
      restaurantId: email,
      email,
      name,
      location:     location ?? "",
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

    const token = makeToken({ restaurantId: email, name });
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
