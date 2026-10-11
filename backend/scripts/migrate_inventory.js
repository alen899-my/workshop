require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

(async () => {
  const client = await db.pool.connect();
  try {
    await client.query(fs.readFileSync(path.join(__dirname, '../src/migrations/create_inventory.sql'), 'utf8'));
    console.log('Inventory migration complete');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Inventory migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await db.pool.end();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
