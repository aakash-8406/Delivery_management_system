import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { createHmac } from "crypto";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.RESTAURANTS_TABLE;
const SECRET = process.env.JWT_SECRET;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json",
};

const verifyToken = (authHeader) => {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const [header, body, sig] = authHeader.slice(7).split(".");
    const expected = createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
    if (sig !== expected) return null;
    return JSON.parse(Buffer.from(body, "base64url").toString());
  } catch { return null; }
};

export const handler = async (event) => {
  try {
    const claims = verifyToken(event.headers?.authorization ?? event.headers?.Authorization);
    if (!claims) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Unauthorized" }) };

    const restaurantId = event.pathParameters?.id;
    if (claims.restaurantId !== restaurantId)
      return { statusCode: 403, headers: cors, body: JSON.stringify({ error: "Forbidden — you can only update your own restaurant" }) };

    const { name, location, menu, image, cuisine, rating, deliveryTime, deliveryFee, offer, isVeg } = JSON.parse(event.body ?? "{}");

    const updates = [];
    const names = {};
    const values = {};

    if (name)                    { updates.push("#n = :n");    names["#n"] = "name";         values[":n"] = name; }
    if (location)                { updates.push("#l = :l");    names["#l"] = "location";     values[":l"] = location; }
    if (menu)                    { updates.push("menu = :m");                                 values[":m"] = menu; }
    if (image !== undefined)     { updates.push("#img = :img"); names["#img"] = "image";      values[":img"] = image; }
    if (cuisine !== undefined)   { updates.push("cuisine = :c");                              values[":c"] = cuisine; }
    if (rating !== undefined)    { updates.push("rating = :rt");                              values[":rt"] = rating; }
    if (deliveryTime !== undefined) { updates.push("deliveryTime = :dt");                     values[":dt"] = deliveryTime; }
    if (deliveryFee !== undefined)  { updates.push("deliveryFee = :df");                      values[":df"] = deliveryFee; }
    if (offer !== undefined)     { updates.push("#of = :of");  names["#of"] = "offer";       values[":of"] = offer; }
    if (isVeg !== undefined)     { updates.push("isVeg = :iv");                               values[":iv"] = isVeg; }

    if (!updates.length)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Nothing to update" }) };

    await client.send(new UpdateCommand({
      TableName: TABLE,
      Key: { restaurantId },
      UpdateExpression: `SET ${updates.join(", ")}`,
      ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
      ExpressionAttributeValues: values,
      ConditionExpression: "attribute_exists(restaurantId)",
    }));

    const { Item } = await client.send(new GetCommand({ TableName: TABLE, Key: { restaurantId } }));
    const { password: _, ...safe } = Item;

    return { statusCode: 200, headers: cors, body: JSON.stringify({ data: safe }) };
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException")
      return { statusCode: 404, headers: cors, body: JSON.stringify({ error: "Restaurant not found" }) };
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
