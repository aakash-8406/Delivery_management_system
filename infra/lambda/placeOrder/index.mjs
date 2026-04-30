import mysql from "mysql2/promise";
import { randomUUID } from "crypto";

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

export const handler = async (event) => {
  const conn = await getConn();
  try {
    const { customerName, items, totalAmount, deliveryFee, platformFee, deliveryAddress, details, restaurantId, userId } = JSON.parse(event.body ?? "{}");

    if (!customerName || !items?.length)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "customerName and items are required" }) };

    const totalItems = items.reduce((s, i) => s + (i.qty ?? i.quantity ?? 1), 0);
    const order = {
      id: randomUUID(),
      userId: userId ?? "guest",
      restaurantId: restaurantId ?? "default",
      customerName,
      items: JSON.stringify(items),
      details: details ?? "",
      totalAmount: totalAmount ?? 0,
      deliveryFee: deliveryFee ?? 0,
      platformFee: platformFee ?? 0,
      deliveryAddress: deliveryAddress ?? "",
      status: "ACCEPTED",
      prepTime: 10 + totalItems * 5,
      createdAt: new Date().toISOString(),
    };

    await conn.execute(
      `INSERT INTO orders (id, userId, restaurantId, customerName, items, details, totalAmount, deliveryFee, platformFee, deliveryAddress, status, prepTime, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [order.id, order.userId, order.restaurantId, order.customerName, order.items, order.details,
       order.totalAmount, order.deliveryFee, order.platformFee, order.deliveryAddress, order.status, order.prepTime, order.createdAt]
    );

    return { statusCode: 201, headers: cors, body: JSON.stringify({ data: { ...order, items } }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  } finally {
    await conn.end();
  }
};
