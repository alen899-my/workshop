require('dotenv').config();
const db = require('./src/config/db');

async function fixNumericColumns() {
  try {
    const res = await db.query(`
      SELECT table_name, column_name, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE data_type = 'numeric' AND table_schema = 'public';
    `);
    
    console.log("Current Numeric Columns:");
    console.table(res.rows);

    // Filter to only those with precision <= 10
    const toUpdate = res.rows.filter(r => r.numeric_precision <= 12);
    
    for (const col of toUpdate) {
      console.log(`Altering ${col.table_name}.${col.column_name} to NUMERIC(20, 2)...`);
      try {
        await db.query(`ALTER TABLE "${col.table_name}" ALTER COLUMN "${col.column_name}" TYPE NUMERIC(30, 2);`);
        console.log(`Success!`);
      } catch (err) {
        console.error(`Failed to alter ${col.table_name}.${col.column_name}:`, err.message);
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error("Execution error:", err);
    process.exit(1);
  }
}

fixNumericColumns();
