require('dotenv').config();
const db = require('../src/config/db');

async function seed() {
  try {
    console.log("🌱 START SEEDING: Permissions & Roles...");

    await db.query('BEGIN');

    // 1. CLEAR OLD (Careful for prod, but needed for fresh start here)
    // await db.query('DELETE FROM role_permissions');
    // await db.query('DELETE FROM roles');
    // await db.query('DELETE FROM permissions');

    // 2. CORE PERMISSIONS
    const modules = [
      { name: 'PERMISSION', slugs: ['view:permission', 'create:new:permission', 'edit:permissions', 'delete:permission'] },
      { name: 'ROLE', slugs: ['view:role', 'create:role', 'edit:role', 'delete:role'] },
      { name: 'USERS', slugs: ['view:users', 'create:users', 'edit:users', 'delete:users'] },
      { name: 'CUSTOMERS', slugs: ['view:customers', 'create:customers', 'edit:customers', 'delete:customers'] },
      { name: 'INVOICES', slugs: ['view:invoices', 'create:invoices', 'edit:invoices', 'delete:invoices'] },
      { name: 'REPORTS', slugs: ['view:reports', 'generate:reports'] },
      { name: 'REPAIRS', slugs: ['view:repairs', 'create:repair', 'edit:repair', 'delete:repair'] },
      { name: 'VEHICLES', slugs: ['view:vehicles', 'create:vehicle', 'edit:vehicle'] }
    ];

    console.log("-> Inserting permissions...");
    for (const m of modules) {
      for (const slug of m.slugs) {
        await db.query(`
          INSERT INTO permissions (module_name, permission_name, slug, status)
          VALUES ($1, $2, $3, 'active')
          ON CONFLICT (slug) DO NOTHING
        `, [m.name, slug.replace(/:/g, ' ').toUpperCase(), slug]);
      }
    }

    // 3. CORE ROLES
    console.log("-> Inserting roles...");
    const roles = [
      { name: 'SUPER ADMIN', slug: 'super-admin', desc: 'Ultimate system administrator.' },
      { name: 'SHOP_OWNER', slug: 'shop_owner', desc: 'Full workshop management powers.' },
      { name: 'WORKER', slug: 'worker', desc: 'Can manage repairs and vehicles.' }
    ];

    const roleMap = {};
    for (const r of roles) {
      const res = await db.query(`
        INSERT INTO roles (name, slug, description, status)
        VALUES ($1, $2, $3, 'active')
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
        RETURNING id, slug
      `, [r.name, r.slug, r.desc]);
      roleMap[res.rows[0].slug] = res.rows[0].id;
    }

    // 4. MAPPINGS
    // Fetch all permission IDs 
    const permRes = await db.query('SELECT id, slug FROM permissions');
    const perms = {};
    permRes.rows.forEach(p => perms[p.slug] = p.id);

    console.log("-> Mapping permissions...");
    
    const mappings = {
      'super-admin': Object.keys(perms), // Everything
      'shop_owner': [
        'view:users', 'create:users', 'edit:users', 'delete:users',
        'view:customers', 'create:customers', 'edit:customers',
        'view:invoices', 'create:invoices', 'edit:invoices',
        'view:reports', 'generate:reports',
        'view:repairs', 'create:repair', 'edit:repair',
        'view:vehicles', 'create:vehicle', 'edit:vehicle',
        'view:role', 'view:permission'
      ],
      'worker': [
        'view:customers', 'create:customers',
        'view:repairs', 'create:repair', 'edit:repair',
        'view:vehicles', 'create:vehicle'
      ]
    };

    for (const [roleSlug, slugs] of Object.entries(mappings)) {
      const roleId = roleMap[roleSlug];
      if (!roleId) continue;

      for (const pSlug of slugs) {
        const permId = perms[pSlug];
        if (permId) {
          await db.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `, [roleId, permId]);
        }
      }
    }

    await db.query('COMMIT');
    console.log("✅ SEEDING COMPLETE: Global admin mapped to 'super-admin' slug.");
    process.exit(0);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seed();
