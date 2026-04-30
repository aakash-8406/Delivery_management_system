import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { createHmac } from "crypto";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME;
const SECRET = process.env.JWT_SECRET;
const VALID = ["ACCEPTED", "DELAYED", "REJECTED", "DELIVERED"];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json",
};

const verifyToken = (authHeader) => {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const [header, body, sig] = authHeader.slice(7).split(".");
    const expected = createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
    if (sig !== expected) return null;
    return JSON.parse(Buffer.from(body, "base64url").toString());
  } catch { return null; }
};

export const handler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    const { status } = JSON.parse(event.body ?? "{}");

    if (!id) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "id required" }) };
    if (!VALID.includes(status)) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: `status must be one of: ${VALID.join(", ")}` }) };

    // Verify token and restaurantId ownership
    const claims = verifyToken(event.headers?.authorization ?? event.headers?.Authorization);
    if (claims) {
      const { Item: existing } = await client.send(new GetCommand({ TableName: TABLE, Key: { id } }));
      if (existing && existing.restaurantId && existing.restaurantId !== claims.restaurantId)
        return { statusCode: 403, headers: cors, body: JSON.stringify({ error: "Forbidden — not your order" }) };
    }

    await client.send(new UpdateCommand({
      TableName: TABLE,
      Key: { id },
      UpdateExpression: "SET #s = :s, updatedAt = :u",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":s": status, ":u": new Date().toISOString() },
      ConditionExpression: "attribute_exists(id)",
    }));

    const { Item } = await client.send(new GetCommand({ TableName: TABLE, Key: { id } }));
    return { statusCode: 200, headers: cors, body: JSON.stringify({ data: Item }) };
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException")
      return { statusCode: 404, headers: cors, body: JSON.stringify({ error: "Order not found" }) };
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
