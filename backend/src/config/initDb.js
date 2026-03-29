require('dotenv').config({ path: __dirname + '/../../.env' });
const { createShopTable } = require('../models/shop.model');
const { createUserTable } = require('../models/user.model');
const { createPermissionTable, createRolePermissionTable } = require('../models/permission.model');
const { createRoleTable } = require('../models/role.model');
const { createRepairTable } = require('../models/repair.model');

// Execute sequential creation of model tables safely
const initDatabase = async () => {
  try {
    // Note: Execution order matters heavily due to Foreign Key constraints
    await createShopTable();
    await createUserTable();
    await createPermissionTable();
    await createRoleTable();
    await createRolePermissionTable();
    await createRepairTable();
    
    console.log("🚀 All database tables successfully initialized.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error initializing database tables:", error);
    process.exit(1);
  }
};

initDatabase();
