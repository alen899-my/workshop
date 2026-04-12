const db = require('../config/db');

// Define table schema and create method for Shop entity
const createShopTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS shops (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255),
      address TEXT,
      state VARCHAR(100),
      city VARCHAR(100),
      country VARCHAR(100) DEFAULT 'India',
      currency VARCHAR(20) DEFAULT 'INR',
      owner_name VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      place_id VARCHAR(255),
      operating_hours JSONB DEFAULT '{}'::jsonb,
      services_offered JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await db.query(query);
  console.log("✅ Shops table ready");
};

module.exports = {
  createShopTable
};
