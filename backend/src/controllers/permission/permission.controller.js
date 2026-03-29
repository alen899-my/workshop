const db = require('../../config/db');

// @desc    Get all permissions
exports.getPermissions = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM permissions ORDER BY module_name ASC, created_at DESC');
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get single permission
exports.getPermissionById = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM permissions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Permission not found' });
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Create new permission(s)
exports.createPermission = async (req, res) => {
  const { module_name, items } = req.body; // items: Array of { permission_name, slug, description, status }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'Permissions data missing' });
  }

  try {
    await db.query('BEGIN');
    const created = [];

    for (const item of items) {
      const result = await db.query(
        'INSERT INTO permissions (module_name, permission_name, slug, description, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [module_name, item.permission_name, item.slug, item.description, item.status || 'active']
      );
      created.push(result.rows[0]);
    }

    await db.query('COMMIT');
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    await db.query('ROLLBACK');
    if (error.code === '23505') return res.status(400).json({ success: false, error: 'One or more slugs already exist' });
    res.status(500).json({ success: false, error: 'Server error during creation' });
  }
};

// @desc    Update permission
exports.updatePermission = async (req, res) => {
  const { module_name, permission_name, slug, description, status } = req.body;
  try {
    const result = await db.query(
      'UPDATE permissions SET module_name=$1, permission_name=$2, slug=$3, description=$4, status=$5, updated_at=NOW() WHERE id=$6 RETURNING *',
      [module_name, permission_name, slug, description, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Permission not found' });
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Delete permission
exports.deletePermission = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM permissions WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Permission not found' });
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get permissions for a specific role
exports.getRolePermissions = async (req, res) => {
  const { role } = req.params;
  try {
     const result = await db.query(`
        SELECT p.slug 
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        JOIN roles r ON rp.role_id = r.id
        WHERE r.slug = $1
      `, [role]);
    res.status(200).json({ 
      success: true, 
      data: result.rows.map(r => r.slug) 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
