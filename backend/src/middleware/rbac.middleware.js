const db = require('../config/db');

/**
 * Check if a user has effective permission for a given slug.
 * Effective = (role_permissions ∪ additional_permissions) ∖ excluded_permissions
 */
async function hasPermission(userId, permissionSlug) {
  const query = `
    SELECT 
      u.additional_permissions,
      u.excluded_permissions
    FROM users u
    WHERE u.id = $1
  `;
  const userResult = await db.query(query, [userId]);
  if (userResult.rows.length === 0) return false;

  const { additional_permissions, excluded_permissions } = userResult.rows[0];

  // 1. Excluded override — explicitly denied
  if (excluded_permissions && excluded_permissions.includes(permissionSlug)) {
    return false;
  }

  // 2. Additional override — explicitly granted
  if (additional_permissions && additional_permissions.includes(permissionSlug)) {
    return true;
  }

  // 3. Role-based permission check
  const roleQuery = `
    SELECT 1 
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    JOIN users u ON u.role_id = rp.role_id
    WHERE u.id = $1 AND p.slug = $2
  `;
  const roleResult = await db.query(roleQuery, [userId, permissionSlug]);
  return roleResult.rows.length > 0;
}

/**
 * RBAC Middleware: Guard routes based on permission slugs,
 * considering user-level permission overrides.
 * @param {string} permissionSlug - The slug to check (e.g. 'inventory:delete')
 */
const authorize = (permissionSlug) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const granted = await hasPermission(req.user.id, permissionSlug);
      if (granted) return next();

      return res.status(403).json({ 
        success: false, 
        error: "Forbidden: You do not have permission to perform this action" 
      });
    } catch (error) {
      console.error("RBAC Middleware Error:", error);
      res.status(500).json({ success: false, error: "Server security error" });
    }
  };
};

/**
 * RBAC Middleware: Guard routes based on permission slugs, but bypass if the user is targeting themselves.
 * Useful for profile fetching and editing.
 */
const authorizeOrSelf = (permissionSlug) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      // Bypass check: If the target ID matches the logged-in user ID
      if (req.params.id && parseInt(req.params.id) === req.user.id) {
        return next();
      }

      const granted = await hasPermission(req.user.id, permissionSlug);
      if (granted) return next();

      return res.status(403).json({ 
        success: false, 
        error: "Forbidden: You do not have permission to perform this action" 
      });
    } catch (error) {
      console.error("RBAC Middleware Error:", error);
      res.status(500).json({ success: false, error: "Server security error" });
    }
  };
};

module.exports = { authorize, authorizeOrSelf };
