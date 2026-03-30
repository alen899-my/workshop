require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fix() {
  const perms = [
    { mod: 'VEHICLES', name: 'DELETE VEHICLE', slug: 'delete:vehicle' },
    { mod: 'CUSTOMERS', name: 'VIEW CUSTOMERS', slug: 'view:customers' },
    { mod: 'CUSTOMERS', name: 'CREATE CUSTOMERS', slug: 'create:customers' },
    { mod: 'CUSTOMERS', name: 'EDIT CUSTOMERS', slug: 'edit:customers' },
    { mod: 'CUSTOMERS', name: 'DELETE CUSTOMERS', slug: 'delete:customers' }
  ];

  try {
    for (const p of perms) {
      await pool.query(
        "INSERT INTO permissions (module_name, permission_name, slug, status) VALUES ($1, $2, $3, 'active') ON CONFLICT (slug) DO NOTHING",
        [p.mod, p.name, p.slug]
      );
      console.log(`✅ Ensured ${p.slug}`);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

fix();
