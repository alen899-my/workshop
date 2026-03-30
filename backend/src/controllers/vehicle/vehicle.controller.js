const db = require('../../config/db');

// @desc    Get all vehicles (scoped by shop)
exports.getVehicles = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';

  try {
    const select = `
      SELECT v.*, c.name as owner_name, c.phone as owner_phone, s.name as shop_name
      FROM vehicles v
      LEFT JOIN customers c ON v.customer_id = c.id
      LEFT JOIN shops s ON v.shop_id = s.id
    `;

    if (isSuperAdmin) {
      const result = await db.query(select + ' ORDER BY v.created_at DESC');
      return res.status(200).json({ success: true, data: result.rows });
    } else {
      if (!shopId) return res.status(403).json({ success: false, error: 'No shop assigned' });
      const result = await db.query(
        select + ' WHERE v.shop_id = $1 ORDER BY v.created_at DESC',
        [shopId]
      );
      return res.status(200).json({ success: true, data: result.rows });
    }
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
      WHERE v.id = $1
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
  const { customer_id, vehicle_number, model_name, vehicle_type, vehicle_image, shop_id } = req.body;
  const targetShopId = req.user.role === 'super-admin' ? shop_id : shopId;

  try {
    const result = await db.query(
      `INSERT INTO vehicles (customer_id, shop_id, vehicle_number, model_name, vehicle_type, vehicle_image) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [customer_id, targetShopId, vehicle_number, model_name, vehicle_type, vehicle_image]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('createVehicle Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Update vehicle
exports.updateVehicle = async (req, res) => {
  const { customer_id, model_name, vehicle_type, vehicle_image } = req.body;
  try {
    const result = await db.query(
      `UPDATE vehicles SET 
        customer_id = COALESCE($1, customer_id),
        model_name = COALESCE($2, model_name),
        vehicle_type = COALESCE($3, vehicle_type),
        vehicle_image = COALESCE($4, vehicle_image),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 
      RETURNING *`,
      [customer_id, model_name, vehicle_type, vehicle_image, req.params.id]
    );
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('updateVehicle Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Delete vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    await db.query('DELETE FROM vehicles WHERE id = $1', [req.params.id]);
    res.status(200).json({ success: true, message: 'Vehicle deleted' });
  } catch (error) {
    console.error('deleteVehicle Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
