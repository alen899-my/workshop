require('dotenv').config();
const db = require('./src/config/db');

async function check() {
  try {
    const res = await db.query(`
      SELECT p.slug 
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      JOIN roles r ON rp.role_id = r.id
      WHERE r.slug = 'super-admin' AND p.slug = 'view:invoices'
    `);
    console.log("Count:", res.rows.length);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
