import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json",
};

export const handler = async (event) => {
  try {
    const { restaurantId, userId } = event.queryStringParameters ?? {};

    let FilterExpression;
    let ExpressionAttributeValues;

    if (restaurantId && userId) {
      FilterExpression = "restaurantId = :r AND userId = :u";
      ExpressionAttributeValues = { ":r": restaurantId, ":u": userId };
    } else if (restaurantId) {
      FilterExpression = "restaurantId = :r";
      ExpressionAttributeValues = { ":r": restaurantId };
    } else if (userId) {
      FilterExpression = "userId = :u";
      ExpressionAttributeValues = { ":u": userId };
    }

    const params = { TableName: TABLE };
    if (FilterExpression) {
      params.FilterExpression = FilterExpression;
      params.ExpressionAttributeValues = ExpressionAttributeValues;
    }

    const { Items = [] } = await client.send(new ScanCommand(params));
    Items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return { statusCode: 200, headers: cors, body: JSON.stringify({ data: Items }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
