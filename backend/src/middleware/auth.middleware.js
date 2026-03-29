const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined in environment variables');

/**
 * Authentication Middleware: Resolves JWT into req.user
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: "No authentication token provided" });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Standardizing on: { id, shopId, role, roleId }
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT Verification Fail:", err.message);
    res.status(401).json({ success: false, error: "Invalid or expired security token" });
  }
};

module.exports = { authenticate };
