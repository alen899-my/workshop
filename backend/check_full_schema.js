require('dotenv').config();
const db = require('./src/config/db');

(async () => {
  try {
    const res = await db.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);
    
    const schema = {};
    res.rows.forEach(r => {
      if (!schema[r.table_name]) schema[r.table_name] = [];
      schema[r.table_name].push(r.column_name);
    });
    
    console.log(JSON.stringify(schema, null, 2));
    process.exit(0);
  } catch(e) { 
    console.error(e);
    process.exit(1);
  }
})();
