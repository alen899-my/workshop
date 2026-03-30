require('dotenv').config({ path: 'd:\\New Projects\\workshop\\backend\\.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log("Tables:", res.rows.map(r => r.table_name));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

check();
