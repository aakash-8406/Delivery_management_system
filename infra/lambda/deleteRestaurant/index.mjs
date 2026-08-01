import mysql from "mysql2/promise";

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

export const handler = async (event) => {
  const conn = await getConn();
  try {
    const masterKey = event.headers?.["x-master-key"] ?? event.headers?.["X-Master-Key"];
    if (masterKey !== MASTER_KEY)
      return { statusCode: 403, headers: cors, body: JSON.stringify({ error: "Invalid master key" }) };

    const id = event.pathParameters?.id;
    if (!id) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "id required" }) };

    await conn.execute("DELETE FROM restaurants WHERE restaurantId = ?", [id]);
    return { statusCode: 200, headers: cors, body: JSON.stringify({ message: "Restaurant deleted" }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  } finally {
    await conn.end();
  }
};
