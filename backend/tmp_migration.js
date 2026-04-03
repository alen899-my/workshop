require('dotenv').config();
const db = require('./src/config/db');

async function migrate() {
  try {
    console.log('Adding country to shops...');
    await db.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS country VARCHAR(255) DEFAULT 'India'`);
    console.log('Adding currency to shops...');
    await db.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS currency VARCHAR(20) DEFAULT 'INR'`);
    console.log('Migration complete');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrate();
