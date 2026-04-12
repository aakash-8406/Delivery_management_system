const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME;

const VALID = ["ACCEPTED", "DELAYED", "REJECTED", "DELIVERED"];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    const { status } = JSON.parse(event.body ?? "{}");

    if (!id) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "id is required" }) };
    if (!VALID.includes(status)) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: `status must be one of: ${VALID.join(", ")}` }) };

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
    if (err.name === "ConditionalCheckFailedException") {
      return { statusCode: 404, headers: cors, body: JSON.stringify({ error: "Order not found" }) };
    }
    console.error("updateOrder error:", err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
