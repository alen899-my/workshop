const db = require('../config/db');

const addIsPublic = async () => {
  try {
    const query = `
      ALTER TABLE shops
      ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
    `;
    await db.query(query);
    console.log("✅ Added is_public column to shops table successfully");
  } catch (error) {
    console.error("❌ Error adding is_public column:", error);
  } finally {
    process.exit();
  }
};

addIsPublic();
