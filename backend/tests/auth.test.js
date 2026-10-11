const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
process.env.JWT_SECRET = 'test-only-secret-not-for-deployment';
process.env.FRONTEND_URL = 'https://example.test';
const { normalizePhone, passwordError } = require('../src/utils/auth-validation');
const version = require('../src/utils/session-version');
let queries, handler, released, mail;
const client = { query: async (sql, args) => { queries.push({ sql, args, client: true }); return handler(sql, args); }, release: () => { released = true; } };
const db = { query: async (sql, args) => { queries.push({ sql, args, client: false }); return handler(sql, args); }, pool: { connect: async () => client } };
require.cache[require.resolve('../src/config/db')] = { exports: db };
require.cache[require.resolve('../src/config/mailer')] = { exports: async (message) => { mail = message; return true; } };
const auth = require('../src/controllers/auth/auth.controller');
const { authenticate } = require('../src/middleware/auth.middleware');
const password = 'a long workshop passphrase';
const hash = bcrypt.hashSync(password, 4);
const user = { id: 1, phone: '+919876543210', password_hash: hash, role: 'shop_owner', role_id: 2, shop_id: 3, status: 'active' };
const body = { shopName: ' Workshop ', ownerName: ' Owner ', location: ' Kochi ', phone: '+91 98765 43210', email: ' Owner@Example.COM ', password, country: 'IN', currency: 'INR' };
function response() { return { code: 200, status(code) { this.code = code; return this; }, json(value) { this.body = value; return this; } }; }
beforeEach(() => { queries = []; released = false; mail = null; handler = async () => ({ rows: [] }); });

test('phone formats normalize; malformed and duplicate prefixes are rejected', () => {
  for (const value of ['+919876543210', '+91 (98765) 43210', '00919876543210', '919876543210']) assert.equal(normalizePhone(value), '+919876543210');
  assert.equal(normalizePhone('020 7946 0018', 'GB'), '+442079460018');
  for (const value of [null, {}, 123, '', '+91', '+91+919876543210', '+919876543210 ext 2', 'call +919876543210']) assert.equal(normalizePhone(value), null);
});
test('password policy counts UTF-8 bytes and permits spaces', () => {
  assert.equal(passwordError(password), null);
  assert.ok(passwordError('short'));
  assert.ok(passwordError(String.fromCodePoint(0x1f600).repeat(19)));
  assert.equal(passwordError('a'.repeat(72)), null);
});
test('invalid registration never queries the database', async () => {
  const res = response(); await auth.registerShop({ body: { ...body, phone: '+91+919876543210', password: 'short' } }, res);
  assert.equal(res.code, 400); assert.ok(res.body.fields.phone); assert.ok(res.body.fields.password); assert.equal(queries.length, 0);
});
test('registration stores canonical identity and commits on one checked-out client', async () => {
  handler = async (sql) => ({ rows: sql.includes('FROM roles') ? [{ id: 2 }] : sql.startsWith('INSERT INTO shops') ? [{ id: 3 }] : sql.startsWith('INSERT INTO users') ? [{ id: 1 }] : [] });
  const res = response(); await auth.registerShop({ body }, res);
  assert.equal(res.code, 201); assert.equal(res.body.data.phone, '+919876543210');
  const inserted = queries.find(q => q.sql.startsWith('INSERT INTO users'));
  assert.equal(inserted.args[2], '+919876543210'); assert.equal(inserted.args[3], 'owner@example.com');
  assert.ok(queries.every(q => q.client)); assert.equal(queries.at(-1).sql, 'COMMIT'); assert.ok(released);
  assert.equal(jwt.verify(res.body.token, process.env.JWT_SECRET).ver, version(inserted.args[4]));
});
test('failure after shop insertion rolls back and releases the client', async () => {
  handler = async (sql) => { if (sql.startsWith('INSERT INTO users')) throw Object.assign(new Error('duplicate'), { code: '23505' }); return { rows: sql.includes('FROM roles') ? [{ id: 2 }] : sql.startsWith('INSERT INTO shops') ? [{ id: 3 }] : [] }; };
  const res = response(); await auth.registerShop({ body }, res);
  assert.equal(res.code, 409); assert.equal(queries.at(-1).sql, 'ROLLBACK'); assert.ok(released); assert.ok(!queries.some(q => q.sql === 'COMMIT'));
});
test('existing identity returns conflict and does not create another shop', async () => {
  handler = async (sql) => ({ rows: sql.includes('FROM users') ? [{ id: 1 }] : [] });
  const res = response(); await auth.registerShop({ body }, res);
  assert.equal(res.code, 409); assert.ok(!queries.some(q => q.sql.startsWith('INSERT'))); assert.ok(released);
});
test('valid login issues a versioned session and normalizes displayed phone', async () => {
  handler = async () => ({ rows: [{ ...user, phone: '+91+919876543210' }] });
  const res = response(); await auth.login({ body: { phone: '+91 98765 43210', password } }, res);
  assert.equal(res.code, 200); assert.equal(res.body.data.phone, '+919876543210'); assert.ok(res.body.token); assert.equal(queries.length, 1);
});
test('wrong password, unknown, disabled, deleted, and ambiguous accounts have the same failure', async () => {
  let message;
  for (const rows of [[], [user], [{ ...user, status: 'Inactive' }], [{ ...user, deleted_at: 'yesterday' }], [{ ...user, shop_status: 'Inactive' }], [user, user]]) {
    handler = async () => ({ rows });
    const res = response(); await auth.login({ body: { phone: user.phone, password: rows.length === 1 && rows[0] === user ? 'wrong' : password } }, res);
    assert.equal(res.code, 401); message ??= res.body.error; assert.equal(res.body.error, message);
  }
});
test('legacy weak passwords can still log in', async () => {
  handler = async () => ({ rows: [{ ...user, password_hash: bcrypt.hashSync('old123', 4) }] });
  const res = response(); await auth.login({ body: { phone: user.phone, password: 'old123' } }, res); assert.equal(res.code, 200);
});
test('password reset stores a digest, not the emailed secret, and uses a generic response', async () => {
  handler = async (sql) => ({ rows: sql.startsWith('SELECT') ? [user] : [] });
  const res = response(); await auth.forgotPassword({ body: { email: body.email } }, res);
  assert.equal(res.code, 200); assert.ok(mail);
  const resetUrl = new URL(mail.text.split(' ').at(-1));
  const token = resetUrl.searchParams.get('token');
  const stored = queries.find(q => q.sql.startsWith('UPDATE')).args[0];
  assert.notEqual(token, stored); assert.equal(crypto.createHash('sha256').update(token).digest('hex'), stored);
  handler = async () => ({ rows: [] }); const unknown = response(); await auth.forgotPassword({ body: { email: 'missing@example.com' } }, unknown);
  assert.deepEqual(unknown.body, res.body);
});
test('reset consumes the token in the same conditional update as changing password', async () => {
  handler = async () => ({ rows: [{ id: 1 }] });
  const res = response(); await auth.resetPassword({ body: { email: 'owner@example.com', token: 'a'.repeat(64), newPassword: password } }, res);
  assert.equal(res.code, 200); assert.equal(queries.length, 1); assert.match(queries[0].sql, /reset_password_expires > NOW/); assert.match(queries[0].sql, /reset_password_token = NULL/);
  handler = async () => ({ rows: [] }); const reused = response(); await auth.resetPassword({ body: { email: 'owner@example.com', token: 'a'.repeat(64), newPassword: password } }, reused); assert.equal(reused.code, 400);
});
test('middleware rejects old sessions after password change and reads current role', async () => {
  handler = async () => ({ rows: [user] });
  for (const ver of [undefined, version('old-password-hash')]) {
    const token = jwt.sign({ id: 1, ver }, process.env.JWT_SECRET);
    const res = response(); await authenticate({ headers: { authorization: 'Bearer ' + token } }, res, () => assert.fail('must reject')); assert.equal(res.code, 401);
  }
  const token = jwt.sign({ id: 1, role: 'super-admin', ver: version(hash) }, process.env.JWT_SECRET);
  const req = { headers: { authorization: 'Bearer ' + token } }; let passed = false;
  await authenticate(req, response(), () => { passed = true; }); assert.ok(passed); assert.equal(req.user.role, 'shop_owner');
});
test('middleware treats a database outage as retryable instead of logging users out', async () => {
  handler = async () => { throw new Error('database unavailable'); };
  const token = jwt.sign({ id: 1, ver: version(hash) }, process.env.JWT_SECRET);
  const res = response(); await authenticate({ headers: { authorization: 'Bearer ' + token } }, res, () => assert.fail('must reject')); assert.equal(res.code, 503);
});
