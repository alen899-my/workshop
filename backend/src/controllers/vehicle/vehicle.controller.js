const db = require('../../config/db');
const { getFileUrl, deleteFromR2 } = require('../../middleware/upload');

// @desc    Get all vehicles (scoped by shop, deduped per shop)
exports.getVehicles = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';

  try {
    if (!isSuperAdmin && !shopId) {
      return res.status(403).json({ success: false, error: 'No shop assigned' });
    }

    const { status } = req.query;
    const statusFilter = status === 'Inactive' ? 'v.deleted_at IS NOT NULL' : 'v.deleted_at IS NULL';

    // Shop users: dedup by number within their shop (latest entry wins)
    // Super admin: show all across shops (same number may exist in diff shops)
    const select = `
      SELECT v.*, c.name as owner_name, c.phone as owner_phone, s.name as shop_name
      FROM vehicles v
      LEFT JOIN customers c ON v.customer_id = c.id
      LEFT JOIN shops s ON v.shop_id = s.id
      WHERE ${statusFilter}
    `;

    if (isSuperAdmin) {
      const result = await db.query(select + ` ORDER BY v.created_at DESC`);
      return res.status(200).json({ success: true, data: result.rows });
    }

    const result = await db.query(
      `SELECT DISTINCT ON (v.vehicle_number) v.*, c.name as owner_name, c.phone as owner_phone, s.name as shop_name
       FROM vehicles v
       LEFT JOIN customers c ON v.customer_id = c.id
       LEFT JOIN shops s ON v.shop_id = s.id
       WHERE ${statusFilter} AND v.shop_id = $1
       ORDER BY v.vehicle_number, v.created_at DESC`,
      [shopId]
    );
    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getVehicles Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get single vehicle with repair history
exports.getVehicleById = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';

  try {
    const select = `
      SELECT v.*, c.name as owner_name, c.phone as owner_phone, s.name as shop_name
      FROM vehicles v
      LEFT JOIN customers c ON v.customer_id = c.id
      LEFT JOIN shops s ON v.shop_id = s.id
      WHERE v.id = $1 AND v.deleted_at IS NULL
    `;
    const result = await db.query(select, [req.params.id]);

    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Vehicle not found' });

    const vehicle = result.rows[0];
    if (!isSuperAdmin && vehicle.shop_id !== shopId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Fetch repairs
    const repairs = await db.query('SELECT id, repair_date, complaints, status, vehicle_id FROM repairs WHERE vehicle_id = $1 ORDER BY repair_date DESC', [vehicle.id]);
    vehicle.repairs = repairs.rows;

    res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    console.error('getVehicleById Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Create/Sync vehicle (called when adding vehicle or repair)
exports.createVehicle = async (req, res) => {
  const { shopId } = req.user;
  const { customer_id, vehicle_number, model_name, vehicle_type, shop_id } = req.body;
  const targetShopId = req.user.role === 'super-admin' ? shop_id : shopId;
  let vehicle_image = null;

  try {
    if (!vehicle_number || !vehicle_number.trim()) {
      return res.status(400).json({ success: false, error: 'Vehicle number is required' });
    }

    // Prevent duplicate vehicle number in the same shop
    const dupCheck = await db.query(
      'SELECT id FROM vehicles WHERE vehicle_number = $1 AND shop_id = $2 AND deleted_at IS NULL',
      [vehicle_number.trim(), targetShopId]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Vehicle "${vehicle_number}" already exists in this shop`
      });
    }

    if (req.file) {
      vehicle_image = getFileUrl(req.file);
    }

    const result = await db.query(
      `INSERT INTO vehicles (customer_id, shop_id, vehicle_number, model_name, vehicle_type, vehicle_image, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [customer_id || null, targetShopId, vehicle_number.trim(), model_name || null, vehicle_type || null, vehicle_image, req.body.status || 'Active']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('createVehicle Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Update vehicle
exports.updateVehicle = async (req, res) => {
  const { shopId } = req.user;
  const { customer_id, model_name, vehicle_type, vehicle_number } = req.body;
  try {
    const existing = await db.query('SELECT vehicle_image, shop_id, vehicle_number FROM vehicles WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ success: false, error: 'Vehicle not found' });

    const targetShopId = existing.rows[0].shop_id;

    // If changing the vehicle number, check for duplicates in the same shop
    if (vehicle_number && vehicle_number.trim() !== existing.rows[0].vehicle_number) {
      const dupCheck = await db.query(
        'SELECT id FROM vehicles WHERE vehicle_number = $1 AND shop_id = $2 AND id != $3 AND deleted_at IS NULL',
        [vehicle_number.trim(), targetShopId, req.params.id]
      );
      if (dupCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: `Vehicle "${vehicle_number}" already exists in this shop`
        });
      }
    }

    let vehicle_image = existing.rows[0].vehicle_image;

    if (req.file) {
      if (vehicle_image) await deleteFromR2(vehicle_image);
      vehicle_image = getFileUrl(req.file);
    }

    const result = await db.query(
      `UPDATE vehicles SET 
        customer_id = COALESCE($1, customer_id),
        model_name = COALESCE($2, model_name),
        vehicle_type = COALESCE($3, vehicle_type),
        vehicle_image = COALESCE($4, vehicle_image),
        status = COALESCE($5, status),
        vehicle_number = COALESCE($6, vehicle_number),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 
      RETURNING *`,
      [customer_id, model_name, vehicle_type, vehicle_image, req.body.status, vehicle_number?.trim(), req.params.id]
    );
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('updateVehicle Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get vehicle by its registration number (scoped)
exports.getVehicleByNumber = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';
  const { vNumber } = req.params;

  try {
    const baseQuery = `
      SELECT v.*, c.name as owner_name, c.phone as owner_phone, s.name as shop_name
      FROM vehicles v
      LEFT JOIN customers c ON v.customer_id = c.id
      LEFT JOIN shops s ON v.shop_id = s.id
      WHERE REPLACE(v.vehicle_number, ' ', '') = REPLACE($1, ' ', '')
      AND v.deleted_at IS NULL
    `;

    let query, params;
    if (isSuperAdmin) {
      query = baseQuery + ` ORDER BY v.created_at DESC LIMIT 1`;
      params = [vNumber];
    } else {
      query = baseQuery + ` AND v.shop_id = $2 ORDER BY v.created_at DESC LIMIT 1`;
      params = [vNumber, shopId];
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(200).json({ success: true, data: null, message: 'No history for this vehicle' });
    }

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('getVehicleByNumber Error:', error);
    res.status(500).json({ success: false, error: 'Server error check history' });
  }
};

// @desc    Soft Delete vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    await db.query(`UPDATE vehicles SET deleted_at = NOW(), status = 'Inactive' WHERE id = $1`, [req.params.id]);
    res.status(200).json({ success: true, message: 'Vehicle record archived (Inactive)' });
  } catch (error) {
    console.error('deleteVehicle Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
