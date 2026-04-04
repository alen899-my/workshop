const { Pool } = require('pg');
require('dotenv').config({path: '.env'});
const pool = new Pool({connectionString: process.env.DATABASE_URL});
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'repairs'")
  .then(res => console.log('COLUMNS:', res.rows.map(r => r.column_name).join(', ')))
  .catch(err => console.error(err))
  .finally(() => pool.end());
