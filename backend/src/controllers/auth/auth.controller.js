const db = require('../../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// @desc    Register a new workshop (The "Triple-Handshake" Flow)
exports.registerShop = async (req, res) => {
  const { 
    shopName, location, ownerName, phone, email, password, 
    country, currency, latitude, longitude, place_id,
    state, city, address
  } = req.body;

  try {
    // 1. Validate if user phone or email already exists
    const userCheck = await db.query('SELECT * FROM users WHERE phone = $1 OR email = $2', [phone, email || '']);
    if (userCheck.rows.length > 0) return res.status(400).json({ success: false, error: 'Phone or Email already registered' });

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
      'INSERT INTO users (shop_id, name, phone, email, password_hash, role, role_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [shopId, ownerName, phone, email, passwordHash, 'shop_owner', roleId]
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

const crypto = require('crypto');
const sendEmail = require('../../config/mailer');

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

  try {
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User with this email not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await db.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3',
      [resetToken, resetExpires, email]
    );

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${email}`;
    const message = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap');
          body { font-family: 'Google Sans', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; line-height: 1.6; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 1px solid #eff2f1; }
          .logo { font-size: 28px; font-weight: 700; color: #3d7a78; text-transform: uppercase; letter-spacing: 2px; margin: 0; }
          .content { padding: 40px 30px; color: #333333; }
          h1 { font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 20px; color: #1a1f1e; }
          p { font-size: 15px; color: #555555; margin-bottom: 24px; }
          .button-wrap { text-align: center; margin: 35px 0; }
          .button { display: inline-block; padding: 14px 28px; background-color: #3d7a78; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(61, 122, 120, 0.2); }
          .footer { background-color: #f9fbfb; padding: 25px 30px; text-align: center; border-top: 1px solid #eff2f1; }
          .footer p { font-size: 13px; color: #888888; margin: 0; }
          .link-fallback { font-size: 13px; color: #888888; word-break: break-all; margin-top: 30px; padding: 15px; background: #f4f7f6; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 class="logo">REPAIRO</h2>
          </div>
          <div class="content">
            <h1>Reset your password</h1>
            <p>We received a request to reset the password for your Repairo account associated with this email address.</p>
            <p>If you made this request, you can reset your password immediately by clicking the button below:</p>
            
            <div class="button-wrap">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>This link will expire in exactly 1 hour for security reasons.</p>
            
         
          </div>
          <div class="footer">
            <p>If you didn't request a password reset, you can safely ignore this email. Your account remains secure.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailSent = await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: message,
    });

    if (!emailSent) {
      return res.status(500).json({ success: false, error: 'Email could not be sent' });
    }

    res.status(200).json({ success: true, message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ success: false, error: 'Server error during password reset' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, email, newPassword } = req.body;
  if (!token || !email || !newPassword) {
    return res.status(400).json({ success: false, error: 'Missing required parameters' });
  }

  try {
    const userResult = await db.query(
      'SELECT * FROM users WHERE email = $1 AND reset_password_token = $2 AND reset_password_expires > NOW()',
      [email, token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await db.query(
      'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE email = $2',
      [passwordHash, email]
    );

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ success: false, error: 'Server error during password reset' });
  }
};
