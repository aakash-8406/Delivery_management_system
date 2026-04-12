import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { createHash, createHmac } from "crypto";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE  = process.env.RESTAURANTS_TABLE;
const SECRET = process.env.JWT_SECRET ?? "smartqueue-secret";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json",
};

// Must match register — plain SHA-256, no secret key
const hashPassword = (pw) => createHash("sha256").update(pw).digest("hex");

const makeToken = (payload) => {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body   = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString("base64url");
  const sig    = createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
};

export const handler = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body ?? "{}");

    if (!email || !password)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "email and password are required" }) };

    // Fetch user from DynamoDB
    const { Item } = await client.send(
      new GetCommand({ TableName: TABLE, Key: { restaurantId: email } })
    );

    // User not found
    if (!Item)
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "No account found with this email" }) };

    // Wrong password
    if (Item.password !== hashPassword(password))
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Incorrect password" }) };

    // Generate JWT token
    const token = makeToken({ restaurantId: Item.restaurantId, name: Item.name });

    // Return restaurant data without password
    const { password: _, ...safe } = Item;
    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ data: { token, restaurant: safe } }),
    };
  } catch (err) {
    console.error("Login error:", err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
