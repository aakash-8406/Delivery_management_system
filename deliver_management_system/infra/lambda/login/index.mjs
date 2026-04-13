import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { createHash } from "crypto";

const client      = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const USERS_TABLE = process.env.USERS_TABLE;        // credentials
const REST_TABLE  = process.env.RESTAURANTS_TABLE;  // restaurant profile

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json",
};

const hash = (pw) => createHash("sha256").update(pw).digest("hex");

export const handler = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body ?? "{}");

    if (!email || !password)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "email and password required" }) };

    // Step 1: verify credentials from Users table
    const { Item: user } = await client.send(
      new GetCommand({ TableName: USERS_TABLE, Key: { email } })
    );

    if (!user)
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "No account found with this email. Please register first." }) };

    if (user.passwordHash !== hash(password))
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Incorrect password." }) };

    // Step 2: fetch restaurant profile from Restaurants table
    const { Item: restaurant } = await client.send(
      new GetCommand({ TableName: REST_TABLE, Key: { restaurantId: user.restaurantId } })
    );

    if (!restaurant)
      return { statusCode: 404, headers: cors, body: JSON.stringify({ error: "Restaurant profile not found." }) };

    const token = "sq_" + Buffer.from(email).toString("base64");
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
