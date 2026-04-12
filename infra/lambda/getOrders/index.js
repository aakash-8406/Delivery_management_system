const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json",
};

exports.handler = async () => {
  try {
    const { Items = [] } = await client.send(new ScanCommand({ TableName: TABLE }));
    Items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { statusCode: 200, headers: cors, body: JSON.stringify({ data: Items }) };
  } catch (err) {
    console.error("getOrders error:", err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
