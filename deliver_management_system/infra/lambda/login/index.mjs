import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { createHash, createHmac } from "crypto";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE  = process.env.RESTAURANTS_TABLE;
const SECRET = process.env.JWT_SECRET ?? "smartqueue-secret";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json",
};

// New hash — plain SHA-256, no secret dependency
const hash    = (pw) => createHash("sha256").update(pw).digest("hex");
// Old hash — HMAC used by previous register versions
const hashOld = (pw) => createHmac("sha256", SECRET).update(pw).digest("hex");

export const handler = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body ?? "{}");

    if (!email || !password)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "email and password required" }) };

    const { Item } = await client.send(new GetCommand({ TableName: TABLE, Key: { restaurantId: email } }));

    if (!Item)
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "No account found with this email" }) };

    // Check new passwordHash first, then fall back to old password field with both hash methods
    const newHash = hash(password);
    const oldHash = hashOld(password);
    const stored  = Item.passwordHash ?? Item.password ?? "";

    if (stored !== newHash && stored !== oldHash)
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Incorrect password" }) };

    // Migrate old password to new passwordHash format silently
    if (!Item.passwordHash) {
      await client.send(new UpdateCommand({
        TableName: TABLE,
        Key: { restaurantId: email },
        UpdateExpression: "SET passwordHash = :h REMOVE #pw",
        ExpressionAttributeNames: { "#pw": "password" },
        ExpressionAttributeValues: { ":h": newHash },
      }));
    }

    const { password: _p, passwordHash: _ph, ...safe } = Item;
    const token = "sq_" + Buffer.from(email).toString("base64");

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ data: { token, restaurant: safe } }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
