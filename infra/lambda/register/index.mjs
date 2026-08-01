import mysql from "mysql2/promise";
import { createHash } from "crypto";
import { randomUUID } from "crypto";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,x-master-key",
  "Content-Type": "application/json",
};

const MASTER_KEY = process.env.MASTER_KEY ?? "MASTER-SMARTQUEUE-2024";

const getConn = () => mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const hash = (pw) => createHash("sha256").update(pw).digest("hex");

export const handler = async (event) => {
  const conn = await getConn();
  try {
    const masterKey = event.headers?.["x-master-key"] ?? event.headers?.["X-Master-Key"];
    if (masterKey !== MASTER_KEY)
      return { statusCode: 403, headers: cors, body: JSON.stringify({ error: "Invalid master key" }) };

    const { name, email: rawEmail, password, location, image, cuisine, deliveryTime, deliveryFee, isVeg } = JSON.parse(event.body ?? "{}");
    const email = rawEmail?.toLowerCase().trim();
    if (!name || !email || !password)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "name, email and password required" }) };

    const [existing] = await conn.execute("SELECT restaurantId FROM restaurants WHERE email = ?", [email]);
    if (existing.length)
      return { statusCode: 409, headers: cors, body: JSON.stringify({ error: "Email already registered" }) };

    const restaurantId = randomUUID();
    const createdAt = new Date().toISOString();

    await conn.execute(
      `INSERT INTO restaurants (restaurantId, name, email, password, location, image, cuisine, deliveryTime, deliveryFee, isVeg, menu, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [restaurantId, name, email, hash(password), location ?? "", image ?? null, cuisine ?? null,
       deliveryTime ?? null, deliveryFee ?? null, isVeg ? 1 : 0, "[]", createdAt]
    );

    return { statusCode: 201, headers: cors, body: JSON.stringify({ data: { restaurantId, name, email, createdAt } }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  } finally {
    await conn.end();
  }
};
