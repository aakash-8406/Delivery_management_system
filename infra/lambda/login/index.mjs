import mysql from "mysql2/promise";
import { createHash, createHmac } from "crypto";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,x-master-key",
  "Content-Type": "application/json",
};

const SECRET = process.env.JWT_SECRET ?? "smartqueue-secret";

const getConn = () => mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const hash = (pw) => createHash("sha256").update(pw).digest("hex");

const makeToken = (payload) => {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body   = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString("base64url");
  const sig    = createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
};

export const handler = async (event) => {
  const conn = await getConn();
  try {
    const { email: rawEmail, password } = JSON.parse(event.body ?? "{}");
    const email = rawEmail?.toLowerCase().trim();
    if (!email || !password)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "email and password required" }) };

    const [rows] = await conn.execute("SELECT * FROM restaurants WHERE email = ?", [email]);
    if (!rows.length)
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "No account found with this email" }) };

    const restaurant = rows[0];
    if (restaurant.password !== hash(password))
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Incorrect password" }) };

    const token = makeToken({ restaurantId: restaurant.restaurantId, name: restaurant.name });
    const data = { ...restaurant, menu: restaurant.menu ? JSON.parse(restaurant.menu) : [] };

    return { statusCode: 200, headers: cors, body: JSON.stringify({ data: { token, restaurant: data } }) };
  } catch (err) {
    console.error("Login error:", err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  } finally {
    await conn.end();
  }
};
