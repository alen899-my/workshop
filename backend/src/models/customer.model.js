const db = require('../config/db');

/** Handle Customer storage and synchronization */
const createCustomerTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
      name VARCHAR(255),
      phone VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await db.query(query);
  console.log("✅ Customers table ready");
};

module.exports = {
  createCustomerTable
};
