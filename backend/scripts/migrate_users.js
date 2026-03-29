require('dotenv').config();
const db = require('../src/config/db');

async function migrate() {
  try {
    console.log("Migrating users table...");
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'
    `);
    console.log("✅ Users table migrated successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
