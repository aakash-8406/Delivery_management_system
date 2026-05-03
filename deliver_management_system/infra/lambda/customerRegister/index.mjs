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

export const handler = async (event) => {
  const conn = await getConn();
  try {
    const { name, email: rawEmail, password, phone, address } = JSON.parse(event.body ?? "{}");
    const email = rawEmail?.toLowerCase().trim();
    if (!name || !email || !password)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "name, email and password required" }) };

    const [existing] = await conn.execute("SELECT customerId FROM customers WHERE email = ?", [email]);
    if (existing.length)
      return { statusCode: 409, headers: cors, body: JSON.stringify({ error: "Email already registered" }) };

    const customerId = randomUUID();
    const createdAt = new Date().toISOString();
    // Simple base64 token for customer auth
    const token = "cq_" + Buffer.from(email).toString("base64");

    await conn.execute(
      `INSERT INTO customers (customerId, name, email, password, phone, address, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customerId, name, email, password, phone ?? "", address ?? "", createdAt]
    );

    return {
      statusCode: 201, headers: cors,
      body: JSON.stringify({ data: { token, user: { customerId, name, email, createdAt } } })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  } finally {
    await conn.end();
  }
};
