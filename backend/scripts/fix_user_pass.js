require('dotenv').config();
const db = require('../src/config/db');
const bcrypt = require('bcryptjs');

async function fixUser() {
  try {
    const phone = '8921837945';
    const password = 'admin@123';
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    // Update the record
    const result = await db.query(
      'UPDATE users SET password_hash = $1 WHERE phone = $2 RETURNING id, name',
      [hash, phone]
    );

    if (result.rows.length > 0) {
      console.log(`✅ User [${result.rows[0].name}] password updated to: ${password}`);
    } else {
      console.log(`❌ User with phone ${phone} not found in the workshop registry.`);
    }
    process.exit(0);
  } catch (err) {
    console.error("System error during credential update:", err);
    process.exit(1);
  }
}

fixUser();
