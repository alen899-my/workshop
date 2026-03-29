require('dotenv').config();
const db = require('../src/config/db');

async function mapEnforcement() {
  try {
    console.log("Applying Role-to-User enforcement...");

    // 1. Ensure the default value in Users table is something that exists in Roles table
    // Seed script created 'worker' slug.
    await db.query(`
      ALTER TABLE users 
      ALTER COLUMN role SET DEFAULT 'worker'
    `);

    // 2. Add Foreign Key if NOT exists
    // We name it 'fk_user_role' to keep track
    await db.query(`
      ALTER TABLE users
      ADD CONSTRAINT fk_user_role
      FOREIGN KEY (role) 
      REFERENCES roles(slug)
      ON UPDATE CASCADE
      ON DELETE SET DEFAULT
    `);

    console.log("✅ Role Mapping successfully enforced in database schema.");
    process.exit(0);
  } catch (err) {
    if (err.code === '42710') {
      console.log("ℹ️ Foreign Key mapping already exists. Skipping.");
      process.exit(0);
    }
    console.error("❌ Mapping enforcement failed:", err);
    process.exit(1);
  }
}

mapEnforcement();
