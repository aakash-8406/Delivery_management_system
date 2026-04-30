import mysql from "mysql2/promise";

const MASTER = process.env.MASTER_KEY;
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
    const restaurantId = event.pathParameters?.id;
    const masterKey    = event.headers?.["x-master-key"] ?? event.headers?.["X-Master-Key"];

    if (!masterKey || masterKey !== MASTER)
      return { statusCode: 403, headers: cors, body: JSON.stringify({ error: "Invalid master key" }) };
    if (!restaurantId)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "restaurantId required" }) };

    await conn.execute("DELETE FROM restaurants WHERE restaurantId = ?", [restaurantId]);
    return { statusCode: 200, headers: cors, body: JSON.stringify({ data: { deleted: restaurantId } }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  } finally {
    await conn.end();
  }
};
