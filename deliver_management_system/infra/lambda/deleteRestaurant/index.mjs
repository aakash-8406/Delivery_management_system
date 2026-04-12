import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE  = process.env.RESTAURANTS_TABLE;
const MASTER = process.env.MASTER_KEY;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json",
};

export const handler = async (event) => {
  try {
    const restaurantId = event.pathParameters?.id;
    const masterKey    = event.headers?.["x-master-key"] ?? event.headers?.["X-Master-Key"];

    if (!masterKey || masterKey !== MASTER)
      return { statusCode: 403, headers: cors, body: JSON.stringify({ error: "Invalid master key" }) };

    if (!restaurantId)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "restaurantId required" }) };

    await client.send(new DeleteCommand({ TableName: TABLE, Key: { restaurantId } }));

    return { statusCode: 200, headers: cors, body: JSON.stringify({ data: { deleted: restaurantId } }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
