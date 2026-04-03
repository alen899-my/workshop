require('dotenv').config();
const db = require('./src/config/db');

async function check() {
  try {
    const res = await db.query("SELECT * FROM permissions WHERE slug = 'view:invoices'");
    console.log("Permission:", res.rows[0]);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
