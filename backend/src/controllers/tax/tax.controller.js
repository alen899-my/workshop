const db = require('../../config/db');

// @desc  Get all tax settings for the current shop
exports.getTaxSettings = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';
  const queryShopId = req.query.shop_id;

  try {
    let result;
    if (isSuperAdmin && !queryShopId) {
       // Super admin fetching all shops' taxes
        result = await db.query(`
          SELECT t.*, s.name as shop_name 
          FROM tax_settings t 
          LEFT JOIN shops s ON t.shop_id = s.id 
          WHERE t.deleted_at IS NULL
          ORDER BY t.created_at DESC
        `);
    } else {
       // Regular shop fetch
       const targetShopId = isSuperAdmin ? queryShopId : shopId;
       if (!targetShopId) {
          return res.status(200).json({ success: true, data: [] });
       }
        result = await db.query(
          'SELECT * FROM tax_settings WHERE shop_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC',
          [targetShopId]
        );
    }
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getTaxSettings Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc  Create a new tax setting
exports.createTaxSetting = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';
  const { name, rate, description, is_active = true, is_inclusive = false, applies_to = 'all' } = req.body;
  const targetShopId = isSuperAdmin ? (req.body.shop_id || shopId) : shopId;

  if (!name || rate === undefined || rate === null) {
    return res.status(400).json({ success: false, error: 'Tax name and rate are required' });
  }
  if (Number(rate) < 0 || Number(rate) > 100) {
    return res.status(400).json({ success: false, error: 'Tax rate must be between 0 and 100' });
  }

  try {
    const result = await db.query(
      `INSERT INTO tax_settings (shop_id, name, rate, description, is_active, is_inclusive, applies_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [targetShopId, name, rate, description || null, is_active, is_inclusive, applies_to]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('createTaxSetting Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc  Update a tax setting (e.g. toggle active, change rate)
exports.updateTaxSetting = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';
  const { id } = req.params;

  try {
    // Ownership check
    const existing = await db.query('SELECT * FROM tax_settings WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ success: false, error: 'Tax setting not found' });
    if (!isSuperAdmin && existing.rows[0].shop_id !== shopId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const { name, rate, description, is_active, is_inclusive, applies_to } = req.body;
    const result = await db.query(
      `UPDATE tax_settings 
       SET name = COALESCE($1, name),
           rate = COALESCE($2, rate),
           description = COALESCE($3, description),
           is_active = COALESCE($4, is_active),
           is_inclusive = COALESCE($5, is_inclusive),
           applies_to = COALESCE($6, applies_to),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [name, rate, description, is_active, is_inclusive, applies_to, id]
    );
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('updateTaxSetting Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc  Delete a tax setting
exports.deleteTaxSetting = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';
  const { id } = req.params;

  try {
    const existing = await db.query('SELECT * FROM tax_settings WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ success: false, error: 'Tax setting not found' });
    if (!isSuperAdmin && existing.rows[0].shop_id !== shopId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await db.query(`UPDATE tax_settings SET deleted_at = NOW(), is_active = false WHERE id = $1`, [id]);
    res.status(200).json({ success: true, message: 'Tax setting archived (Inactive)' });
  } catch (error) {
    console.error('deleteTaxSetting Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
