const db = require('../../config/db');
const { uploadToR2, deleteFromR2 } = require('../../middleware/upload');

// @desc    Get all repairs (scoped by shop)
exports.getRepairs = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';

  try {
    const select = `
      SELECT 
        r.id, r.vehicle_number, r.model_name, r.owner_name, r.phone_number, 
        r.complaints, r.repair_date, r.status, r.service_type, r.vehicle_type, r.created_at,
        COALESCE(r.vehicle_image, v.vehicle_image) as vehicle_image,
        v.id AS vehicle_id,
        c.id AS customer_id,
        COALESCE(c.name, r.owner_name) as owner_name,
        COALESCE(c.phone, r.phone_number) as phone_number,
        COALESCE(v.vehicle_number, r.vehicle_number) as vehicle_number,
        COALESCE(v.model_name, r.model_name) as model_name,
        COALESCE(v.vehicle_type, r.vehicle_type) as vehicle_type,
        COALESCE(v.vehicle_image, r.vehicle_image) as vehicle_image,
        s.name AS shop_name,
        aw.name AS attending_worker_name,
        sb.name AS submitted_by_name
    `;
    const from = `
      FROM repairs r
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN customers c ON v.customer_id = c.id
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
        COALESCE(r.vehicle_image, v.vehicle_image) as vehicle_image,
        v.vehicle_number AS v_num, v.model_name AS v_mod, v.vehicle_type AS v_type,
        c.name AS c_name, c.phone AS c_phone,
        s.name AS shop_name,
        aw.name AS attending_worker_name,
        sb.name AS submitted_by_name
      FROM repairs r
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN customers c ON v.customer_id = c.id
      LEFT JOIN shops s ON r.shop_id = s.id
      LEFT JOIN users aw ON r.attending_worker_id = aw.id
      LEFT JOIN users sb ON r.submitted_by_id = sb.id
      WHERE r.id = $1
    `;
    const result = await db.query(select, [req.params.id]);

    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Repair not found' });

    const repair = result.rows[0];
    
    // Normalize properties for frontend if joined data exists
    if (repair.c_name) repair.owner_name = repair.c_name;
    if (repair.c_phone) repair.phone_number = repair.c_phone;
    if (repair.v_num) repair.vehicle_number = repair.v_num;
    if (repair.v_mod) repair.model_name = repair.v_mod;
    if (repair.v_type) repair.vehicle_type = repair.v_type;

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
  const { 
    vehicle_number, model_name, owner_name, phone_number, complaints, 
    repair_date, attending_worker_id, status, service_type, vehicle_type, prefilled_image
  } = req.body;
  let vehicle_image = prefilled_image || null;

  // Safe parse complaints (Sent as string via FormData)
  let parsedComplaints = [];
  try {
    if (complaints) {
      parsedComplaints = typeof complaints === 'string' ? JSON.parse(complaints) : complaints;
    }
  } catch (e) {
    console.error("Complaints parse error:", e);
    parsedComplaints = [];
  }

  try {
    if (req.file) {
      vehicle_image = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype);
    }

    // 1. Ensure Customer exists
    let customerResult = await db.query(
      'SELECT id FROM customers WHERE phone = $1 AND shop_id = $2', 
      [phone_number, shopId]
    );
    let customerId;
    if (customerResult.rows.length === 0) {
      const resp = await db.query(
        'INSERT INTO customers (shop_id, name, phone) VALUES ($1, $2, $3) RETURNING id',
        [shopId, owner_name, phone_number]
      );
      customerId = resp.rows[0].id;
    } else {
      customerId = customerResult.rows[0].id;
      // Update name if changed
      await db.query('UPDATE customers SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [owner_name, customerId]);
    }

    // 2. Ensure Vehicle exists
    let vehicleResult = await db.query(
      'SELECT id FROM vehicles WHERE vehicle_number = $1 AND shop_id = $2',
      [vehicle_number, shopId]
    );
    let vehicleId;
    if (vehicleResult.rows.length === 0) {
      const resp = await db.query(
        'INSERT INTO vehicles (customer_id, shop_id, vehicle_number, model_name, vehicle_type, vehicle_image) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [customerId, shopId, vehicle_number, model_name, vehicle_type, vehicle_image]
      );
      vehicleId = resp.rows[0].id;
    } else {
      vehicleId = vehicleResult.rows[0].id;
      // Update vehicle details if provided
      await db.query(
        'UPDATE vehicles SET customer_id = $1, model_name = $2, vehicle_type = $3, vehicle_image = COALESCE($4, vehicle_image), updated_at = CURRENT_TIMESTAMP WHERE id = $5',
        [customerId, model_name, vehicle_type, vehicle_image, vehicleId]
      );
    }

    const query = `
      INSERT INTO repairs 
        (shop_id, vehicle_id, vehicle_number, model_name, owner_name, phone_number, complaints, repair_date, attending_worker_id, submitted_by_id, status, service_type, vehicle_type, vehicle_image)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    const params = [
      shopId, 
      vehicleId,
      vehicle_number, 
      model_name,
      owner_name, 
      phone_number, 
      JSON.stringify(parsedComplaints), 
      repair_date || new Date(), 
      attending_worker_id || null, 
      userId, 
      status || 'Pending',
      service_type || 'Repair',
      vehicle_type || 'Car',
      vehicle_image
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
  const { 
    vehicle_number, model_name, owner_name, phone_number, complaints, 
    repair_date, attending_worker_id, status, service_type, vehicle_type 
  } = req.body;

  let parsedComplaints = [];
  try {
    if (complaints) {
      parsedComplaints = typeof complaints === 'string' ? JSON.parse(complaints) : complaints;
    }
  } catch (e) {
    console.error("Complaints update parse error:", e);
  }

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

    // 1. Update/Verify Customer
    let customerResult = await db.query(
      'SELECT id FROM customers WHERE phone = $1 AND shop_id = $2', 
      [phone_number, existing.rows[0].shop_id]
    );
    let customerId;
    if (customerResult.rows.length === 0) {
      const resp = await db.query(
        'INSERT INTO customers (shop_id, name, phone) VALUES ($1, $2, $3) RETURNING id',
        [existing.rows[0].shop_id, owner_name, phone_number]
      );
      customerId = resp.rows[0].id;
    } else {
      customerId = customerResult.rows[0].id;
      await db.query('UPDATE customers SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [owner_name, customerId]);
    }

    // 2. Update/Verify Vehicle
    let vehicleResult = await db.query(
      'SELECT id FROM vehicles WHERE vehicle_number = $1 AND shop_id = $2',
      [vehicle_number, existing.rows[0].shop_id]
    );
    let vehicleId;
    if (vehicleResult.rows.length === 0) {
      const resp = await db.query(
        'INSERT INTO vehicles (customer_id, shop_id, vehicle_number, model_name, vehicle_type, vehicle_image) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [customerId, existing.rows[0].shop_id, vehicle_number, model_name, vehicle_type, vehicle_image]
      );
      vehicleId = resp.rows[0].id;
    } else {
      vehicleId = vehicleResult.rows[0].id;
      await db.query(
        'UPDATE vehicles SET customer_id = $1, model_name = $2, vehicle_type = $3, vehicle_image = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5',
        [customerId, model_name, vehicle_type, vehicle_image, vehicleId]
      );
    }

    const query = `
      UPDATE repairs 
      SET 
        vehicle_id = $1,
        vehicle_number = $2, 
        model_name = $3,
        owner_name = $4, 
        phone_number = $5, 
        complaints = $6, 
        repair_date = $7, 
        attending_worker_id = $8, 
        status = $9,
        service_type = $10,
        vehicle_type = $11,
        vehicle_image = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `;
    
    const params = [
      vehicleId,
      vehicle_number,
      model_name,
      owner_name,
      phone_number,
      JSON.stringify(parsedComplaints),
      repair_date,
      attending_worker_id || null,
      status || 'Pending',
      service_type || 'Repair',
      vehicle_type || 'Car',
      vehicle_image,
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
// @desc    Get dashboard summary statistics
exports.getDashboardStats = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';

  if (!isSuperAdmin && !shopId) {
    return res.status(403).json({ success: false, error: 'No shop assigned' });
  }

  try {
    const shopFilter = isSuperAdmin ? '' : `WHERE shop_id = ${shopId}`;
    const shopFilterWithAlias = isSuperAdmin ? '' : `WHERE r.shop_id = ${shopId}`;

    // 1. Total & Pending Counts
    const countsR = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status != 'Completed') as pending
      FROM repairs
      ${shopFilter}
    `);

    // 2. Total Revenue (from bills)
    const revenueR = await db.query(`
      SELECT SUM(rb.total_amount) as revenue
      FROM repair_bills rb
      JOIN repairs r ON rb.repair_id = r.id
      ${shopFilterWithAlias}
    `);

    // 3. Recent 3 Repairs
    const recentR = await db.query(`
      SELECT r.*, s.name as shop_name
      FROM repairs r
      LEFT JOIN shops s ON r.shop_id = s.id
      ${shopFilterWithAlias}
      ORDER BY r.created_at DESC
      LIMIT 3
    `);

    // 4. Avg Completion Time (in hours) - Jobs that are COMPLETED
    const timeR = await db.query(`
      SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) as avg_hours
      FROM repairs
      ${shopFilter} AND status = 'Completed'
    `);

    // 5. Worker Assignments (Technicians/Shop Staff)
    const workersR = await db.query(`
      SELECT 
        u.id, u.name, u.role,
        (SELECT COUNT(*) FROM repairs r WHERE r.attending_worker_id = u.id AND r.status != 'Completed') as active_jobs
      FROM users u
      WHERE u.shop_id = $1 AND u.role != 'super-admin'
      ORDER BY active_jobs DESC
    `, [shopId]);

    res.status(200).json({
      success: true,
      data: {
        totalRepairs: parseInt(countsR.rows[0].total || 0),
        pendingRepairs: parseInt(countsR.rows[0].pending || 0),
        totalRevenue: parseFloat(revenueR.rows[0].revenue || 0),
        recentRepairs: recentR.rows[0] ? recentR.rows : [],
        avgCompletionHours: parseFloat(timeR.rows[0].avg_hours || 0).toFixed(1),
        workers: workersR.rows
      }
    });
  } catch (error) {
    console.error('getDashboardStats Error:', error);
    res.status(500).json({ success: false, error: 'Server error fetching stats' });
  }
};
