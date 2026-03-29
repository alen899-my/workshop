require('dotenv').config();
const db = require('../src/config/db');

async function upgradeToAdmin() {
  try {
    const phone = '8921837945';
    
    // Find admin role ID
    const roleR = await db.query("SELECT id FROM roles WHERE slug = 'admin'");
    if (roleR.rows.length === 0) {
      console.error("Master 'admin' role not found in the roles table.");
      process.exit(1);
    }
    const adminId = roleR.rows[0].id;

    // Update user
    const result = await db.query(
      "UPDATE users SET role = 'admin', role_id = $1 WHERE phone = $2 RETURNING name",
      [adminId, phone]
    );

    if (result.rows.length > 0) {
      console.log(`🚀 User [${result.rows[0].name}] successfully upgraded to SUPERADMIN.`);
    } else {
      console.log(`❌ User with phone ${phone} not found.`);
    }
    process.exit(0);
  } catch (err) {
    console.error("Upgrade error:", err);
    process.exit(1);
  }
}

upgradeToAdmin();
