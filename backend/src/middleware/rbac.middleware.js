const db = require('../config/db');

/**
 * RBAC Middleware: Guard routes based on permission slugs
 * @param {string} permissionSlug - The slug to check (e.g. 'inventory:delete')
 */
const authorize = (permissionSlug) => {
  return async (req, res, next) => {
    try {
      // 1. Authenticated check (Ensuring user object exists from prior auth middleware)
      if (!req.user) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      // 3. Permission Slug Check: Join role_permissions with permissions table to verify the slug
      const query = `
        SELECT 1 
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        JOIN users u ON u.role_id = rp.role_id
        WHERE u.id = $1 AND p.slug = $2
      `;
      const result = await db.query(query, [req.user.id, permissionSlug]);

      if (result.rows.length > 0) {
        return next(); // Access granted
      }

      // 4. Access Denied
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

module.exports = { authorize };
