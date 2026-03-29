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
  const { items, service_charge } = req.body;

  try {
    // Check repair access
    const repairRes = await db.query('SELECT shop_id FROM repairs WHERE id = $1', [repairId]);
    if (repairRes.rows.length === 0) return res.status(404).json({ success: false, error: 'Repair not found' });
    if (!isSuperAdmin && repairRes.rows[0].shop_id !== shopId) return res.status(403).json({ success: false, error: 'Access denied' });

    // Calculate total amount
    const parsedItems = Array.isArray(items) ? items : [];
    const itemsTotal = parsedItems.reduce((acc, current) => acc + (Number(current.cost) * Number(current.qty)), 0);
    const totalAmount = itemsTotal + Number(service_charge || 0);

    const query = `
      INSERT INTO repair_bills (repair_id, items, service_charge, total_amount)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (repair_id) DO UPDATE 
      SET items = EXCLUDED.items, service_charge = EXCLUDED.service_charge, total_amount = EXCLUDED.total_amount, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const params = [repairId, JSON.stringify(parsedItems), service_charge || 0, totalAmount];

    const result = await db.query(query, params);

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('saveBill Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
