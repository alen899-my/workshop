const db = require('../../config/db');
const bcrypt = require('bcryptjs');
const { getFileUrl, deleteFromR2 } = require('../../middleware/upload');

const OWNER_ASSIGNABLE_ROLES = ['worker', 'shop_owner'];

/**
 * Get the requester's effective permissions (role ∪ additional ∖ excluded)
 * Used to validate that they can assign/exclude permissions to other users.
 */
async function getRequesterPermissions(userId) {
  const rolePerms = await db.query(`
    SELECT p.slug
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    JOIN users u ON u.role_id = rp.role_id
    WHERE u.id = $1 AND p.deleted_at IS NULL
  `, [userId]);

  const userData = await db.query(
    'SELECT additional_permissions, excluded_permissions FROM users WHERE id = $1',
    [userId]
  );

  const roleSlugs = rolePerms.rows.map(r => r.slug);
  const additional = userData.rows[0]?.additional_permissions || [];
  const excluded = userData.rows[0]?.excluded_permissions || [];

  const effective = new Set([...roleSlugs, ...additional]);
  for (const slug of excluded) effective.delete(slug);

  return Array.from(effective);
}

/**
 * Validate that the requester has each permission in the given arrays.
 * Returns an error message or null.
 */
async function validatePermissionOverrides(requesterId, additionalPerms, excludedPerms, isSuperAdmin) {
  if (isSuperAdmin) return null; // super-admin can assign anything

  const requesterPerms = await getRequesterPermissions(requesterId);

  for (const slug of additionalPerms || []) {
    if (!requesterPerms.includes(slug)) {
      return `You cannot assign permission "${slug}" — you do not have it`;
    }
  }

  for (const slug of excludedPerms || []) {
    if (!requesterPerms.includes(slug)) {
      return `You cannot exclude permission "${slug}" — you do not have it`;
    }
  }

  return null;
}

exports.getUsers = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';

  try {
    const select = `
      SELECT 
        u.id, u.name, u.phone, u.email, u.role, u.profile_image,
        r.name AS role_name, 
        u.status, u.created_at,
        u.additional_permissions, u.excluded_permissions,
        s.name AS shop_name,
        s.location AS shop_location,
        s.owner_name AS shop_owner_name
    `;
    const from = `
      FROM users u 
      LEFT JOIN roles r ON u.role = r.slug 
      LEFT JOIN shops s ON u.shop_id = s.id
    `;

    const { status, shopId: queryShopId } = req.query;
    const statusFilter = status === 'Inactive' ? 'u.deleted_at IS NOT NULL' : 'u.deleted_at IS NULL';

    if (isSuperAdmin && !queryShopId) {
      const result = await db.query(select + from + ` WHERE ${statusFilter} ORDER BY u.created_at DESC`);
      return res.status(200).json({ success: true, data: result.rows });
    } else {
      const targetShopId = isSuperAdmin ? queryShopId : shopId;
      if (!targetShopId) return res.status(403).json({ success: false, error: 'No shop context' });
      const result = await db.query(
        select + from + ` WHERE u.shop_id = $1 AND ${statusFilter} ORDER BY u.created_at DESC`,
        [targetShopId]
      );
      return res.status(200).json({ success: true, data: result.rows });
    }
  } catch (error) {
    console.error('getUsers Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.getUserById = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.phone, u.email, u.role, u.profile_image,
              r.name AS role_name, u.status, u.created_at, u.shop_id,
              u.additional_permissions, u.excluded_permissions,
              s.name AS shop_name, s.location AS shop_location
        FROM users u 
        LEFT JOIN roles r ON u.role = r.slug 
        LEFT JOIN shops s ON u.shop_id = s.id
        WHERE u.id = $1 AND u.deleted_at IS NULL`,
       [req.params.id]
     );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });

    const user = result.rows[0];

    if (!isSuperAdmin && user.id !== req.user.id && user.shop_id !== shopId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const repairs = await db.query(`
      SELECT r.*, v.model_name as vehicle_model 
      FROM repairs r 
      JOIN vehicles v ON r.vehicle_id = v.id
      WHERE r.attending_worker_id = $1 
      ORDER BY r.repair_date DESC 
      LIMIT 10
    `, [user.id]);
    
    user.past_repairs = repairs.rows;

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('getUserById Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.createUser = async (req, res) => {
  const { role: requesterRole, shopId: requesterShopId, id: requesterId } = req.user;
  const isSuperAdmin = requesterRole === 'super-admin';

  let { name, phone, email, password, role, status, shop_id, additional_permissions, excluded_permissions } = req.body;

  if (!isSuperAdmin) {
    shop_id = requesterShopId;
    if (!OWNER_ASSIGNABLE_ROLES.includes(role)) {
      return res.status(403).json({ 
        success: false, 
        error: `You can only assign roles: ${OWNER_ASSIGNABLE_ROLES.join(', ')}` 
      });
    }
  }

  // Validate permission overrides
  const permError = await validatePermissionOverrides(requesterId, additional_permissions, excluded_permissions, isSuperAdmin);
  if (permError) return res.status(403).json({ success: false, error: permError });

  try {
    const userCheck = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (userCheck.rows.length > 0) return res.status(400).json({ success: false, error: 'Phone already registered' });

    if (!password) return res.status(400).json({ success: false, error: 'Password is required' });
    if (!shop_id) return res.status(400).json({ success: false, error: 'Shop assignment required' });

    const assignedRole = role || 'worker';
    const roleR = await db.query('SELECT id FROM roles WHERE slug = $1', [assignedRole]);
    const roleId = roleR.rows.length > 0 ? roleR.rows[0].id : null;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await db.query(
      `INSERT INTO users (shop_id, name, phone, email, password_hash, role, role_id, status, additional_permissions, excluded_permissions) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING id, name, phone, email, role, status, additional_permissions, excluded_permissions`,
      [shop_id, name, phone, email, passwordHash, assignedRole, roleId, status || 'active', additional_permissions || [], excluded_permissions || []]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('createUser Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  const { role: requesterRole, shopId: requesterShopId, id: requesterId } = req.user;
  const isSuperAdmin = requesterRole === 'super-admin';

  const { name, phone, email, role, status, password, shop_id, profile_image, additional_permissions, excluded_permissions } = req.body;
  try {
    const existing = await db.query('SELECT id, shop_id, profile_image FROM users WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });

    if (!isSuperAdmin && existing.rows[0].id !== req.user.id && existing.rows[0].shop_id !== requesterShopId) {
      return res.status(403).json({ success: false, error: 'Access denied — outside your shop scope' });
    }

    if (!isSuperAdmin && role && !OWNER_ASSIGNABLE_ROLES.includes(role)) {
      return res.status(403).json({ success: false, error: `Cannot assign role: ${role}` });
    }

    // Validate permission overrides
    if (additional_permissions !== undefined || excluded_permissions !== undefined) {
      const permError = await validatePermissionOverrides(
        requesterId, 
        additional_permissions || [], 
        excluded_permissions || [], 
        isSuperAdmin
      );
      if (permError) return res.status(403).json({ success: false, error: permError });
    }

    let roleId = null;
    if (role) {
      const roleR = await db.query('SELECT id FROM roles WHERE slug = $1', [role]);
      roleId = roleR.rows.length > 0 ? roleR.rows[0].id : null;
    }

    let passwordFragment = '';
    const params = [
      name ?? null, 
      phone ?? null, 
      email ?? null, 
      role ?? null, 
      roleId ?? null, 
      status ?? null
    ];

    if (password && password.length > 0) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      passwordFragment = ', password_hash = $' + (params.length + 1);
      params.push(passwordHash);
    }
    
    let shopFragment = '';
    if (isSuperAdmin && shop_id) {
       shopFragment = ', shop_id = $' + (params.length + 1);
       params.push(shop_id);
    }

    // Permission override arrays
    let additionalFragment = '';
    let excludedFragment = '';
    if (additional_permissions !== undefined) {
      additionalFragment = ', additional_permissions = $' + (params.length + 1);
      params.push(additional_permissions);
    }
    if (excluded_permissions !== undefined) {
      excludedFragment = ', excluded_permissions = $' + (params.length + 1);
      params.push(excluded_permissions);
    }

    let finalProfileImage = existing.rows[0].profile_image;
    if (req.file) {
      if (finalProfileImage) await deleteFromR2(finalProfileImage);
      finalProfileImage = getFileUrl(req.file);
    } else if (profile_image === "") {
      if (finalProfileImage) await deleteFromR2(finalProfileImage);
      finalProfileImage = null;
    }

    let imageFragment = '';
    if (finalProfileImage !== undefined) {
      imageFragment = ', profile_image = $' + (params.length + 1);
      params.push(finalProfileImage);
    }

    params.push(req.params.id);
    const userIdPlaceholder = '$' + params.length;

    const query = `
      UPDATE users 
      SET name = COALESCE($1, name), 
          phone = COALESCE($2, phone), 
          email = COALESCE($3, email), 
          role = COALESCE($4, role), 
          role_id = COALESCE($5, role_id), 
          status = COALESCE($6, status) ${passwordFragment} ${shopFragment} ${additionalFragment} ${excludedFragment} ${imageFragment}
      WHERE id = ${userIdPlaceholder} 
      RETURNING id, name, phone, email, role, status, shop_id, profile_image, additional_permissions, excluded_permissions
    `;

    const result = await db.query(query, params);

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('updateUser Error:', error);
    res.status(500).json({ success: false, error: 'Server error during update' });
  }
};

// @desc    Check if phone is already registered (used for form validation)
exports.checkPhone = async (req, res) => {
  const { phone } = req.params;
  const excludeId = req.query.excludeId;
  try {
    let query = 'SELECT id FROM users WHERE phone = $1 AND deleted_at IS NULL';
    const params = [phone];
    if (excludeId) {
      query += ' AND id != $2';
      params.push(excludeId);
    }
    const result = await db.query(query, params);
    res.status(200).json({ success: true, exists: result.rows.length > 0 });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  const { role: requesterRole, shopId: requesterShopId } = req.user;
  const isSuperAdmin = requesterRole === 'super-admin';

  try {
    const existing = await db.query('SELECT id, shop_id FROM users WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });

    if (!isSuperAdmin && existing.rows[0].shop_id !== requesterShopId) {
      return res.status(403).json({ success: false, error: 'Access denied — outside your shop scope' });
    }

    await db.query(`UPDATE users SET deleted_at = NOW(), status = 'Inactive' WHERE id = $1`, [req.params.id]);
    res.status(200).json({ success: true, message: 'User record archived (Inactive)' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
