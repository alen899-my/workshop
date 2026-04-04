const { Pool } = require('pg');
require('dotenv').config({path: '.env'});
const pool = new Pool({connectionString: process.env.DATABASE_URL});
pool.query("ALTER TABLE repair_bills ADD COLUMN payment_status VARCHAR(20) DEFAULT 'Unpaid';")
  .then(res => console.log('ADDED payment_status'))
  .catch(err => console.error(err))
  .finally(() => pool.end());
