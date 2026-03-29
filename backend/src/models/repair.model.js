const db = require('../config/db');

const createRepairTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS repairs (
      id SERIAL PRIMARY KEY,
      shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
      vehicle_image TEXT,
      vehicle_number VARCHAR(100) NOT NULL,
      owner_name VARCHAR(150),
      phone_number VARCHAR(50),
      complaints TEXT,
      repair_date TIMESTAMP,
      attending_worker_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      submitted_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      status VARCHAR(50) DEFAULT 'Pending', -- Pending | Started | In Progress | Completed
      service_type VARCHAR(50) DEFAULT 'Repair', -- Service | Repair | Servicing | Other
      vehicle_type VARCHAR(50) DEFAULT 'Car', -- Car | Bike | Cycle | Transport
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await db.query(query);
  console.log("✅ Repairs table ready");
};

module.exports = {
  createRepairTable
};
