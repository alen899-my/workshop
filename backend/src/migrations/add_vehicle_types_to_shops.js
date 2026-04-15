const db = require('../config/db');

const addVehicleTypes = async () => {
  try {
    const query = `
      ALTER TABLE shops
      ADD COLUMN IF NOT EXISTS vehicle_types JSONB DEFAULT '[]'::jsonb;
    `;
    await db.query(query);
    console.log("✅ Added vehicle_types column to shops table successfully");
  } catch (error) {
    console.error("❌ Error adding vehicle_types column:", error);
  } finally {
    process.exit();
  }
};

addVehicleTypes();
