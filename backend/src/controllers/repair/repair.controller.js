const db = require('../../config/db');
const { uploadToR2, deleteFromR2 } = require('../../middleware/upload');

// @desc    Get all repairs (scoped by shop)
exports.getRepairs = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';

  try {
    const select = `
      SELECT 
        r.id, r.vehicle_image, r.vehicle_number, r.owner_name, r.phone_number, 
        r.complaints, r.repair_date, r.status, r.service_type, r.created_at,
        s.name AS shop_name,
        aw.name AS attending_worker_name,
        sb.name AS submitted_by_name
    `;
    const from = `
      FROM repairs r
      LEFT JOIN shops s ON r.shop_id = s.id
      LEFT JOIN users aw ON r.attending_worker_id = aw.id
      LEFT JOIN users sb ON r.submitted_by_id = sb.id
    `;

    if (isSuperAdmin) {
      const result = await db.query(select + from + ' ORDER BY r.created_at DESC');
      return res.status(200).json({ success: true, data: result.rows });
    } else {
      if (!shopId) return res.status(403).json({ success: false, error: 'No shop assigned' });
      const result = await db.query(
        select + from + ' WHERE r.shop_id = $1 ORDER BY r.created_at DESC',
        [shopId]
      );
      return res.status(200).json({ success: true, data: result.rows });
    }
  } catch (error) {
    console.error('getRepairs Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get single repair by ID
exports.getRepairById = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';

  try {
    const select = `
      SELECT 
        r.*,
        s.name AS shop_name,
        aw.name AS attending_worker_name,
        sb.name AS submitted_by_name
      FROM repairs r
      LEFT JOIN shops s ON r.shop_id = s.id
      LEFT JOIN users aw ON r.attending_worker_id = aw.id
      LEFT JOIN users sb ON r.submitted_by_id = sb.id
      WHERE r.id = $1
    `;
    const result = await db.query(select, [req.params.id]);

    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Repair not found' });

    const repair = result.rows[0];

    // Scope check
    if (!isSuperAdmin && repair.shop_id !== shopId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.status(200).json({ success: true, data: repair });
  } catch (error) {
    console.error('getRepairById Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Create new repair
exports.createRepair = async (req, res) => {
  const { shopId, id: userId } = req.user;
  
  // Data extraction
  const { vehicle_number, owner_name, phone_number, complaints, repair_date, attending_worker_id, status, service_type } = req.body;
  let vehicle_image = null;

  try {
    if (req.file) {
      vehicle_image = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype);
    }

    const query = `
      INSERT INTO repairs 
        (shop_id, vehicle_image, vehicle_number, owner_name, phone_number, complaints, repair_date, attending_worker_id, submitted_by_id, status, service_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const params = [
      shopId, 
      vehicle_image, 
      vehicle_number, 
      owner_name, 
      phone_number, 
      complaints, 
      repair_date || new Date(), 
      attending_worker_id || null, 
      userId, 
      status || 'Pending',
      service_type || 'Repair'
    ];

    const result = await db.query(query, params);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('createRepair Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Update an existing repair
exports.updateRepair = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';
  const { vehicle_number, owner_name, phone_number, complaints, repair_date, attending_worker_id, status, service_type } = req.body;

  try {
    const existing = await db.query('SELECT shop_id, vehicle_image FROM repairs WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ success: false, error: 'Repair not found' });
    
    if (!isSuperAdmin && existing.rows[0].shop_id !== shopId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    let vehicle_image = existing.rows[0].vehicle_image;

    if (req.file) {
      // Delete old image if it exists
      if (vehicle_image) await deleteFromR2(vehicle_image);
      // Upload new image
      vehicle_image = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype);
    }

    const query = `
      UPDATE repairs 
      SET 
        vehicle_image = $1, 
        vehicle_number = $2, 
        owner_name = $3, 
        phone_number = $4, 
        complaints = $5, 
        repair_date = $6, 
        attending_worker_id = $7, 
        status = $8,
        service_type = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `;
    
    const params = [
      vehicle_image,
      vehicle_number,
      owner_name,
      phone_number,
      complaints,
      repair_date,
      attending_worker_id || null,
      status || 'Pending',
      service_type || 'Repair',
      req.params.id
    ];

    const result = await db.query(query, params);

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('updateRepair Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Delete repair
exports.deleteRepair = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';

  try {
    const existing = await db.query('SELECT shop_id, vehicle_image FROM repairs WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ success: false, error: 'Repair not found' });

    if (!isSuperAdmin && existing.rows[0].shop_id !== shopId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (existing.rows[0].vehicle_image) {
      await deleteFromR2(existing.rows[0].vehicle_image);
    }

    await db.query('DELETE FROM repairs WHERE id = $1', [req.params.id]);

    res.status(200).json({ success: true, message: 'Repair deleted' });
  } catch (error) {
    console.error('deleteRepair Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
