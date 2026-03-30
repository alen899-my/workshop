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

    if (isSuperAdmin) {
      const result = await db.query(select + ' ORDER BY c.created_at DESC');
      return res.status(200).json({ success: true, data: result.rows });
    } else {
      if (!shopId) return res.status(403).json({ success: false, error: 'No shop assigned' });
      const result = await db.query(
        select + ' WHERE c.shop_id = $1 ORDER BY c.created_at DESC',
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
      WHERE c.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Customer not found' });

    const customer = result.rows[0];
    if (!isSuperAdmin && customer.shop_id !== shopId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Fetch vehicles
    const vehicles = await db.query('SELECT * FROM vehicles WHERE customer_id = $1', [customer.id]);
    customer.vehicles = vehicles.rows;

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    console.error('getCustomerById Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Create customer
exports.createCustomer = async (req, res) => {
  const { shopId } = req.user;
  const { name, phone, shop_id } = req.body;
  const targetShopId = req.user.role === 'super-admin' ? shop_id : shopId;

  try {
    const result = await db.query(
      'INSERT INTO customers (shop_id, name, phone) VALUES ($1, $2, $3) RETURNING *',
      [targetShopId, name, phone]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('createCustomer Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Update customer
exports.updateCustomer = async (req, res) => {
  const { name, phone } = req.body;
  try {
    const result = await db.query(
      'UPDATE customers SET name = $1, phone = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [name, phone, req.params.id]
    );
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('updateCustomer Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    await db.query('DELETE FROM customers WHERE id = $1', [req.params.id]);
    res.status(200).json({ success: true, message: 'Customer deleted' });
  } catch (error) {
    console.error('deleteCustomer Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
