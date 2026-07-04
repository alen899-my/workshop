const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('Adding new fields to repairs table...');
    await pool.query('ALTER TABLE repairs ADD COLUMN IF NOT EXISTS brand VARCHAR(255);');
    await pool.query('ALTER TABLE repairs ADD COLUMN IF NOT EXISTS km_reading VARCHAR(50);');
    await pool.query('ALTER TABLE repairs ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(50);');
    await pool.query("ALTER TABLE repairs ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'Medium';");
    await pool.query('ALTER TABLE repairs ADD COLUMN IF NOT EXISTS expected_completion TIMESTAMP;');
    console.log('Adding brand to vehicles table...');
    await pool.query('ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS brand VARCHAR(255);');
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
