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
    const { email, password } = JSON.parse(event.body ?? "{}");
    if (!email || !password)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "email and password are required" }) };

    const [rows] = await conn.execute("SELECT * FROM restaurants WHERE restaurantId = ?", [email]);
    const item = rows[0];
    if (!item || item.password !== hashPassword(password))
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Invalid email or password" }) };

    item.menu = JSON.parse(item.menu ?? "[]");
    const token = makeToken({ restaurantId: item.restaurantId, name: item.name });
    const { password: _, ...safe } = item;
    return { statusCode: 200, headers: cors, body: JSON.stringify({ data: { token, restaurant: safe } }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  } finally {
    await conn.end();
  }
};
