import mysql from "mysql2/promise";
import { randomUUID } from "crypto";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,x-master-key",
  "Content-Type": "application/json",
};

const getConn = () => mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const verifyCustomerToken = (authHeader) => {
  if (!authHeader?.startsWith("Bearer cq_")) return null;
  try {
    const email = Buffer.from(authHeader.slice(10), "base64").toString("utf8");
    return email.includes("@") ? { email } : null;
  } catch { return null; }
};

export const handler = async (event) => {
  const conn = await getConn();
  try {
    const claims = verifyCustomerToken(event.headers?.authorization ?? event.headers?.Authorization);
    if (!claims)
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Please login to place an order" }) };

    const { customerName, items, totalAmount, deliveryFee, platformFee, deliveryAddress, details, restaurantId, userId } = JSON.parse(event.body ?? "{}");
    if (!customerName || !items?.length)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "customerName and items are required" }) };

    const totalItems = items.reduce((s, i) => s + (i.qty ?? i.quantity ?? 1), 0);
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    await conn.execute(
      `INSERT INTO orders (id, userId, restaurantId, customerName, items, details, totalAmount, deliveryFee, platformFee, deliveryAddress, status, prepTime, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId ?? "guest", restaurantId ?? "default", customerName,
       JSON.stringify(items), details ?? "", totalAmount ?? 0, deliveryFee ?? 0,
       platformFee ?? 0, deliveryAddress ?? "", "ACCEPTED", 10 + totalItems * 5, createdAt]
    );

    return { statusCode: 201, headers: cors, body: JSON.stringify({ data: { id, customerName, items, status: "ACCEPTED", createdAt } }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  } finally {
    await conn.end();
  }
};
