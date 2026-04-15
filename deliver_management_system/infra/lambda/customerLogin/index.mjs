import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
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
    const { email: rawEmail, password } = JSON.parse(event.body ?? "{}");

    if (!rawEmail || !password)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "email and password required" }) };

    const emailLower = rawEmail.toLowerCase().trim();
    const emailOrig  = rawEmail.trim();

    // Try lowercase first, then original case (for accounts registered before normalization)
    let Item;
    const res1 = await client.send(new GetCommand({ TableName: TABLE, Key: { email: emailLower } }));
    Item = res1.Item;

    if (!Item && emailOrig !== emailLower) {
      const res2 = await client.send(new GetCommand({ TableName: TABLE, Key: { email: emailOrig } }));
      Item = res2.Item;
    }

    if (!Item)
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "No account found with this email. Please register first." }) };

    if (Item.passwordHash !== hash(password))
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Incorrect password." }) };

    const { passwordHash: _, ...safe } = Item;
    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ data: { user: safe, token: "cq_" + Buffer.from(Item.email).toString("base64") } }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
