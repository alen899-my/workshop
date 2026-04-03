require('dotenv').config();
const db = require('./src/config/db');

async function check() {
  try {
    const roles = await db.query("SELECT * FROM roles");
    console.log("Roles Slugs:", roles.rows.map(r => r.slug));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
