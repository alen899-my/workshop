const { Pool } = require('pg');
require('dotenv').config({path: 'backend/.env'});
const pool = new Pool({connectionString: process.env.DATABASE_URL});
async function run() {
  const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'repairs'");
  console.log(res.rows.map(x => x.column_name));
  await pool.end();
}
run();
