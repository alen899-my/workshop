const jwt = require('jsonwebtoken');
const db = require('../config/db');
const sessionVersion = require('../utils/session-version');
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined in environment variables');

/**
 * Authentication Middleware: Resolves JWT into req.user
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: "No authentication token provided" });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (!decoded || typeof decoded !== 'object' || !Number.isInteger(decoded.id)) {
      return res.status(401).json({ success: false, error: 'Please log in again' });
    }
    const result = await db.query("SELECT u.*, s.name AS shop_name, s.owner_name, s.currency AS shop_currency, s.country AS shop_country, to_jsonb(s)->>'deleted_at' AS shop_deleted_at, to_jsonb(s)->>'status' AS shop_status FROM users u LEFT JOIN shops s ON u.shop_id = s.id WHERE u.id = $1", [decoded.id]);
    const user = result.rows[0];
    if (!user || user.deleted_at || (user.status && user.status.toLowerCase() !== 'active') || user.shop_deleted_at || (user.shop_status && user.shop_status.toLowerCase() !== 'active') || decoded.ver !== sessionVersion(user.password_hash)) {
      return res.status(401).json({ success: false, error: 'Session expired. Please log in again' });
    }
    req.authUser = user;
    // Resolve current roles and shop membership rather than trusting stale JWT claims.
    req.user = { id: user.id, shopId: user.shop_id, role: user.role, roleId: user.role_id };
    next();
  } catch (err) {
    if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(err.name)) {
      return res.status(401).json({ success: false, error: 'Session expired. Please log in again' });
    }
    res.status(503).json({ success: false, error: 'Unable to verify your session. Please try again.' });
  }
};

module.exports = { authenticate };
