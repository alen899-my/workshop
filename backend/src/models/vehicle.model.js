const db = require('../config/db');

/** Handle Vehicle storage and synchronization linked to Customer profile */
const createVehicleTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS vehicles (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
      vehicle_number VARCHAR(50) NOT NULL,
      model_name VARCHAR(255),
      vehicle_type VARCHAR(100),
      vehicle_image TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await db.query(query);
  console.log("✅ Vehicles table ready");
};

module.exports = {
  createVehicleTable
};
