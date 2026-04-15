import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { createHash } from "crypto";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE  = process.env.CUSTOMERS_TABLE;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json",
};

const hash = (pw) => createHash("sha256").update(pw).digest("hex");

export const handler = async (event) => {
  try {
    const { name, email: rawEmail, password } = JSON.parse(event.body ?? "{}");
    const email = rawEmail?.toLowerCase().trim();

    if (!name || !email || !password)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "name, email and password required" }) };

    const { Item } = await client.send(new GetCommand({ TableName: TABLE, Key: { email } }));
    if (Item)
      return { statusCode: 409, headers: cors, body: JSON.stringify({ error: "Email already registered" }) };

    const userId = "u" + Date.now();
    const customer = { email, name, userId, passwordHash: hash(password), createdAt: new Date().toISOString() };
    await client.send(new PutCommand({ TableName: TABLE, Item: customer }));

    const { passwordHash: _, ...safe } = customer;
    return {
      statusCode: 201,
      headers: cors,
      body: JSON.stringify({ data: { user: safe, token: "cq_" + Buffer.from(email).toString("base64") } }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
