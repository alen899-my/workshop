const db = require('../../config/db');
const { uploadToR2, deleteFromR2 } = require('../../middleware/upload');

// @desc    Get all shops — Global Oversight for super-admin / admin
exports.getShops = async (req, res) => {
  const { role, shopId: userShopId } = req.user;
  // Support both 'super-admin' and legacy 'admin' slugs for global view
  const isGlobalAdmin = role === 'super-admin' || role === 'admin';
  const shopId = isGlobalAdmin ? null : userShopId;

  const { status } = req.query;
  const statusFilter = status === 'Inactive' ? 'deleted_at IS NOT NULL' : 'deleted_at IS NULL';

  try {
    const query = shopId 
       ? `SELECT * FROM shops WHERE id = $1 AND ${statusFilter}` 
       : `SELECT * FROM shops WHERE ${statusFilter} ORDER BY created_at DESC`;
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
    const result = await db.query('SELECT * FROM shops WHERE id = $1 AND deleted_at IS NULL', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Shop not found' });
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Create new shop
exports.createShop = async (req, res) => {
  const { 
    name, location, owner_name, owner_phone, country, currency, 
    latitude, longitude, place_id, state, city, address, shop_image 
  } = req.body;
  try {
    let finalShopImage = shop_image;
    if (req.file) {
      finalShopImage = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype);
    }

    const result = await db.query(
      `INSERT INTO shops (
        name, location, owner_name, owner_phone, country, currency, 
        latitude, longitude, place_id, state, city, address, status, shop_image
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        name, location, owner_name, owner_phone, country || 'India', currency || 'INR', 
        latitude, longitude, place_id, state, city, address, req.body.status || 'Active', finalShopImage
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('createShop Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Update shop metadata
exports.updateShop = async (req, res) => {
  const { 
    name, location, owner_name, currency, country, owner_phone, 
    latitude, longitude, place_id, state, city, address, status, shop_image 
  } = req.body;
  try {
    const existing = await db.query('SELECT shop_image FROM shops WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ success: false, error: 'Shop not found' });

    let finalShopImage = existing.rows[0].shop_image;
    if (req.file) {
      if (finalShopImage) await deleteFromR2(finalShopImage);
      finalShopImage = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype);
    } else if (shop_image === "") {
      if (finalShopImage) await deleteFromR2(finalShopImage);
      finalShopImage = null;
    }

    const params = [
      name ?? null, 
      location ?? city ?? null, 
      owner_name ?? null, 
      currency ?? null, 
      country ?? null, 
      owner_phone ?? null, 
      latitude ?? null, 
      longitude ?? null, 
      place_id ?? null, 
      state ?? null, 
      city ?? null, 
      address ?? null, 
      status ?? null, 
      finalShopImage, 
      req.params.id
    ];

    const result = await db.query(
      `UPDATE shops 
       SET name = COALESCE($1, name), 
           location = COALESCE($2, location), 
           owner_name = COALESCE($3, owner_name),
           currency = COALESCE($4, currency),
           country = COALESCE($5, country),
           owner_phone = COALESCE($6, owner_phone),
           latitude = COALESCE($7, latitude),
           longitude = COALESCE($8, longitude),
           place_id = COALESCE($9, place_id),
           state = COALESCE($10, state),
           city = COALESCE($11, city),
           address = COALESCE($12, address),
           status = COALESCE($13, status),
           shop_image = COALESCE($14, shop_image)
       WHERE id = $15 RETURNING *`,
      params
    );
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('updateShop Error:', error);
    res.status(500).json({ success: false, error: 'Server error during metadata update' });
  }
};

// @desc    Soft Delete shop hub
exports.deleteShop = async (req, res) => {
  try {
    await db.query(`UPDATE shops SET deleted_at = NOW(), status = 'Inactive' WHERE id = $1`, [req.params.id]);
    res.status(200).json({ success: true, message: 'Shop hub archived (Inactive)' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
