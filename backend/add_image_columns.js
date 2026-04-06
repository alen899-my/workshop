require('dotenv').config();
const db = require('./src/config/db');

async function addColumns() {
  try {
    // Add profile_image to users table
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;`);
    console.log('✅ Added profile_image to users table');

    // Add shop_image and owner_phone to shops table
    await db.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_image TEXT;`);
    await db.query(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS owner_phone VARCHAR(50);`);
    console.log('✅ Added shop_image and owner_phone to shops table');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error adding columns:', err);
    process.exit(1);
  }
}

addColumns();
