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

const hashPassword = (pw) => createHmac("sha256", SECRET).update(pw).digest("hex");

const makeToken = (payload) => {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body   = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString("base64url");
  const sig    = createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
};

export const handler = async (event) => {
  const conn = await getConn();
  try {
    const { name, location, email, password } = JSON.parse(event.body ?? "{}");
    if (!name || !email || !password)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "name, email and password are required" }) };

    const [existing] = await conn.execute("SELECT restaurantId FROM restaurants WHERE restaurantId = ?", [email]);
    if (existing.length > 0)
      return { statusCode: 409, headers: cors, body: JSON.stringify({ error: "Email already registered" }) };

    const createdAt = new Date().toISOString();
    await conn.execute(
      "INSERT INTO restaurants (restaurantId, name, location, email, password, menu, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [email, name, location ?? "", email, hashPassword(password), "[]", createdAt]
    );

    const token = makeToken({ restaurantId: email, name });
    const restaurant = { restaurantId: email, name, location: location ?? "", email, menu: [], createdAt };
    return { statusCode: 201, headers: cors, body: JSON.stringify({ data: { token, restaurant } }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  } finally {
    await conn.end();
  }
};
