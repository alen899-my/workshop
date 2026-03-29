require('dotenv').config();
const db = require('../src/config/db');

async function seedShops() {
  try {
    console.log("Seeding Shops module permissions...");
    
    const perms = [
      { name: 'VIEW SHOPS', slug: 'view:shops' },
      { name: 'CREATE SHOP', slug: 'create:shops' },
      { name: 'EDIT SHOP', slug: 'edit:shops' },
      { name: 'DELETE SHOP', slug: 'delete:shops' }
    ];

    const roleR = await db.query("SELECT id FROM roles WHERE slug = 'admin'");
    if (roleR.rows.length === 0) { console.error("Admin role not found!"); process.exit(1); }
    const roleId = roleR.rows[0].id;

    for (const p of perms) {
      const pR = await db.query(
        "INSERT INTO permissions (module_name, permission_name, slug, status) VALUES ($1, $2, $3, 'active') ON CONFLICT (slug) DO UPDATE SET permission_name = EXCLUDED.permission_name RETURNING id",
        ['SHOPS', p.name, p.slug]
      );
      await db.query(
        "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [roleId, pR.rows[0].id]
      );
    }

    console.log("✅ Shop module permissions seeded and mapped to admin.");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seedShops();
