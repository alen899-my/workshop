const db = require('./src/config/db');

async function updateUsersTable() {
  try {
    console.log("Adding email and reset password fields to users table...");
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
      ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;
    `);
    console.log("Successfully updated users table");
  } catch (error) {
    console.error("Error updating users table:", error);
  } finally {
    process.exit();
  }
}

updateUsersTable();
