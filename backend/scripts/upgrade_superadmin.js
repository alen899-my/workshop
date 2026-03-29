require('dotenv').config();
const db = require('../src/config/db');

async function upgrade() {
  try {
    const res = await db.query(
      "UPDATE users SET role = 'super-admin', role_id = 4 WHERE phone = '8921837945' RETURNING id, name, role"
    );
    console.log('✅ Identity Elevated:', JSON.stringify(res.rows[0], null, 2));
    process.exit(0);
  } catch (e) {
    console.error('Elevation Error:', e.message);
    process.exit(1);
  }
}

upgrade();
