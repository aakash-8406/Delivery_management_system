import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { createHash, createHmac } from "crypto";

const client      = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const USERS_TABLE = process.env.USERS_TABLE;
const REST_TABLE  = process.env.RESTAURANTS_TABLE;
const SECRET      = process.env.JWT_SECRET ?? "smartqueue-secret";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json",
};

const hash = (pw) => createHash("sha256").update(pw).digest("hex");

// Proper JWT so updateRestaurant can verify it
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
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "email and password required" }) };

    const { Item: user } = await client.send(
      new GetCommand({ TableName: USERS_TABLE, Key: { email } })
    );

    if (!user)
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "No account found with this email" }) };

    if (user.passwordHash !== hash(password))
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Incorrect password" }) };

    const { Item: restaurant } = await client.send(
      new GetCommand({ TableName: REST_TABLE, Key: { restaurantId: user.restaurantId } })
    );

    if (!restaurant)
      return { statusCode: 404, headers: cors, body: JSON.stringify({ error: "Restaurant profile not found" }) };

    // JWT with restaurantId claim — required by updateRestaurant Lambda
    const token = makeToken({ restaurantId: restaurant.restaurantId, name: restaurant.name });

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ data: { token, restaurant } }),
    };
  } catch (err) {
    console.error("Login error:", err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
