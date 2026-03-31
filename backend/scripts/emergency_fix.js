
require('dotenv').config({ path: 'd:/New Projects/workshop/backend/.env' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixAccess() {
  try {
    await pool.query('BEGIN');

    // 1. Ensure SUPER_ADMIN Role exists
    const roleRes = await pool.query(`
      INSERT INTO roles (name, slug, description, status)
      VALUES ('SUPER ADMIN', 'super-admin', 'System oversight.', 'active')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);
    const superAdminId = roleRes.rows[0].id;

    // 2. Map user Alen James back to SUPER_ADMIN
    await pool.query(`
       UPDATE users 
       SET role = 'super-admin', role_id = $1 
       WHERE phone = '8921837945'
    `, [superAdminId]);

    // 3. Clear ALL current mappings and re-map EVERYTHING to super-admin 
    // This solves the 'cant see anything' issue immediately
    await pool.query('DELETE FROM role_permissions WHERE role_id = $1', [superAdminId]);
    await pool.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT $1, id FROM permissions
    `, [superAdminId]);

    await pool.query('COMMIT');
    console.log("✅ ACCESS RESTORED: User 'alen james' is now a SUPER_ADMIN and has ALL permissions.");
    process.exit(0);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error("❌ Fix failed:", err);
    process.exit(1);
  }
}

fixAccess();
