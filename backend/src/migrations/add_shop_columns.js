require('dotenv').config();
const db = require('../config/db');

async function migrate() {
  try {
    await db.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{}'::jsonb`);
    console.log("Added operating_hours column");
    await db.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS services_offered JSONB DEFAULT '[]'::jsonb`);
    console.log("Added services_offered column");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
