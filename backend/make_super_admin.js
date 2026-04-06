require('dotenv').config();
const db = require('./src/config/db');

async function makeSuperAdmin() {
  try {
    const email = 'alenjames899@gmail.com';
    const roleSlug = 'super-admin';

    // 1. Get role_id for super-admin
    const roleRes = await db.query('SELECT id FROM roles WHERE slug = $1', [roleSlug]);
    if (roleRes.rows.length === 0) {
      console.log('Role not found!');
      return;
    }
    const roleId = roleRes.rows[0].id;

    // 2. Update user
    const updateRes = await db.query(
      'UPDATE users SET role = $1, role_id = $2 WHERE email = $3 RETURNING *',
      [roleSlug, roleId, email]
    );

    if (updateRes.rows.length > 0) {
      console.log('✅ Success! Transformed to super-admin:');
      console.log(updateRes.rows[0].name, ' / ', updateRes.rows[0].email);
    } else {
      console.log('❌ User not found with email:', email);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

makeSuperAdmin();
