import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.RESTAURANTS_TABLE;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json",
};

export const handler = async (event) => {
  try {
    const restaurantId = event.pathParameters?.id;
    if (!restaurantId)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "id required" }) };

    const { Item } = await client.send(new GetCommand({ TableName: TABLE, Key: { restaurantId } }));
    if (!Item)
      return { statusCode: 404, headers: cors, body: JSON.stringify({ error: "Restaurant not found" }) };

    const { password: _, ...safe } = Item;
    return { statusCode: 200, headers: cors, body: JSON.stringify({ data: safe }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
