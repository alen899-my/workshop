require('dotenv').config();
const db = require('../src/config/db');
const bcrypt = require('bcryptjs');

async function masterReset() {
  try {
    console.log("🧨 STARTING MASTER RESET (TRUNCATING ALL TABLES)...");
    await db.query('BEGIN');

    // 1. WIPE EVERYTHING (FK aware)
    await db.query('TRUNCATE shops, users, roles, permissions, role_permissions RESTART IDENTITY CASCADE');
    console.log("-> Tables cleared.");

    // 2. SEED PERMISSIONS
    console.log("-> Seeding permissions registry...");
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

    const permMap = {};
    for (const m of modules) {
      for (const slug of m.slugs) {
        const res = await db.query(
          "INSERT INTO permissions (module_name, permission_name, slug, status) VALUES ($1, $2, $3, 'active') RETURNING id, slug",
          [m.name, slug.replace(/:/g, ' ').toUpperCase(), slug]
        );
        permMap[slug] = res.rows[0].id;
      }
    }

    // 3. SEED ROLES
    console.log("-> Seeding roles matrix...");
    const roles = [
      { name: 'ULTIMATE ADMIN', slug: 'admin', desc: 'System-wide bypass access.' },
      { name: 'SHOP OWNER', slug: 'shop_owner', desc: 'Full workshop management powers.' },
      { name: 'SERVICE WORKER', slug: 'worker', desc: 'Daily operational access.' }
    ];

    const roleMap = {};
    for (const r of roles) {
      const res = await db.query(
        "INSERT INTO roles (name, slug, description, status) VALUES ($1, $2, $3, 'active') RETURNING id, slug",
        [r.name, r.slug, r.desc]
      );
      roleMap[r.slug] = res.rows[0].id;
    }

    // 4. MAPPING (ID-BASED)
    console.log("-> Mapping role permissions...");
    // Owners get most things
    const ownerSlugs = Object.keys(permMap); // Grant all to owner for this fresh seed
    for (const slug of ownerSlugs) {
      await db.query("INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)", [roleMap['shop_owner'], permMap[slug]]);
    }
    // Admin gets explicit list too (even if code bypasses)
    for (const slug of ownerSlugs) {
       await db.query("INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)", [roleMap['admin'], permMap[slug]]);
    }
    // Workers get specific slugs
    const workerSlugs = ['view:customers', 'create:customers', 'view:repairs', 'create:repair', 'view:vehicles', 'create:vehicle'];
    for (const slug of workerSlugs) {
      if (permMap[slug]) {
        await db.query("INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)", [roleMap['worker'], permMap[slug]]);
      }
    }

    // 5. BOOTSTRAP INITIAL SHOP & ADMIN USER
    console.log("-> Bootstrapping Master Admin Account...");
    const shopRes = await db.query(
       "INSERT INTO shops (name, location, owner_name) VALUES ($1, $2, $3) RETURNING id",
       ['WORKSHOP OS HQ', 'CENTRAL STATION', 'SUPER ADMIN']
    );
    const shopId = shopRes.rows[0].id;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    await db.query(
      "INSERT INTO users (shop_id, name, phone, password_hash, role, role_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [shopId, 'MASTER ADMIN', '1234567890', passwordHash, 'admin', roleMap['admin'], 'active']
    );

    await db.query('COMMIT');
    console.log("✅ MASTER RESET SUCCESSFUL.");
    console.log("\n==================================");
    console.log("LOGIN CREDENTIALS:");
    console.log("Phone:    1234567890");
    console.log("Password: admin123");
    console.log("==================================\n");

    process.exit(0);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error("❌ Master reset failed:", err);
    process.exit(1);
  }
}

masterReset();
