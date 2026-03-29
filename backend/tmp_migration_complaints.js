const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log("Migrating complaints to JSONB...");
    
    // 1. Alter column type to JSONB
    // If it currently contains string text, it might need casting or just clear it.
    // For safety, clear or just cast if blank.
    await pool.query('ALTER TABLE repairs ALTER COLUMN complaints TYPE JSONB USING CASE WHEN complaints IS NULL OR complaints = \'\' THEN \'[]\'::JSONB ELSE jsonb_build_array(complaints) END');
    
    console.log("✅ complaints is now JSONB");
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    await pool.end();
    process.exit(1);
  }
}

migrate();
