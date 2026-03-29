const db = require('../config/db');

// Define table schema and create method for Shop entity
const createShopTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS shops (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      owner_name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await db.query(query);
  console.log("✅ Shops table ready");
};

module.exports = {
  createShopTable
};
