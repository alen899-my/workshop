const db = require('../../config/db');

// @desc    Get all shops — Global Oversight for super-admin / admin
exports.getShops = async (req, res) => {
  const { role, shopId: userShopId } = req.user;
  // Support both 'super-admin' and legacy 'admin' slugs for global view
  const isGlobalAdmin = role === 'super-admin' || role === 'admin';
  const shopId = isGlobalAdmin ? null : userShopId;

  try {
    const query = shopId 
       ? 'SELECT * FROM shops WHERE id = $1' 
       : 'SELECT * FROM shops ORDER BY created_at DESC';
    const result = await db.query(query, shopId ? [shopId] : []);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getShops Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get single shop
exports.getShopById = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM shops WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Shop not found' });
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Create new shop
exports.createShop = async (req, res) => {
  const { name, location, owner_name } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO shops (name, location, owner_name) VALUES ($1, $2, $3) RETURNING *',
      [name, location, owner_name]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Update shop metadata
exports.updateShop = async (req, res) => {
  const { name, location, owner_name } = req.body;
  try {
    // Current shops table schema: id, name, location, owner_name, created_at
    const result = await db.query(
      'UPDATE shops SET name=$1, location=$2, owner_name=$3 WHERE id=$4 RETURNING *',
      [name, location, owner_name, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Shop not found' });
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('updateShop Error:', error);
    res.status(500).json({ success: false, error: 'Server error during metadata update' });
  }
};

// @desc    Delete shop hub
exports.deleteShop = async (req, res) => {
  try {
    await db.query('DELETE FROM shops WHERE id = $1', [req.params.id]);
    res.status(200).json({ success: true, message: 'Shop hub and associated registry data purged' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
