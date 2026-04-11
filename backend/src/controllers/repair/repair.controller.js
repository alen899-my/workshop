const db = require('../../config/db');
const { uploadToR2, deleteFromR2 } = require('../../middleware/upload');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parses complaints from a FormData string or returns the array directly.
 * Returns an empty array on parse failure.
 */
function parseComplaints(raw) {
  if (!raw) return [];
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) {
    console.error('Complaints parse error:', e.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────

// @desc  Get all repairs (scoped by shop, with optional filters)
exports.getRepairs = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';

  try {
    // Single, clean SELECT — no duplicate columns
    const select = `
      SELECT 
        r.id, r.shop_id, r.vehicle_id,
        r.vehicle_number, r.model_name, r.owner_name, r.phone_number,
        r.complaints, r.repair_date, r.status, r.service_type, r.vehicle_type,
        r.created_at, r.updated_at,
        COALESCE(v.vehicle_image, r.vehicle_image) AS vehicle_image,
        COALESCE(c.name, r.owner_name)             AS owner_name,
        COALESCE(c.phone, r.phone_number)           AS phone_number,
        COALESCE(v.vehicle_number, r.vehicle_number) AS vehicle_number,
        COALESCE(v.model_name, r.model_name)        AS model_name,
        COALESCE(v.vehicle_type, r.vehicle_type)    AS vehicle_type,
        s.name  AS shop_name,
        aw.name AS attending_worker_name,
        sb.name AS submitted_by_name,
        rb.id            AS bill_id,
        rb.payment_status
    `;

    const from = `
      FROM repairs r
      LEFT JOIN vehicles     v  ON v.id = r.vehicle_id
      LEFT JOIN customers    c  ON c.id = v.customer_id
      LEFT JOIN shops        s  ON s.id = r.shop_id
      LEFT JOIN users        aw ON aw.id = r.attending_worker_id
      LEFT JOIN users        sb ON sb.id = r.submitted_by_id
      LEFT JOIN repair_bills rb ON rb.repair_id = r.id AND rb.deleted_at IS NULL
    `;

    const { status, serviceType, vehicleType, worker, workerId, search, dateFrom, dateTo } = req.query;

    const whereClauses = ['r.deleted_at IS NULL'];
    const queryParams   = [];
    let   paramIndex    = 1;

    if (!isSuperAdmin) {
      whereClauses.push(`r.shop_id = $${paramIndex++}`);
      queryParams.push(shopId);
    }

    if (search) {
      whereClauses.push(`(r.vehicle_number ILIKE $${paramIndex} OR r.owner_name ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // 'status' is repair progress (Pending/Started/In Progress/Completed)
    // Exclude record-status values that accidentally end up in this param
    if (status && status !== 'Active' && status !== 'Inactive') {
      whereClauses.push(`r.status = $${paramIndex++}`);
      queryParams.push(status);
    }

    if (serviceType) {
      whereClauses.push(`r.service_type ILIKE $${paramIndex++}`);
      queryParams.push(serviceType);
    }

    if (vehicleType) {
      whereClauses.push(`r.vehicle_type = $${paramIndex++}`);
      queryParams.push(vehicleType);
    }

    if (worker) {
      whereClauses.push(`aw.name ILIKE $${paramIndex++}`);
      queryParams.push(`%${worker}%`);
    }

    if (workerId) {
      whereClauses.push(`r.attending_worker_id = $${paramIndex++}`);
      queryParams.push(Number(workerId));
    }

    if (dateFrom) {
      whereClauses.push(`r.repair_date >= $${paramIndex++}`);
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      whereClauses.push(`r.repair_date <= $${paramIndex++}`);
      queryParams.push(dateTo);
    }

    const sql = `${select} ${from} WHERE ${whereClauses.join(' AND ')} ORDER BY r.created_at DESC`;
    const result = await db.query(sql, queryParams);

    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getRepairs Error:', error);
    return res.status(500).json({ success: false, error: 'Server error fetching repairs' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────

// @desc  Get single repair by ID
exports.getRepairById = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';

  try {
    const sql = `
      SELECT
        r.*,
        COALESCE(v.vehicle_image, r.vehicle_image) AS vehicle_image,
        COALESCE(c.name,  r.owner_name)             AS owner_name,
        COALESCE(c.phone, r.phone_number)           AS phone_number,
        COALESCE(v.vehicle_number, r.vehicle_number) AS vehicle_number,
        COALESCE(v.model_name,    r.model_name)     AS model_name,
        COALESCE(v.vehicle_type,  r.vehicle_type)   AS vehicle_type,
        s.name  AS shop_name,
        aw.name AS attending_worker_name,
        sb.name AS submitted_by_name,
        rb.id            AS bill_id,
        rb.payment_status
      FROM repairs r
      LEFT JOIN vehicles     v  ON v.id = r.vehicle_id
      LEFT JOIN customers    c  ON c.id = v.customer_id
      LEFT JOIN shops        s  ON s.id = r.shop_id
      LEFT JOIN users        aw ON aw.id = r.attending_worker_id
      LEFT JOIN users        sb ON sb.id = r.submitted_by_id
      LEFT JOIN repair_bills rb ON rb.repair_id = r.id AND rb.deleted_at IS NULL
      WHERE r.id = $1 AND r.deleted_at IS NULL
    `;
    const result = await db.query(sql, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Repair not found' });
    }

    const repair = result.rows[0];

    // Scope check — non-super-admin can only see their shop's repairs
    if (!isSuperAdmin && repair.shop_id !== shopId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    return res.status(200).json({ success: true, data: repair });
  } catch (error) {
    console.error('getRepairById Error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────

// @desc  Create new repair (wrapped in a transaction)
exports.createRepair = async (req, res) => {
  const { shopId, id: userId } = req.user;

  const {
    vehicle_number, model_name, owner_name, phone_number,
    complaints, repair_date, attending_worker_id,
    status, service_type, vehicle_type, prefilled_image
  } = req.body;

  const parsedComplaints = parseComplaints(complaints);
  let vehicle_image = prefilled_image || null;

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Upload image first (outside transaction — R2 is external)
    if (req.file) {
      vehicle_image = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype);
    }

    // 1. Upsert Customer by phone
    let { rows: cRows } = await client.query(
      'SELECT id FROM customers WHERE phone = $1 AND shop_id = $2',
      [phone_number, shopId]
    );
    let customerId;
    if (cRows.length === 0) {
      const r = await client.query(
        'INSERT INTO customers (shop_id, name, phone) VALUES ($1, $2, $3) RETURNING id',
        [shopId, owner_name, phone_number]
      );
      customerId = r.rows[0].id;
    } else {
      customerId = cRows[0].id;
      if (owner_name) {
        await client.query(
          'UPDATE customers SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [owner_name, customerId]
        );
      }
    }

    // 2. Upsert Vehicle by number + shop
    let { rows: vRows } = await client.query(
      'SELECT id FROM vehicles WHERE vehicle_number = $1 AND shop_id = $2',
      [vehicle_number, shopId]
    );
    let vehicleId;
    if (vRows.length === 0) {
      const r = await client.query(
        `INSERT INTO vehicles (customer_id, shop_id, vehicle_number, model_name, vehicle_type, vehicle_image)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [customerId, shopId, vehicle_number, model_name, vehicle_type, vehicle_image]
      );
      vehicleId = r.rows[0].id;
    } else {
      vehicleId = vRows[0].id;
      await client.query(
        `UPDATE vehicles
         SET customer_id = $1, model_name = $2, vehicle_type = $3,
             vehicle_image = COALESCE($4, vehicle_image), updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [customerId, model_name, vehicle_type, vehicle_image, vehicleId]
      );
    }

    // 3. Insert Repair
    const { rows: repairRows } = await client.query(
      `INSERT INTO repairs
         (shop_id, vehicle_id, vehicle_number, model_name, owner_name, phone_number,
          complaints, repair_date, attending_worker_id, submitted_by_id,
          status, service_type, vehicle_type, vehicle_image)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        shopId, vehicleId, vehicle_number, model_name, owner_name, phone_number,
        JSON.stringify(parsedComplaints),
        repair_date || new Date(),
        attending_worker_id || null,
        userId,
        status || 'Pending',
        service_type || 'Repair',
        vehicle_type || 'Car',
        vehicle_image
      ]
    );

    await client.query('COMMIT');
    return res.status(201).json({ success: true, data: repairRows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('createRepair Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create repair record' });
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────

// @desc  Update existing repair (wrapped in a transaction)
exports.updateRepair = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';
  const repairId = req.params.id;

  const {
    vehicle_number, model_name, owner_name, phone_number,
    complaints, repair_date, attending_worker_id,
    status, service_type, vehicle_type, payment_status
  } = req.body;

  const parsedComplaints = parseComplaints(complaints);

  const client = await db.connect();
  try {
    // Scope check
    const { rows: existRows } = await client.query(
      'SELECT shop_id, vehicle_image FROM repairs WHERE id = $1 AND deleted_at IS NULL',
      [repairId]
    );
    if (existRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Repair not found' });
    }
    if (!isSuperAdmin && existRows[0].shop_id !== shopId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const repairShopId = existRows[0].shop_id;
    let vehicle_image = existRows[0].vehicle_image;

    await client.query('BEGIN');

    // Handle image replacement
    if (req.file) {
      if (vehicle_image) {
        // Delete old image from R2 (non-blocking — don't let R2 failure abort the update)
        deleteFromR2(vehicle_image).catch(e => console.error('R2 delete failed (non-critical):', e.message));
      }
      vehicle_image = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype);
    }

    // 1. Upsert Customer
    let { rows: cRows } = await client.query(
      'SELECT id FROM customers WHERE phone = $1 AND shop_id = $2',
      [phone_number, repairShopId]
    );
    let customerId;
    if (cRows.length === 0) {
      const r = await client.query(
        'INSERT INTO customers (shop_id, name, phone) VALUES ($1, $2, $3) RETURNING id',
        [repairShopId, owner_name, phone_number]
      );
      customerId = r.rows[0].id;
    } else {
      customerId = cRows[0].id;
      if (owner_name) {
        await client.query(
          'UPDATE customers SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [owner_name, customerId]
        );
      }
    }

    // 2. Upsert Vehicle
    let { rows: vRows } = await client.query(
      'SELECT id FROM vehicles WHERE vehicle_number = $1 AND shop_id = $2',
      [vehicle_number, repairShopId]
    );
    let vehicleId;
    if (vRows.length === 0) {
      const r = await client.query(
        `INSERT INTO vehicles (customer_id, shop_id, vehicle_number, model_name, vehicle_type, vehicle_image)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [customerId, repairShopId, vehicle_number, model_name, vehicle_type, vehicle_image]
      );
      vehicleId = r.rows[0].id;
    } else {
      vehicleId = vRows[0].id;
      await client.query(
        `UPDATE vehicles
         SET customer_id = $1, model_name = $2, vehicle_type = $3, vehicle_image = $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [customerId, model_name, vehicle_type, vehicle_image, vehicleId]
      );
    }

    // 3. Update Repair
    const { rows: repairRows } = await client.query(
      `UPDATE repairs SET
         vehicle_id         = $1,
         vehicle_number     = $2,
         model_name         = $3,
         owner_name         = $4,
         phone_number       = $5,
         complaints         = $6,
         repair_date        = $7,
         attending_worker_id = $8,
         status             = $9,
         service_type       = $10,
         vehicle_type       = $11,
         vehicle_image      = $12,
         updated_at         = CURRENT_TIMESTAMP
       WHERE id = $13
       RETURNING *`,
      [
        vehicleId, vehicle_number, model_name, owner_name, phone_number,
        JSON.stringify(parsedComplaints),
        repair_date,
        attending_worker_id || null,
        status || 'Pending',
        service_type || 'Repair',
        vehicle_type || 'Car',
        vehicle_image,
        repairId
      ]
    );

    // 4. Sync payment_status to repair_bills if a bill exists and payment_status was provided
    if (payment_status) {
      await client.query(
        `UPDATE repair_bills SET payment_status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE repair_id = $2 AND deleted_at IS NULL`,
        [payment_status, repairId]
      );
    }

    await client.query('COMMIT');
    return res.status(200).json({ success: true, data: repairRows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('updateRepair Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update repair record' });
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────

// @desc  Soft-delete repair
exports.deleteRepair = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';

  try {
    const { rows } = await db.query(
      'SELECT shop_id FROM repairs WHERE id = $1 AND deleted_at IS NULL',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Repair not found' });
    }
    if (!isSuperAdmin && rows[0].shop_id !== shopId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await db.query(
      `UPDATE repairs SET deleted_at = CURRENT_TIMESTAMP, status = 'Inactive' WHERE id = $1`,
      [req.params.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Repair record archived (metadata and registry preserved)'
    });
  } catch (error) {
    console.error('deleteRepair Error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────

// @desc  Dashboard summary stats
exports.getDashboardStats = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';

  if (!isSuperAdmin && !shopId) {
    return res.status(403).json({ success: false, error: 'No shop assigned' });
  }

  try {
    // All queries run in parallel for performance
    const shopParam      = isSuperAdmin ? [] : [shopId];
    const shopCondRepair = isSuperAdmin ? 'deleted_at IS NULL' : 'shop_id = $1 AND deleted_at IS NULL';
    const shopCondAlias  = isSuperAdmin ? 'r.deleted_at IS NULL' : 'r.shop_id = $1 AND r.deleted_at IS NULL';

    const [countsR, revenueR, recentR, timeR, workersR] = await Promise.all([
      // 1. Total & Pending counts
      db.query(
        `SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE status != 'Completed') AS pending
         FROM repairs
         WHERE ${shopCondRepair}`,
        shopParam
      ),

      // 2. Total Revenue
      db.query(
        `SELECT COALESCE(SUM(rb.total_amount), 0) AS revenue
         FROM repair_bills rb
         JOIN repairs r ON rb.repair_id = r.id
         WHERE ${shopCondAlias} AND rb.deleted_at IS NULL`,
        shopParam
      ),

      // 3. Recent 3 repairs
      db.query(
        `SELECT r.id, r.vehicle_number, r.owner_name, r.status, r.service_type,
                r.repair_date, r.created_at, s.name AS shop_name
         FROM repairs r
         LEFT JOIN shops s ON s.id = r.shop_id
         WHERE ${shopCondAlias}
         ORDER BY r.created_at DESC
         LIMIT 3`,
        shopParam
      ),

      // 4. Avg completion time (hours)
      db.query(
        `SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) AS avg_hours
         FROM repairs
         WHERE ${shopCondRepair} AND status = 'Completed'`,
        shopParam
      ),

      // 5. Worker assignments — only relevant for shop-scoped users
      isSuperAdmin
        ? Promise.resolve({ rows: [] })
        : db.query(
            `SELECT
               u.id, u.name, u.role,
               COUNT(r.id) FILTER (WHERE r.status != 'Completed') AS active_jobs
             FROM users u
             LEFT JOIN repairs r ON r.attending_worker_id = u.id AND r.deleted_at IS NULL
             WHERE u.shop_id = $1 AND u.role NOT IN ('super-admin', 'customer')
             GROUP BY u.id, u.name, u.role
             ORDER BY active_jobs DESC`,
            [shopId]
          )
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalRepairs:     parseInt(countsR.rows[0].total    || 0),
        pendingRepairs:   parseInt(countsR.rows[0].pending  || 0),
        totalRevenue:     parseFloat(revenueR.rows[0].revenue || 0),
        recentRepairs:    recentR.rows,
        avgCompletionHours: parseFloat(timeR.rows[0].avg_hours || 0).toFixed(1),
        workers:          workersR.rows
      }
    });
  } catch (error) {
    console.error('getDashboardStats Error:', error);
    return res.status(500).json({ success: false, error: 'Server error fetching stats' });
  }
};
