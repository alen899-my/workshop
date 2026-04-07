const db = require('../../config/db');
const bcrypt = require('bcryptjs');
const { uploadToR2, deleteFromR2 } = require('../../middleware/upload');

// Allowed roles a shop_owner can assign to members of their shop
const OWNER_ASSIGNABLE_ROLES = ['worker', 'shop_owner'];

// @desc    Get users — SUPERADMIN sees all, shop_owner sees own shop only
exports.getUsers = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';

  try {
    const select = `
      SELECT 
        u.id, u.name, u.phone, u.email, u.role, u.profile_image,
        r.name AS role_name, 
        u.status, u.created_at,
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
      // SUPERADMIN: see everyone across all shops (unfiltered by shop unless explicit)
      const result = await db.query(select + from + ` WHERE ${statusFilter} ORDER BY u.created_at DESC`);
      return res.status(200).json({ success: true, data: result.rows });
    } else {
      // shop_owner / worker: scoped to their shop only
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

// @desc    Get single user (scoped)
exports.getUserById = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.phone, u.email, u.role, u.profile_image, r.name AS role_name, u.status, u.created_at, u.shop_id,
              s.name AS shop_name, s.location AS shop_location
        FROM users u 
        LEFT JOIN roles r ON u.role = r.slug 
        LEFT JOIN shops s ON u.shop_id = s.id
        WHERE u.id = $1 AND u.deleted_at IS NULL`,
       [req.params.id]
     );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });

    const user = result.rows[0];

    // Scope check: bypass for super-admins OR referencing self
    if (!isSuperAdmin && user.id !== req.user.id && user.shop_id !== shopId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Fetch past repairs for this user (if technician)
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

// @desc    Create user — shop_owner can add worker/shop_owner to their own shop only
exports.createUser = async (req, res) => {
  const { role: requesterRole, shopId: requesterShopId } = req.user;
  const isSuperAdmin = requesterRole === 'super-admin';

  let { name, phone, email, password, role, status, shop_id } = req.body;

  // Scope enforcement: shop_owner can only create users in their own shop
  if (!isSuperAdmin) {
    shop_id = requesterShopId; // Override whatever was sent — lock to their shop

    // shop_owner can only assign worker or shop_owner roles
    if (!OWNER_ASSIGNABLE_ROLES.includes(role)) {
      return res.status(403).json({ 
        success: false, 
        error: `You can only assign roles: ${OWNER_ASSIGNABLE_ROLES.join(', ')}` 
      });
    }
  }

  try {
    // Validation
    const userCheck = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (userCheck.rows.length > 0) return res.status(400).json({ success: false, error: 'Phone already registered' });

    if (!password) return res.status(400).json({ success: false, error: 'Password is required' });
    if (!shop_id) return res.status(400).json({ success: false, error: 'Shop assignment required' });

    // Resolve Role ID from slug
    const assignedRole = role || 'worker';
    const roleR = await db.query('SELECT id FROM roles WHERE slug = $1', [assignedRole]);
    const roleId = roleR.rows.length > 0 ? roleR.rows[0].id : null;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await db.query(
      'INSERT INTO users (shop_id, name, phone, email, password_hash, role, role_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, phone, email, role, status',
      [shop_id, name, phone, email, passwordHash, assignedRole, roleId, status || 'active']
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('createUser Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Update user — scoped by shop
exports.updateUser = async (req, res) => {
  const { role: requesterRole, shopId: requesterShopId } = req.user;
  const isSuperAdmin = requesterRole === 'super-admin';

  const { name, phone, email, role, status, password, shop_id, profile_image } = req.body;
  try {
    // Fetch user first to check shop scope
    const existing = await db.query('SELECT id, shop_id, profile_image FROM users WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });

    if (!isSuperAdmin && existing.rows[0].id !== req.user.id && existing.rows[0].shop_id !== requesterShopId) {
      return res.status(403).json({ success: false, error: 'Access denied — outside your shop scope' });
    }

    // shop_owner cannot escalate roles beyond their allowed set
    if (!isSuperAdmin && role && !OWNER_ASSIGNABLE_ROLES.includes(role)) {
      return res.status(403).json({ success: false, error: `Cannot assign role: ${role}` });
    }

    // Resolve new role_id if role is being changed
    let roleId = null;
    if (role) {
      const roleR = await db.query('SELECT id FROM roles WHERE slug = $1', [role]);
      roleId = roleR.rows.length > 0 ? roleR.rows[0].id : null;
    }

    // Password Update Logic (Optional)
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
    
    // Shop Override Logic (SuperAdmin only)
    let shopFragment = '';
    if (isSuperAdmin && shop_id) {
       shopFragment = ', shop_id = $' + (params.length + 1);
       params.push(shop_id);
    }

    let finalProfileImage = existing.rows[0].profile_image;
    if (req.file) {
      if (finalProfileImage) await deleteFromR2(finalProfileImage);
      finalProfileImage = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype);
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
          status = COALESCE($6, status) ${passwordFragment} ${shopFragment} ${imageFragment}
      WHERE id = ${userIdPlaceholder} 
      RETURNING id, name, phone, email, role, status, shop_id, profile_image
    `;

    const result = await db.query(query, params);

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('updateUser Error:', error);
    res.status(500).json({ success: false, error: 'Server error during update' });
  }
};

// @desc    Soft Delete user — scoped by shop
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
