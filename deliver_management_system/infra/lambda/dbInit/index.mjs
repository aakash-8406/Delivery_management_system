import mysql from "mysql2/promise";

const cors = {
  "Access-Control-Allow-Origin": "*",
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
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS restaurants (
        restaurantId VARCHAR(255) PRIMARY KEY,
        name         VARCHAR(255) NOT NULL,
        location     VARCHAR(255) DEFAULT '',
        email        VARCHAR(255) NOT NULL,
        password     VARCHAR(255) NOT NULL,
        menu         LONGTEXT     NULL,
        image        VARCHAR(500) DEFAULT NULL,
        cuisine      VARCHAR(255) DEFAULT NULL,
        rating       DECIMAL(3,1) DEFAULT NULL,
        deliveryTime VARCHAR(50)  DEFAULT NULL,
        deliveryFee  DECIMAL(10,2) DEFAULT NULL,
        offer        VARCHAR(255) DEFAULT NULL,
        isVeg        TINYINT(1)   DEFAULT 0,
        createdAt    VARCHAR(50)  NOT NULL
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        customerId VARCHAR(36)   PRIMARY KEY,
        name       VARCHAR(255)  NOT NULL,
        email      VARCHAR(255)  NOT NULL UNIQUE,
        password   VARCHAR(255)  NOT NULL,
        phone      VARCHAR(50)   DEFAULT NULL,
        address    TEXT          NULL,
        createdAt  VARCHAR(50)   NOT NULL
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id              VARCHAR(36)   PRIMARY KEY,
        userId          VARCHAR(255)  NOT NULL,
        restaurantId    VARCHAR(255)  NOT NULL,
        customerName    VARCHAR(255)  NOT NULL,
        items           LONGTEXT      NOT NULL,
        details         TEXT          NULL,
        totalAmount     DECIMAL(10,2) DEFAULT 0,
        deliveryFee     DECIMAL(10,2) DEFAULT 0,
        platformFee     DECIMAL(10,2) DEFAULT 0,
        deliveryAddress TEXT          NULL,
        status          VARCHAR(50)   DEFAULT 'ACCEPTED',
        prepTime        INT           DEFAULT 10,
        createdAt       VARCHAR(50)   NOT NULL,
        updatedAt       VARCHAR(50)   DEFAULT NULL
      )
    `);

    return { statusCode: 200, headers: cors, body: JSON.stringify({ message: "Tables created successfully" }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  } finally {
    await conn.end();
  }
};
