const db = require('../../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { isSupportedCountry } = require('libphonenumber-js/max');
const { normalizePhone, normalizeEmail, passwordError, PHONE_DIGITS_SQL } = require('../../utils/auth-validation');
const JWT_SECRET = process.env.JWT_SECRET;
const sessionVersion = require('../../utils/session-version');
const INVALID_LOGIN = 'Phone number or password is incorrect';
const dummyHash = bcrypt.hashSync('not-a-real-account-password', 10);

function session(user) {
  return {
    token: jwt.sign({ id: user.id, shopId: user.shop_id, role: user.role, roleId: user.role_id, ver: sessionVersion(user.password_hash) }, JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' }),
    data: {
      userId: user.id, shopId: user.shop_id, shopName: user.shop_name || 'Global Systems',
      ownerName: user.owner_name || user.name, phone: user.phone, email: user.email,
      role: user.role, roleId: user.role_id, profile_image: user.profile_image,
      shopCountry: user.shop_country === 'India' ? 'IN' : (user.shop_country || 'IN'),
      shopCurrency: user.shop_currency || 'INR',
    },
  };
}

exports.registerShop = async (req, res) => {
  const body = req.body || {};
  const shopName = typeof body.shopName === 'string' ? body.shopName.trim() : '';
  const ownerName = typeof body.ownerName === 'string' ? body.ownerName.trim() : '';
  const location = typeof body.location === 'string' ? body.location.trim() : '';
  const country = typeof body.country === 'string' ? body.country.toUpperCase() : 'IN';
  const currency = typeof body.currency === 'string' ? body.currency.toUpperCase() : 'INR';
  const phone = normalizePhone(body.phone, body.phoneCountry);
  const email = normalizeEmail(body.email);
  const fields = {};
  if (!shopName || shopName.length > 255) fields.shopName = 'Enter a shop name (up to 255 characters)';
  if (!ownerName || ownerName.length > 100) fields.ownerName = 'Enter an owner name (up to 100 characters)';
  if (!location || location.length > 255) fields.location = 'Enter a location (up to 255 characters)';
  if (!isSupportedCountry(country)) fields.country = 'Select a valid country';
  if (!/^[A-Z]{3}$/.test(currency)) fields.currency = 'Select a valid currency';
  if (!phone) fields.phone = 'Enter a valid phone number with country code';
  if (!email) fields.email = 'Enter a valid email address';
  const passwordIssue = passwordError(body.password);
  if (passwordIssue) fields.password = passwordIssue;
  for (const [field, limit] of [['latitude', 90], ['longitude', 180]]) {
    if (body[field] != null && (typeof body[field] !== 'number' || !Number.isFinite(body[field]) || Math.abs(body[field]) > limit)) fields.location = 'Invalid location coordinates';
  }
  if (Object.keys(fields).length) return res.status(400).json({ success: false, error: 'Please check your details', fields });

  let client;
  let inTransaction = false;
  try {
    const passwordHash = await bcrypt.hash(body.password, 10);
    client = await db.pool.connect();
    await client.query('BEGIN');
    inTransaction = true;
    // Serialize registrations for the same identity, including legacy formats.
    for (const identity of [phone, email].sort()) await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [identity]);
    const existing = await client.query('SELECT id FROM users WHERE ' + PHONE_DIGITS_SQL + ' = $1 OR lower(email) = $2 LIMIT 1', [phone.slice(1), email]);
    if (existing.rows.length) {
      await client.query('ROLLBACK');
      inTransaction = false;
      return res.status(409).json({ success: false, error: 'An account with these details already exists. Log in or reset your password.' });
    }
    const role = await client.query("SELECT id FROM roles WHERE slug = 'shop_owner'");
    if (!role.rows[0]) throw new Error('Owner role is not configured');
    const roleId = role.rows[0].id;
    const shop = await client.query(
      'INSERT INTO shops (name, location, owner_name, phone, country, currency, latitude, longitude, place_id, state, city, address) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id',
      [shopName, location, ownerName, phone, country, currency, body.latitude ?? null, body.longitude ?? null, body.place_id ?? null, body.state ?? null, body.city ?? null, body.address ?? null],
    );
    const shopId = shop.rows[0].id;
    const result = await client.query(
      'INSERT INTO users (shop_id, name, phone, email, password_hash, role, role_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      [shopId, ownerName, phone, email, passwordHash, 'shop_owner', roleId],
    );
    // Sign before commit so a configuration failure cannot create a ghost account.
    const auth = session({ id: result.rows[0].id, shop_id: shopId, role: 'shop_owner', role_id: roleId, name: ownerName, phone, email, password_hash: passwordHash, shop_name: shopName, shop_country: country, shop_currency: currency });
    await client.query('COMMIT');
    inTransaction = false;
    return res.status(201).json({ success: true, message: 'Account created', ...auth });
  } catch (error) {
    if (inTransaction) await client.query('ROLLBACK').catch(() => {});
    if (error.code === '23505') return res.status(409).json({ success: false, error: 'An account with these details already exists. Log in or reset your password.' });
    console.error('Registration failed:', error.code || 'internal');
    return res.status(500).json({ success: false, error: 'Unable to create your account. Please try again.' });
  } finally {
    client?.release();
  }
};

exports.login = async (req, res) => {
  const { phone: rawPhone, password, phoneCountry } = req.body || {};
  const phone = normalizePhone(rawPhone, phoneCountry);
  if (!phone || typeof password !== 'string' || !password || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ success: false, error: 'Enter a valid phone number and password' });
  }
  try {
    const result = await db.query(
      "SELECT u.*, s.name AS shop_name, s.owner_name, s.currency AS shop_currency, s.country AS shop_country, to_jsonb(s)->>'deleted_at' AS shop_deleted_at, to_jsonb(s)->>'status' AS shop_status FROM users u LEFT JOIN shops s ON u.shop_id = s.id WHERE " + PHONE_DIGITS_SQL.replaceAll('phone', 'u.phone') + ' = $1 LIMIT 2',
      [phone.slice(1)],
    );
    const user = result.rows.length === 1 ? result.rows[0] : null;
    const match = await bcrypt.compare(password, user?.password_hash || dummyHash);
    const active = user && !user.deleted_at && (!user.status || user.status.toLowerCase() === 'active') && !user.shop_deleted_at && (!user.shop_status || user.shop_status.toLowerCase() === 'active');
    if (!match || !active) return res.status(401).json({ success: false, error: INVALID_LOGIN });
    return res.json({ success: true, ...session({ ...user, phone }) });
  } catch (error) {
    console.error('Login failed:', error.code || 'internal');
    return res.status(500).json({ success: false, error: 'Unable to log in. Please try again.' });
  }
};

const crypto = require('crypto');
exports.getSession = (req, res) => res.json({ success: true, data: session(req.authUser).data });
const sendEmail = require('../../config/mailer');
const RESET_MESSAGE = 'If an account uses that email, a password reset link will be sent.';

exports.forgotPassword = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!email) return res.status(400).json({ success: false, error: 'Enter a valid email address' });
  try {
    const result = await db.query('SELECT id, status, deleted_at FROM users WHERE lower(email) = $1 LIMIT 2', [email]);
    const user = result.rows.length === 1 ? result.rows[0] : null;
    if (user && !user.deleted_at && (!user.status || user.status.toLowerCase() === 'active')) {
      const token = crypto.randomBytes(32).toString('hex');
      const hash = crypto.createHash('sha256').update(token).digest('hex');
      await db.query('UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3', [hash, new Date(Date.now() + 3600000), user.id]);
      const base = process.env.FRONTEND_URL;
      if (!base) throw new Error('Password reset URL not configured');
      const url = new URL('/reset-password', base);
      url.searchParams.set('token', token);
      url.searchParams.set('email', email);
      const sent = await sendEmail({ to: email, subject: 'Reset your Repairo password', text: 'Reset your password using this link within one hour: ' + url.toString() });
      if (!sent) console.error('Password reset delivery failed');
    }
    return res.json({ success: true, message: RESET_MESSAGE });
  } catch {
    // Do not expose account existence or mail delivery status.
    console.error('Password reset request failed');
    return res.json({ success: true, message: RESET_MESSAGE });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body || {};
  const email = normalizeEmail(req.body?.email);
  if (!email || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return res.status(400).json({ success: false, error: 'Invalid or expired reset link' });
  const issue = passwordError(newPassword);
  if (issue) return res.status(400).json({ success: false, error: issue });
  try {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    // Conditional update makes a reset token single-use, even under concurrency.
    const result = await db.query(
      "UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE lower(email) = $2 AND reset_password_token = $3 AND reset_password_expires > NOW() AND deleted_at IS NULL AND lower(status) = 'active' RETURNING id",
      [passwordHash, email, hash],
    );
    if (result.rows.length !== 1) return res.status(400).json({ success: false, error: 'Invalid or expired reset link' });
    return res.json({ success: true, message: 'Password updated. You can now log in.' });
  } catch {
    return res.status(500).json({ success: false, error: 'Unable to reset password. Please try again.' });
  }
};
