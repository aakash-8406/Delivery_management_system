import mysql from "mysql2/promise";
import { createHmac } from "crypto";

const SECRET = process.env.JWT_SECRET;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json",
};

const getConn = () => mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

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
  const conn = await getConn();
  try {
    const claims = verifyToken(event.headers?.authorization ?? event.headers?.Authorization);
    if (!claims)
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Unauthorized" }) };

    const restaurantId = event.pathParameters?.id;
    if (claims.restaurantId !== restaurantId)
      return { statusCode: 403, headers: cors, body: JSON.stringify({ error: "Forbidden — you can only update your own restaurant" }) };

    const { name, location, menu, image, cuisine, rating, deliveryTime, deliveryFee, offer, isVeg } = JSON.parse(event.body ?? "{}");

    const sets = [];
    const values = [];
    if (name !== undefined)         { sets.push("name = ?");         values.push(name); }
    if (location !== undefined)     { sets.push("location = ?");     values.push(location); }
    if (menu !== undefined)         { sets.push("menu = ?");         values.push(JSON.stringify(menu)); }
    if (image !== undefined)        { sets.push("image = ?");        values.push(image); }
    if (cuisine !== undefined)      { sets.push("cuisine = ?");      values.push(cuisine); }
    if (rating !== undefined)       { sets.push("rating = ?");       values.push(rating); }
    if (deliveryTime !== undefined) { sets.push("deliveryTime = ?"); values.push(deliveryTime); }
    if (deliveryFee !== undefined)  { sets.push("deliveryFee = ?");  values.push(deliveryFee); }
    if (offer !== undefined)        { sets.push("offer = ?");        values.push(offer); }
    if (isVeg !== undefined)        { sets.push("isVeg = ?");        values.push(isVeg ? 1 : 0); }

    if (sets.length === 0)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Nothing to update" }) };

    values.push(restaurantId);
    const [result] = await conn.execute(`UPDATE restaurants SET ${sets.join(", ")} WHERE restaurantId = ?`, values);
    if (result.affectedRows === 0)
      return { statusCode: 404, headers: cors, body: JSON.stringify({ error: "Restaurant not found" }) };

    const [rows] = await conn.execute(
      "SELECT restaurantId, name, location, email, menu, image, cuisine, rating, deliveryTime, deliveryFee, offer, isVeg, createdAt FROM restaurants WHERE restaurantId = ?",
      [restaurantId]
    );
    const item = { ...rows[0], menu: JSON.parse(rows[0].menu ?? "[]") };
    return { statusCode: 200, headers: cors, body: JSON.stringify({ data: item }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  } finally {
    await conn.end();
  }
};
