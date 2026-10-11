// Read-only audit. Never guesses a country or merges identities.
require('dotenv').config();
const db = require('../src/config/db');
const { normalizePhone } = require('../src/utils/auth-validation');
async function main() {
  const { rows } = await db.query('SELECT id, phone, email FROM users ORDER BY id');
  const phones = new Map(), emails = new Map(), review = [];
  for (const user of rows) {
    const raw = typeof user.phone === 'string' ? user.phone.trim() : '';
    const suffix = raw.includes('+') ? raw.slice(raw.lastIndexOf('+')) : raw;
    const canonical = normalizePhone(suffix);
    if (!canonical) review.push({ userId: user.id, issue: 'Invalid or country-ambiguous phone; verify with account owner' });
    else {
      const ids = phones.get(canonical) || []; ids.push(user.id); phones.set(canonical, ids);
      if (raw !== canonical) review.push({ userId: user.id, issue: 'Noncanonical phone; confirm before migration' });
    }
    if (user.email) {
      const email = user.email.trim().toLowerCase();
      const ids = emails.get(email) || []; ids.push(user.id); emails.set(email, ids);
    }
  }
  const collisions = [...phones.values(), ...emails.values()].filter(ids => ids.length > 1);
  // Output IDs only, never phone numbers, email addresses, hashes, or tokens.
  console.log(JSON.stringify({ accounts: rows.length, review, collisionGroups: collisions }, null, 2));
  if (review.length || collisions.length) process.exitCode = 1;
}
main().catch(() => { console.error('Auth audit failed; check database configuration'); process.exitCode = 1; }).finally(() => db.pool.end());
