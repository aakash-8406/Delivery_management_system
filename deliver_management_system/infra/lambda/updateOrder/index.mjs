import mysql from "mysql2/promise";

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
    const id = event.pathParameters?.id;
    if (!id) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "id required" }) };

    const { status, prepTime } = JSON.parse(event.body ?? "{}");
    if (!status) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "status required" }) };

    const updatedAt = new Date().toISOString();
    await conn.execute(
      "UPDATE orders SET status = ?, prepTime = ?, updatedAt = ? WHERE id = ?",
      [status, prepTime ?? 10, updatedAt, id]
    );

    const [rows] = await conn.execute("SELECT * FROM orders WHERE id = ?", [id]);
    if (!rows.length) return { statusCode: 404, headers: cors, body: JSON.stringify({ error: "Order not found" }) };

    const r = rows[0];
    return { statusCode: 200, headers: cors, body: JSON.stringify({ data: { ...r, items: r.items ? JSON.parse(r.items) : [] } }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  } finally {
    await conn.end();
  }
};
