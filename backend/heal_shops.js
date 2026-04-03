require('dotenv').config();
const db = require('./src/config/db');

async function healShopsTable() {
  try {
    console.log("🛠️ Starting healing migration for 'shops' table...");
    
    // Add missing columns one by one with IF NOT EXISTS logic
    const columns = [
      { name: 'address', type: 'TEXT' },
      { name: 'state', type: 'VARCHAR(100)' },
      { name: 'city', type: 'VARCHAR(100)' },
      { name: 'country', type: "VARCHAR(255) DEFAULT 'India'" },
      { name: 'currency', type: "VARCHAR(20) DEFAULT 'INR'" },
      { name: 'phone', type: 'VARCHAR(20)' },
      { name: 'latitude', type: 'DECIMAL(10, 8)' },
      { name: 'longitude', type: 'DECIMAL(11, 8)' },
      { name: 'place_id', type: 'VARCHAR(255)' }
    ];

    for (const col of columns) {
      try {
        await db.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`);
        console.log(`✅ Column '${col.name}' is verified/added.`);
      } catch (err) {
        console.error(`❌ Error adding column '${col.name}':`, err.message);
      }
    }

    console.log("🏁 Migration complete! The shops table is now up-to-date.");
  } catch (err) {
    console.error("❌ Fatal migration error:", err.message);
  } finally {
    process.exit();
  }
}

healShopsTable();
