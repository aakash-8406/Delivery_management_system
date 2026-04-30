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
    const restaurantId = event.pathParameters?.id;
    if (!restaurantId)
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "id required" }) };

    const [rows] = await conn.execute(
      "SELECT restaurantId, name, location, email, menu, image, cuisine, rating, deliveryTime, deliveryFee, offer, isVeg, createdAt FROM restaurants WHERE restaurantId = ?",
      [restaurantId]
    );
    if (rows.length === 0)
      return { statusCode: 404, headers: cors, body: JSON.stringify({ error: "Restaurant not found" }) };

    const item = { ...rows[0], menu: JSON.parse(rows[0].menu ?? "[]") };
    return { statusCode: 200, headers: cors, body: JSON.stringify({ data: item }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  } finally {
    await conn.end();
  }
};
