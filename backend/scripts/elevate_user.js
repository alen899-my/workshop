require('dotenv').config();
const db = require('../src/config/db');

async function elevate() {
  const phone = '892183794';
  try {
    const result = await db.query(
      "UPDATE users SET role = 'admin' WHERE phone = $1 RETURNING id, name, role, phone",
      [phone]
    );
    if (result.rows.length === 0) {
      console.log(`❌ User with phone ${phone} not found.`);
    } else {
      console.log(`✅ User ${result.rows[0].name || phone} elevated to ADMIN status.`);
      console.table(result.rows);
    }
    process.exit(0);
  } catch (err) {
    console.error("Elevation failed:", err);
    process.exit(1);
  }
}

elevate();
