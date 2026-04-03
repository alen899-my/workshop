const db = require('../../config/db');

// @desc    Get bill for a repair
exports.getBill = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';
  const repairId = req.params.repairId;

  try {
    // Check repair access
    const repairRes = await db.query('SELECT shop_id FROM repairs WHERE id = $1', [repairId]);
    if (repairRes.rows.length === 0) return res.status(404).json({ success: false, error: 'Repair not found' });
    if (!isSuperAdmin && repairRes.rows[0].shop_id !== shopId) return res.status(403).json({ success: false, error: 'Access denied' });

    const result = await db.query('SELECT * FROM repair_bills WHERE repair_id = $1', [repairId]);
    
    // If no bill exists yet, return empty structured data
    if (result.rows.length === 0) {
      return res.status(200).json({ success: true, data: { repair_id: repairId, items: [], service_charge: 0, total_amount: 0 } });
    }

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('getBill Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Save/Update bill for a repair
exports.saveBill = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';
  const repairId = req.params.repairId;
  const { items, service_charge, tax_snapshot = [], tax_total = 0 } = req.body;

  try {
    // Check repair access
    const repairRes = await db.query('SELECT shop_id FROM repairs WHERE id = $1', [repairId]);
    if (repairRes.rows.length === 0) return res.status(404).json({ success: false, error: 'Repair not found' });
    if (!isSuperAdmin && repairRes.rows[0].shop_id !== shopId) return res.status(403).json({ success: false, error: 'Access denied' });

    // Calculate total amount (items + service + taxes)
    const parsedItems = Array.isArray(items) ? items : [];
    const itemsTotal = parsedItems.reduce((acc, current) => acc + (Number(current.cost) * Number(current.qty)), 0);
    const parsedTaxTotal = Number(tax_total || 0);
    const subtotalBeforeTax = itemsTotal + Number(service_charge || 0);
    const totalAmount = subtotalBeforeTax + parsedTaxTotal;

    const query = `
      INSERT INTO repair_bills (repair_id, items, service_charge, tax_snapshot, tax_total, subtotal_before_tax, total_amount)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (repair_id) DO UPDATE 
      SET items = EXCLUDED.items, service_charge = EXCLUDED.service_charge, 
          tax_snapshot = EXCLUDED.tax_snapshot, tax_total = EXCLUDED.tax_total,
          subtotal_before_tax = EXCLUDED.subtotal_before_tax,
          total_amount = EXCLUDED.total_amount, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const params = [repairId, JSON.stringify(parsedItems), service_charge || 0, JSON.stringify(tax_snapshot), parsedTaxTotal, subtotalBeforeTax, totalAmount];

    const result = await db.query(query, params);

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('saveBill Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get all bills for a shop
exports.getAllBills = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';

  try {
    let query = `
      SELECT 
        rb.id, rb.repair_id, rb.items, rb.service_charge, 
        rb.tax_snapshot, rb.tax_total, rb.subtotal_before_tax, rb.total_amount, rb.created_at, rb.updated_at,
        r.vehicle_number, r.owner_name, r.repair_date, r.status, r.vehicle_image, r.vehicle_type, r.service_type, r.phone_number, r.complaints,
        u.name as attending_worker_name
      FROM repair_bills rb
      JOIN repairs r ON rb.repair_id = r.id
      LEFT JOIN users u ON r.attending_worker_id = u.id
    `;
    const params = [];

    if (!isSuperAdmin) {
      query += ` WHERE r.shop_id = $1`;
      params.push(shopId);
    }
    
    query += ` ORDER BY rb.created_at DESC`;

    const result = await db.query(query, params);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getAllBills Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Delete bill for a repair
exports.deleteBill = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';
  const id = req.params.id;

  try {
    // Verify ownership
    const checkRes = await db.query(`
      SELECT rb.id FROM repair_bills rb
      JOIN repairs r ON rb.repair_id = r.id
      WHERE rb.id = $1 ${isSuperAdmin ? '' : 'AND r.shop_id = $2'}
    `, isSuperAdmin ? [id] : [id, shopId]);

    if (checkRes.rows.length === 0) return res.status(404).json({ success: false, error: 'Bill not found' });

    await db.query('DELETE FROM repair_bills WHERE id = $1', [id]);
    res.status(200).json({ success: true, message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('deleteBill Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
