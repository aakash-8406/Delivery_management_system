import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { createHmac, randomUUID } from "crypto";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.RESTAURANTS_TABLE;
const SECRET = process.env.JWT_SECRET;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json",
};

const hashPassword = (pw) =>
  createHmac("sha256", SECRET).update(pw).digest("hex");

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

    // Check duplicate email
    const existing = await client.send(new GetCommand({ TableName: TABLE, Key: { restaurantId: email } }));
    if (existing.Item)
      return { statusCode: 409, headers: cors, body: JSON.stringify({ error: "Email already registered" }) };

    const restaurant = {
      restaurantId: email,
      name,
      location: location ?? "",
      email,
      password: hashPassword(password),
      menu: [],
      createdAt: new Date().toISOString(),
    };

    await client.send(new PutCommand({ TableName: TABLE, Item: restaurant }));

    const token = makeToken({ restaurantId: email, name });
    const { password: _, ...safe } = restaurant;

    return { statusCode: 201, headers: cors, body: JSON.stringify({ data: { token, restaurant: safe } }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
