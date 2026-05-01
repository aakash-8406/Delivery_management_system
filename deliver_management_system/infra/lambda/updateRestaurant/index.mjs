import mysql from "mysql2/promise";
import { createHmac } from "crypto";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,x-master-key",
  "Content-Type": "application/json",
};

const SECRET     = process.env.JWT_SECRET ?? "smartqueue-secret";
const MASTER_KEY = process.env.MASTER_KEY ?? "MASTER-SMARTQUEUE-2024";

const getConn = () => mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const verifyJwt = (token) => {
  try {
    const [h, b, s] = token.split(".");
    const expected = createHmac("sha256", SECRET).update(`${h}.${b}`).digest("base64url");
    if (s !== expected) return null;
    return JSON.parse(Buffer.from(b, "base64url").toString());
  } catch { return null; }
};

export const handler = async (event) => {
  const conn = await getConn();
  try {
    const id = event.pathParameters?.id;
    if (!id) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "id required" }) };

    const masterKey = event.headers?.["x-master-key"] ?? event.headers?.["X-Master-Key"];
    const authHeader = event.headers?.authorization ?? event.headers?.Authorization;

    let authorized = false;
    if (masterKey === MASTER_KEY) {
      authorized = true;
    } else if (authHeader?.startsWith("Bearer ")) {
      const claims = verifyJwt(authHeader.slice(7));
      if (claims?.restaurantId === id) authorized = true;
    }

    if (!authorized)
      return { statusCode: 403, headers: cors, body: JSON.stringify({ error: "Not authorized" }) };

    const body = JSON.parse(event.body ?? "{}");
    const { menu, name, location, image, cuisine, deliveryTime, deliveryFee, isVeg, offer, rating } = body;

    const fields = [];
    const values = [];

    if (menu !== undefined)        { fields.push("menu = ?");         values.push(JSON.stringify(menu)); }
    if (name !== undefined)        { fields.push("name = ?");         values.push(name); }
    if (location !== undefined)    { fields.push("location = ?");     values.push(location); }
    if (image !== undefined)       { fields.push("image = ?");        values.push(image); }
    if (cuisine !== undefined)     { fields.push("cuisine = ?");      values.push(cuisine); }
    if (deliveryTime !== undefined){ fields.push("deliveryTime = ?"); values.push(deliveryTime); }
    if (deliveryFee !== undefined) { fields.push("deliveryFee = ?");  values.push(deliveryFee); }
    if (isVeg !== undefined)       { fields.push("isVeg = ?");        values.push(isVeg ? 1 : 0); }
    if (offer !== undefined)       { fields.push("offer = ?");        values.push(offer); }
    if (rating !== undefined)      { fields.push("rating = ?");       values.push(rating); }

    if (!fields.length)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "No fields to update" }) };

    values.push(id);
    await conn.execute(`UPDATE restaurants SET ${fields.join(", ")} WHERE restaurantId = ?`, values);

    const [rows] = await conn.execute("SELECT * FROM restaurants WHERE restaurantId = ?", [id]);
    const r = rows[0];
    return { statusCode: 200, headers: cors, body: JSON.stringify({ data: { ...r, menu: r.menu ? JSON.parse(r.menu) : [] } }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  } finally {
    await conn.end();
  }
};
