require('dotenv').config();
const db = require('./src/config/db');

async function check() {
  try {
    const res = await db.query("SELECT * FROM role_permissions WHERE permission_slug = 'view:invoices'");
    console.log("Roles with view:invoices:", res.rows);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
