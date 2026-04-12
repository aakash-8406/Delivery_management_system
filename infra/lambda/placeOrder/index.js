const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { randomUUID } = require("crypto");

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME;

const STATUSES = ["ACCEPTED", "ACCEPTED", "ACCEPTED", "DELAYED", "REJECTED"];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? "{}");
    const { customerName, items, totalAmount, deliveryFee, platformFee, deliveryAddress, details } = body;

    if (!customerName || !items?.length) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "customerName and items are required" }) };
    }

    const totalItems = items.reduce((s, i) => s + (i.qty ?? i.quantity ?? 1), 0);
    const order = {
      id: randomUUID(),
      customerName,
      items,
      details: details ?? "",
      totalAmount: totalAmount ?? 0,
      deliveryFee: deliveryFee ?? 0,
      platformFee: platformFee ?? 0,
      deliveryAddress: deliveryAddress ?? "",
      status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
      prepTime: 10 + totalItems * 5,
      createdAt: new Date().toISOString(),
    };

    await client.send(new PutCommand({ TableName: TABLE, Item: order }));
    return { statusCode: 201, headers: cors, body: JSON.stringify({ data: order }) };
  } catch (err) {
    console.error("placeOrder error:", err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
