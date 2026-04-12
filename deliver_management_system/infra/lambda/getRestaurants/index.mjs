import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.RESTAURANTS_TABLE;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json",
};

export const handler = async () => {
  try {
    const { Items = [] } = await client.send(new ScanCommand({
      TableName: TABLE,
      ProjectionExpression: "restaurantId, #n, #l, menu, #img, createdAt, cuisine, rating, deliveryTime, deliveryFee, #offer, isVeg",
      ExpressionAttributeNames: { "#n": "name", "#l": "location", "#img": "image", "#offer": "offer" },
    }));
    return { statusCode: 200, headers: cors, body: JSON.stringify({ data: Items }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
