
require('dotenv').config({ path: __dirname + '/../.env' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const roles = await pool.query('SELECT id, slug, name FROM roles');
    console.log('ROLES:', JSON.stringify(roles.rows, null, 2));
    
    const usersAdmin = await pool.query("SELECT id, name, role, role_id FROM users WHERE role = 'super-admin' OR role = 'admin'");
    console.log('ADMIN USERS:', JSON.stringify(usersAdmin.rows, null, 2));
    
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
check();
