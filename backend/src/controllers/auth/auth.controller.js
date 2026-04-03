const db = require('../../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// @desc    Register a new workshop (The "Triple-Handshake" Flow)
exports.registerShop = async (req, res) => {
  const { 
    shopName, location, ownerName, phone, password, 
    country, currency, latitude, longitude, place_id,
    state, city, address
  } = req.body;

  try {
    // 1. Validate if user phone already exists
    const userCheck = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (userCheck.rows.length > 0) return res.status(400).json({ success: false, error: 'Phone already registered' });

    // 2. Hash password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Check if shop already exists
    const shopCheck = await db.query('SELECT * FROM shops WHERE name = $1', [shopName]);
    if (shopCheck.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Shop already exists' });
    }

    // 3. Resolve shop_owner roleId
    const roleR = await db.query("SELECT id FROM roles WHERE slug = 'shop_owner'");
    const roleId = roleR.rows.length > 0 ? roleR.rows[0].id : null;

    // 4. Atomic Transaction: Create Shop -> Create User -> Link Role
    await db.query('BEGIN');

    // Insert new shop
    const shopResult = await db.query(
      `INSERT INTO shops (
        name, location, owner_name, phone, country, currency, 
        latitude, longitude, place_id, state, city, address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [
        shopName, location, ownerName, phone, country || 'India', currency || 'INR',
        latitude, longitude, place_id, state, city, address
      ]
    );
    const shopId = shopResult.rows[0].id;

    const userResult = await db.query(
      'INSERT INTO users (shop_id, name, phone, password_hash, role, role_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [shopId, ownerName, phone, passwordHash, 'shop_owner', roleId]
    );
    const userId = userResult.rows[0].id;

    await db.query('COMMIT');

    // 5. Generate Session JWT with identity context
    const token = jwt.sign({ id: userId, shopId, role: 'shop_owner', roleId }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Workshop successfully provisioned',
      token,
      data: {
        userId,
        shopId,
        shopName,
        ownerName,
        phone,
        role: 'shop_owner'
      }
    });

  } catch (error) {
    if (db) await db.query('ROLLBACK');
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, error: 'Server error during shop provisioning' });
  }
};

// @desc    Login for all identities (Owner, Admin, Tech)
exports.login = async (req, res) => {
  const { phone, password } = req.body;

  try {
    // We use LEFT JOIN to allow global admins (who might have no shop_id) to log in
    const userResult = await db.query(
      'SELECT u.*, s.name as shop_name, s.owner_name, s.currency as shop_currency FROM users u LEFT JOIN shops s ON u.shop_id = s.id WHERE u.phone = $1',
      [phone]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Access denied' });
    }

    const user = userResult.rows[0];

    // Password Verification
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Access denied' });
    }
    
    // Generate JWT Token with full identity context
    const token = jwt.sign(
      { id: user.id, shopId: user.shop_id, role: user.role, roleId: user.role_id }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Access granted',
      token,
      data: {
        userId: user.id,
        shopId: user.shop_id,
        shopName: user.shop_name || 'Global Systems',
        shopCurrency: user.shop_currency || 'INR',
        roleId: user.role_id,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login Handshake Error:', error);
    res.status(500).json({ success: false, error: 'Platform connectivity error' });
  }
};
