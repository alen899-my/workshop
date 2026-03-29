require('dotenv').config();
const db = require('./src/config/db');

(async () => {
  try {
    // Add service_type to repairs
    await db.query(`ALTER TABLE repairs ADD COLUMN IF NOT EXISTS service_type VARCHAR(50) DEFAULT 'Repair'`);

    // Create repair_bills table
    await db.query(`
      CREATE TABLE IF NOT EXISTS repair_bills (
        id SERIAL PRIMARY KEY,
        repair_id INTEGER REFERENCES repairs(id) ON DELETE CASCADE UNIQUE,
        items JSONB DEFAULT '[]',
        service_charge DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Also update repair.model.js statically so future initDb works correctly
    console.log('Database schemas updated successfully.');
  } catch(e) { console.error(e) }
  process.exit(0);
})();
