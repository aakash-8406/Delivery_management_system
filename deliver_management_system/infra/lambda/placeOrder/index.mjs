import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json",
};

// Verify customer token (cq_ + base64 email)
const verifyCustomerToken = (authHeader) => {
  if (!authHeader?.startsWith("Bearer cq_")) return null;
  try {
    const email = Buffer.from(authHeader.slice(10), "base64").toString("utf8");
    return email.includes("@") ? { email } : null;
  } catch { return null; }
};

export const handler = async (event) => {
  try {
    // Require authentication
    const claims = verifyCustomerToken(event.headers?.authorization ?? event.headers?.Authorization);
    if (!claims)
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Please login to place an order" }) };

    const body = JSON.parse(event.body ?? "{}");
    const { customerName, items, totalAmount, deliveryFee, platformFee, deliveryAddress, details, restaurantId, userId } = body;

    if (!customerName || !items?.length)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "customerName and items are required" }) };

    const totalItems = items.reduce((s, i) => s + (i.qty ?? i.quantity ?? 1), 0);
    const order = {
      id: randomUUID(),
      userId: userId ?? "guest",
      restaurantId: restaurantId ?? "default",
      customerName,
      items,
      details: details ?? "",
      totalAmount: totalAmount ?? 0,
      deliveryFee: deliveryFee ?? 0,
      platformFee: platformFee ?? 0,
      deliveryAddress: deliveryAddress ?? "",
      status: "ACCEPTED",
      prepTime: 10 + totalItems * 5,
      createdAt: new Date().toISOString(),
    };

    await client.send(new PutCommand({ TableName: TABLE, Item: order }));
    return { statusCode: 201, headers: cors, body: JSON.stringify({ data: order }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
