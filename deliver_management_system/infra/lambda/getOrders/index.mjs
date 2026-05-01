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
    const restaurantId = event.queryStringParameters?.restaurantId;
    const userId       = event.queryStringParameters?.userId;

    let query = "SELECT * FROM orders";
    const params = [];

    if (restaurantId) {
      query += " WHERE restaurantId = ?";
      params.push(restaurantId);
    } else if (userId) {
      query += " WHERE userId = ?";
      params.push(userId);
    }

    query += " ORDER BY createdAt DESC";

    const [rows] = await conn.execute(query, params);
    const data = rows.map(r => ({ ...r, items: r.items ? JSON.parse(r.items) : [] }));
    return { statusCode: 200, headers: cors, body: JSON.stringify({ data }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  } finally {
    await conn.end();
  }
};
