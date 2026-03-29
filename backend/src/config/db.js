const { Pool } = require('pg');

// Initialize the PostgreSQL connection pool strictly mapped to Neon's connection string requirements
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Centralized query export for database interaction
module.exports = {
  query: (text, params, callback) => pool.query(text, params, callback),
  pool,
};
