/**
 * One-time migration: fix duplicate calling-code prefixes in users.phone
 *
 * Corrupted format: "+91+919876543210"  (calling code prepended twice)
 * Fixed format:     "+919876543210"
 *
 * Run once:  node scripts/fix-phone-duplicates.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/config/db');

function normalizePhone(raw) {
  if (!raw) return raw;
  const str = String(raw).trim();
  const multiPrefix = /^(\+\d{1,4})+(?=\d{6,})/;
  const match = str.match(multiPrefix);
  if (match) {
    const lastPlus = str.lastIndexOf('+');
    if (lastPlus > 0) {
      return str.slice(lastPlus);
    }
  }
  if (!str.startsWith('+')) return '+' + str;
  return str;
}

async function run() {
  console.log('Scanning users table for duplicate calling-code prefixes...\n');

  const result = await db.query('SELECT id, phone FROM users ORDER BY id');
  let fixed = 0;
  let skipped = 0;
  const conflicts = [];

  for (const row of result.rows) {
    const normalized = normalizePhone(row.phone);
    if (normalized !== row.phone) {
      // Check if a user already exists with this normalized phone
      const existing = await db.query('SELECT id FROM users WHERE phone = $1', [normalized]);
      if (existing.rows.length > 0) {
        console.log(`  [CONFLICT] user id=${row.id}: "${row.phone}" -> "${normalized}" already owned by user id=${existing.rows[0].id}`);
        conflicts.push({ id: row.id, phone: row.phone, normalized, conflictsWith: existing.rows[0].id });
      } else {
        console.log(`  [FIX] user id=${row.id}: "${row.phone}" -> "${normalized}"`);
        await db.query('UPDATE users SET phone = $1 WHERE id = $2', [normalized, row.id]);
        fixed++;
      }
    } else {
      skipped++;
    }
  }

  console.log(`\nDone. Fixed: ${fixed}, Already clean: ${skipped}, Conflicts: ${conflicts.length}`);
  if (conflicts.length > 0) {
    console.log('\n  Conflicts need manual resolution (duplicate accounts for same phone):');
    conflicts.forEach(c => {
      console.log(`  - user id=${c.id} (raw="${c.phone}") conflicts with user id=${c.conflictsWith} (normalized="${c.normalized}")`);
    });
    console.log('\nTo delete the stale duplicate (keep the clean/newer record), run SQL like:');
    conflicts.forEach(c => {
      console.log(`  DELETE FROM users WHERE id = ${c.id}; -- duplicate of id=${c.conflictsWith}`);
    });
  }
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
