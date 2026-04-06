const db = require('../config/db');

// Define table schema and create method for User entity
const createUserTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
      name VARCHAR(100), -- Added individual name
      phone VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      reset_password_token VARCHAR(255),
      reset_password_expires TIMESTAMP,
      role VARCHAR(50) DEFAULT 'worker', -- Defaulting to worker for new entries
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await db.query(query);
  console.log("✅ Users table ready");
};

module.exports = {
  createUserTable
};
