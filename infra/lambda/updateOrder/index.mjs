import mysql from "mysql2/promise";
import { createHmac } from "crypto";

const SECRET = process.env.JWT_SECRET;
const VALID  = ["ACCEPTED", "DELAYED", "REJECTED", "DELIVERED"];
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
    const id = event.pathParameters?.id;
    const { status } = JSON.parse(event.body ?? "{}");

    if (!id)                      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "id required" }) };
    if (!VALID.includes(status))  return { statusCode: 400, headers: cors, body: JSON.stringify({ error: `status must be one of: ${VALID.join(", ")}` }) };

    const claims = verifyToken(event.headers?.authorization ?? event.headers?.Authorization);
    if (claims) {
      const [rows] = await conn.execute("SELECT restaurantId FROM orders WHERE id = ?", [id]);
      if (rows.length > 0 && rows[0].restaurantId && rows[0].restaurantId !== claims.restaurantId)
        return { statusCode: 403, headers: cors, body: JSON.stringify({ error: "Forbidden — not your order" }) };
    }

    const updatedAt = new Date().toISOString();
    const [result] = await conn.execute("UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?", [status, updatedAt, id]);
    if (result.affectedRows === 0)
      return { statusCode: 404, headers: cors, body: JSON.stringify({ error: "Order not found" }) };

    const [rows] = await conn.execute("SELECT * FROM orders WHERE id = ?", [id]);
    const item = { ...rows[0], items: JSON.parse(rows[0].items ?? "[]") };
    return { statusCode: 200, headers: cors, body: JSON.stringify({ data: item }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  } finally {
    await conn.end();
  }
};
