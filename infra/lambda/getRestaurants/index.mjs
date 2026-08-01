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

export const handler = async () => {
  const conn = await getConn();
  try {
    const [rows] = await conn.execute("SELECT * FROM restaurants");
    const data = rows.map(r => ({ ...r, menu: r.menu ? JSON.parse(r.menu) : [] }));
    return { statusCode: 200, headers: cors, body: JSON.stringify({ data }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  } finally {
    await conn.end();
  }
};
