const db = require('../config/db');

// Define table schema for Permissions module
const createPermissionTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS permissions (
      id SERIAL PRIMARY KEY,
      module_name VARCHAR(100) NOT NULL,
      permission_name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'active', -- active | inactive
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await db.query(query);
  console.log("✅ Permissions table ready");
};

// Define mapping between Roles and Permission Slugs
const createRolePermissionTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS role_permissions (
      id SERIAL PRIMARY KEY,
      role VARCHAR(50) NOT NULL, -- shop_owner | worker | admin
      permission_slug VARCHAR(100) REFERENCES permissions(slug) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(role, permission_slug)
    );
  `;
  await db.query(query);
  console.log("✅ Role-Permissions mapping table ready");
};

module.exports = {
  createPermissionTable,
  createRolePermissionTable
};
