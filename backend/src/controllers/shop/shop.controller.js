const db = require('../../config/db');
const { uploadToR2, deleteFromR2 } = require('../../middleware/upload');

// @desc    Get all shops — Global Oversight for super-admin / admin, or public search
exports.getShops = async (req, res) => {
  const { status, location, service, country, state, city } = req.query;
  const statusFilter = status === 'Inactive' ? 'deleted_at IS NOT NULL' : 'deleted_at IS NULL';

  // Public search — if no user attached (no auth middleware on this public route variant)
  if (!req.user) {
    try {
      const params = [];
      const conditions = [statusFilter];
      const scoreExprs = [];

      // If explicit region provided (from WorkshopRegionSelects)
      if (country) {
        params.push(country);
        conditions.push(`country ILIKE $${params.length}`);
      }
      if (state) {
        params.push(state);
        conditions.push(`state ILIKE $${params.length}`);
      }
      if (city) {
        params.push(city);
        conditions.push(`city ILIKE $${params.length}`);
      }

      // Generic location search text
      if (location) {
        const locIdx = () => { params.push(location.toLowerCase()); return params.length; };
        const locWild = () => { params.push(`%${location}%`); return params.length; };

        const e1 = locIdx(); const e2 = locWild(); const e3 = locWild();
        const e4 = locWild(); const e5 = locWild(); const e6 = locWild();

        conditions.push(`(
          LOWER(city) = $${e1} OR
          city    ILIKE $${e2} OR
          state   ILIKE $${e3} OR
          location ILIKE $${e4} OR
          address  ILIKE $${e5} OR
          name     ILIKE $${e6}
        )`);

        const s1 = locIdx(); const s2 = locWild(); const s3 = locWild();
        const s4 = locWild(); const s5 = locWild(); const s6 = locWild();

        scoreExprs.push(`
          CASE WHEN LOWER(city) = $${s1}     THEN 100 ELSE 0 END +
          CASE WHEN city    ILIKE $${s2}     THEN  60 ELSE 0 END +
          CASE WHEN state   ILIKE $${s3}     THEN  40 ELSE 0 END +
          CASE WHEN location ILIKE $${s4}    THEN  30 ELSE 0 END +
          CASE WHEN address  ILIKE $${s5}    THEN  30 ELSE 0 END +
          CASE WHEN name     ILIKE $${s6}    THEN  20 ELSE 0 END
        `);
      }

      if (service) {
        const sWild = () => { params.push(`%${service}%`); return params.length; };
        const f1 = sWild(); const s1 = sWild();

        conditions.push(`services_offered::text ILIKE $${f1}`);
        scoreExprs.push(`CASE WHEN services_offered::text ILIKE $${s1} THEN 50 ELSE 0 END`);
      }

      const scoreClause = scoreExprs.length
        ? `(${scoreExprs.join(' + ')}) AS relevance_score`
        : `0 AS relevance_score`;

      const whereClause = conditions.join(' AND ');
      const query = `
        SELECT *, ${scoreClause}
        FROM shops
        WHERE ${whereClause}
        ORDER BY relevance_score DESC, name ASC
      `;

      const result = await db.query(query, params);
      return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
      console.error('getShops (public) Error:', error);
      return res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  // Authenticated route — role-scoped
  const { role, shopId: userShopId } = req.user;
  const isGlobalAdmin = role === 'super-admin' || role === 'admin';
  const shopId = isGlobalAdmin ? null : userShopId;

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
    latitude, longitude, place_id, state, city, address, shop_image,
    operating_hours, services_offered
  } = req.body;
  try {
    let finalShopImage = shop_image;
    if (req.file) {
      finalShopImage = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype);
    }

    let finalHours = operating_hours;
    if (typeof operating_hours === 'object') try { finalHours = JSON.stringify(operating_hours); } catch(e) {}
    
    let finalServices = services_offered;
    if (typeof services_offered === 'object') try { finalServices = JSON.stringify(services_offered); } catch(e) {}

    const result = await db.query(
      `INSERT INTO shops (
        name, location, owner_name, owner_phone, country, currency, 
        latitude, longitude, place_id, state, city, address, status, shop_image,
        operating_hours, services_offered
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [
        name, location, owner_name, owner_phone, country || 'India', currency || 'INR', 
        latitude, longitude, place_id, state, city, address, req.body.status || 'Active', finalShopImage,
        finalHours, finalServices
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
    latitude, longitude, place_id, state, city, address, status, shop_image,
    operating_hours, services_offered
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

    let finalHours = operating_hours;
    if (typeof operating_hours === 'object') try { finalHours = JSON.stringify(operating_hours); } catch(e) {}
    
    let finalServices = services_offered;
    if (typeof services_offered === 'object') try { finalServices = JSON.stringify(services_offered); } catch(e) {}

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
      finalHours ?? null,
      finalServices ?? null,
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
           shop_image = COALESCE($14, shop_image),
           operating_hours = COALESCE($15, operating_hours),
           services_offered = COALESCE($16, services_offered)
       WHERE id = $17 RETURNING *`,
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
