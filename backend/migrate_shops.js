require('dotenv').config();
const db = require('./src/config/db');

async function migrate() {
  try {
    console.log("Starting migration...");
    await db.query(`
      ALTER TABLE shops 
      ADD COLUMN IF NOT EXISTS state VARCHAR(100), 
      ADD COLUMN IF NOT EXISTS city VARCHAR(100), 
      ADD COLUMN IF NOT EXISTS address TEXT
    `);
    console.log("✅ Shops table migration successful (state, city, address added)");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  } finally {
    process.exit();
  }
}

migrate();
