require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
(async () => {
  const client = await db.pool.connect();
  try {
    await client.query(fs.readFileSync(path.join(__dirname, '../src/migrations/repair_workflow.sql'), 'utf8'));
    console.log('Repair workflow migration complete');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Repair workflow migration failed:', error.code || error.message);
    process.exitCode = 1;
  } finally { client.release(); await db.pool.end(); }
})();
