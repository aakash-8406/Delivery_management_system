import mysql from "mysql2/promise";

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
    const { restaurantId, userId } = event.queryStringParameters ?? {};

    let sql = "SELECT * FROM orders";
    const params = [];

    if (restaurantId && userId) {
      sql += " WHERE restaurantId = ? AND userId = ?";
      params.push(restaurantId, userId);
    } else if (restaurantId) {
      sql += " WHERE restaurantId = ?";
      params.push(restaurantId);
    } else if (userId) {
      sql += " WHERE userId = ?";
      params.push(userId);
    }

    sql += " ORDER BY createdAt DESC";

    const [rows] = await conn.execute(sql, params);
    const items = rows.map(r => ({ ...r, items: JSON.parse(r.items ?? "[]") }));
    return { statusCode: 200, headers: cors, body: JSON.stringify({ data: items }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  } finally {
    await conn.end();
  }
};
