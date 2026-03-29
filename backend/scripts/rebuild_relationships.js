require('dotenv').config();
const db = require('../src/config/db');

async function structureFix() {
  try {
    console.log("⚙️  REBUILDING RELATIONSHIPS: ID-BASED MAPPING...");
    await db.query('BEGIN');

    // 1. Rebuild role_permissions to use IDs
    await db.query(`DROP TABLE IF EXISTS role_permissions`);
    await db.query(`
      CREATE TABLE role_permissions (
        role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
        permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
      )
    `);

    // 2. Add role_id to users and migrate data
    // First, ensure 'role_id' column exists
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id)`);

    // 3. Migrate role strings to role IDs
    await db.query(`
      UPDATE users u
      SET role_id = r.id
      FROM roles r
      WHERE u.role = r.slug
    `);

    // 4. (Optional) Cleanup the old string column or keep it for safety for now
    // We will keep it for now but make role_id the primary driver

    await db.query('COMMIT');
    console.log("✅ Database Relationships successfully connected via IDs.");
    process.exit(0);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error("❌ Relationship rebuild failed:", err);
    process.exit(1);
  }
}

structureFix();
