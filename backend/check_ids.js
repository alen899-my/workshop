require('dotenv').config();
const db = require('./src/config/db');

async function check() {
  try {
    const roles = await db.query("SELECT * FROM roles");
    console.log("Roles:", roles.rows);
    const perms = await db.query("SELECT * FROM permissions WHERE slug = 'view:invoices'");
    console.log("Permission:", perms.rows[0]);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
