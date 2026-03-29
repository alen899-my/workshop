require('dotenv').config();
const db = require('../src/config/db');

async function check() {
  const users = await db.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position"
  );
  const shops = await db.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='shops' ORDER BY ordinal_position"
  );
  const fs = require('fs');
  const out = {
    users: users.rows.map(r => r.column_name),
    shops: shops.rows.map(r => r.column_name)
  };
  fs.writeFileSync('./scripts/schema_out.json', JSON.stringify(out, null, 2));
  console.log('Written to scripts/schema_out.json');
  process.exit(0);
}
check().catch(e => { console.error(e.message); process.exit(1); });
