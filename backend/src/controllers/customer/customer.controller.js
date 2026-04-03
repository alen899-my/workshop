const db = require('../../config/db');

// @desc    Get all customers (scoped by shop)
exports.getCustomers = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';

  try {
    const select = `
      SELECT c.*, s.name as shop_name,
        (SELECT COUNT(*) FROM vehicles WHERE customer_id = c.id) as vehicle_count
      FROM customers c
      LEFT JOIN shops s ON c.shop_id = s.id
    `;

    const { status } = req.query;
    const statusFilter = status === 'Inactive' ? 'c.deleted_at IS NOT NULL' : 'c.deleted_at IS NULL';

    if (isSuperAdmin) {
      const result = await db.query(select + ` WHERE ${statusFilter} ORDER BY c.created_at DESC`);
      return res.status(200).json({ success: true, data: result.rows });
    } else {
      if (!shopId) return res.status(403).json({ success: false, error: 'No shop assigned' });
      const result = await db.query(
        select + ` WHERE c.shop_id = $1 AND ${statusFilter} ORDER BY c.created_at DESC`,
        [shopId]
      );
      return res.status(200).json({ success: true, data: result.rows });
    }
  } catch (error) {
    console.error('getCustomers Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get single customer with their vehicles
exports.getCustomerById = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';

  try {
    const result = await db.query(`
      SELECT c.*, s.name as shop_name
      FROM customers c 
      LEFT JOIN shops s ON c.shop_id = s.id
      WHERE c.id = $1 AND c.deleted_at IS NULL
    `, [req.params.id]);

    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Customer not found' });

    const customer = result.rows[0];
    if (!isSuperAdmin && customer.shop_id !== shopId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Fetch active vehicles
    const vehicles = await db.query('SELECT * FROM vehicles WHERE customer_id = $1 AND deleted_at IS NULL', [customer.id]);
    customer.vehicles = vehicles.rows;

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    console.error('getCustomerById Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Create customer with assigned vehicles (new or existing)
exports.createCustomer = async (req, res) => {
  const { shopId } = req.user;
  const { name, phone, shop_id, vehicles } = req.body;
  const targetShopId = req.user.role === 'super-admin' ? shop_id : shopId;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      'INSERT INTO customers (shop_id, name, phone, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [targetShopId, name, phone, req.body.status || 'Active']
    );
    const customer = result.rows[0];

    if (vehicles && Array.isArray(vehicles)) {
      for (const v of vehicles) {
        if (v.id) {
           // Assign existing vehicle
           await client.query(
             'UPDATE vehicles SET customer_id = $1 WHERE id = $2 AND shop_id = $3',
             [customer.id, v.id, targetShopId]
           );
        } else if (v.vehicle_number) {
           // Create new vehicle
           await client.query(
             'INSERT INTO vehicles (customer_id, shop_id, vehicle_number, model_name, vehicle_type) VALUES ($1, $2, $3, $4, $5)',
             [customer.id, targetShopId, v.vehicle_number, v.model_name, v.vehicle_type || 'Car']
           );
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('createCustomer Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    client.release();
  }
};

// @desc    Update customer and manage vehicles
exports.updateCustomer = async (req, res) => {
  const { name, phone, vehicles } = req.body;
  const { shopId } = req.user;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      'UPDATE customers SET name = $1, phone = $2, status = COALESCE($3, status), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, phone, req.body.status, req.params.id]
    );
    const customer = result.rows[0];

    // Manage vehicles
    if (vehicles && Array.isArray(vehicles)) {
      for (const v of vehicles) {
        if (v.id) {
           // Re-assign or update existing? 
           // In this context, mostly reassignment of unassigned or change owner.
           await client.query(
             'UPDATE vehicles SET customer_id = $1 WHERE id = $2',
             [customer.id, v.id]
           );
        } else if (v.vehicle_number) {
           // Create new
           await client.query(
             'INSERT INTO vehicles (customer_id, shop_id, vehicle_number, model_name, vehicle_type) VALUES ($1, $2, $3, $4, $5)',
             [customer.id, customer.shop_id || shopId, v.vehicle_number, v.model_name, v.vehicle_type || 'Car']
           );
        }
      }
    }

    await client.query('COMMIT');
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('updateCustomer Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    client.release();
  }
};

// @desc    Soft Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    await db.query(`UPDATE customers SET deleted_at = NOW(), status = 'Inactive' WHERE id = $1`, [req.params.id]);
    res.status(200).json({ success: true, message: 'Customer record archived (Inactive)' });
  } catch (error) {
    console.error('deleteCustomer Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
