const db = require('../../config/db');

// @desc    Get all roles
exports.getRoles = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM roles ORDER BY name ASC');
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get role options (minimal data for forms)
exports.getRoleOptions = async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, slug FROM roles WHERE status = $1 ORDER BY name ASC', ['active']);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get single role with its permissions (slugs)
exports.getRoleById = async (req, res) => {
  try {
    const roleR = await db.query('SELECT * FROM roles WHERE id = $1', [req.params.id]);
    if (roleR.rows.length === 0) return res.status(404).json({ success: false, error: 'Role not found' });
    
    const role = roleR.rows[0];
    const permR = await db.query(`
      SELECT p.slug 
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = $1
    `, [role.id]);
    
    res.status(200).json({ 
      success: true, 
      data: { ...role, permissions: permR.rows.map(p => p.slug) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Create new role + assign permissions by slug
exports.createRole = async (req, res) => {
  const { name, slug, description, status, permissions } = req.body;
  try {
    await db.query('BEGIN');
    
    // 1. Create role
    const roleR = await db.query(
      'INSERT INTO roles (name, slug, description, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, slug, description, status || 'active']
    );
    const roleId = roleR.rows[0].id;

    // 2. Assign permissions
    if (permissions && Array.isArray(permissions)) {
      for (const pSlug of permissions) {
        // Find permission ID by slug
        const pR = await db.query('SELECT id FROM permissions WHERE slug = $1', [pSlug]);
        if (pR.rows.length > 0) {
          await db.query(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
            [roleId, pR.rows[0].id]
          );
        }
      }
    }
    
    await db.query('COMMIT');
    res.status(201).json({ success: true, data: roleR.rows[0] });
  } catch (error) {
    await db.query('ROLLBACK');
    if (error.code === '23505') return res.status(400).json({ success: false, error: 'Role slug must be unique' });
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Update role + sync permissions
exports.updateRole = async (req, res) => {
  const { name, slug, description, status, permissions } = req.body;
  const roleId = req.params.id;
  try {
    await db.query('BEGIN');
    
    // 1. Update role
    const roleR = await db.query(
      'UPDATE roles SET name=$1, slug=$2, description=$3, status=$4, updated_at=NOW() WHERE id=$5 RETURNING *',
      [name, slug, description, status, roleId]
    );
    if (roleR.rows.length === 0) {
       await db.query('ROLLBACK');
       return res.status(404).json({ success: false, error: 'Role not found' });
    }

    // 2. Sync permissions (DELETE old, INSERT new)
    await db.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
    if (permissions && Array.isArray(permissions)) {
      for (const pSlug of permissions) {
        const pR = await db.query('SELECT id FROM permissions WHERE slug = $1', [pSlug]);
        if (pR.rows.length > 0) {
          await db.query(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
            [roleId, pR.rows[0].id]
          );
        }
      }
    }

    await db.query('COMMIT');
    res.status(200).json({ success: true, data: roleR.rows[0] });
  } catch (error) {
    await db.query('ROLLBACK');
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Delete role
exports.deleteRole = async (req, res) => {
  try {
    await db.query('DELETE FROM roles WHERE id = $1', [req.params.id]);
    res.status(200).json({ success: true, message: 'Role and mappings deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
