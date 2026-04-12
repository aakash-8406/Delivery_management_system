import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { createHash } from "crypto";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE  = process.env.RESTAURANTS_TABLE;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json",
};

const hash = (pw) => createHash("sha256").update(pw).digest("hex");

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? "{}");
    const { name, email, password, location = "" } = body;

    if (!name || !email || !password)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "name, email and password required" }) };

    // Check duplicate
    const { Item } = await client.send(new GetCommand({ TableName: TABLE, Key: { restaurantId: email } }));
    if (Item)
      return { statusCode: 409, headers: cors, body: JSON.stringify({ error: "Email already registered" }) };

    const restaurant = {
      restaurantId: email,
      email,
      name,
      location,
      passwordHash: hash(password),
      cuisine: "",
      rating: "",
      deliveryTime: "",
      deliveryFee: "",
      offer: "",
      isVeg: false,
      menu: [],
      createdAt: new Date().toISOString(),
    };

    await client.send(new PutCommand({ TableName: TABLE, Item: restaurant }));

    const { passwordHash: _, ...safe } = restaurant;
    return {
      statusCode: 201,
      headers: cors,
      body: JSON.stringify({ data: { token: "sq_" + Buffer.from(email).toString("base64"), restaurant: safe } }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
