const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');

// Isolated PostgreSQL-compatible database: no .env, sockets, or production data.
const pg = new PGlite();
const query = (sql, params) => pg.query(sql, params);
require.cache[require.resolve('../src/config/db')] = {
  exports: { query, pool: { connect: async () => ({ query, release() {} }) } },
};
require.cache[require.resolve('../src/middleware/upload')] = {
  exports: { getFileUrl: () => null, deleteFromR2: async () => {} },
};
const inventory = require('../src/controllers/inventory/inventory.controller');
const billing = require('../src/controllers/bill/bill.controller');
const { number } = require('../src/services/inventory.service');
const user = { id: 1, shopId: 1, role: 'shop-owner' };
async function call(handler, body = {}, params = {}, options = {}) {
  const res = { code: 200, status(code) { this.code = code; return this; }, json(value) { this.body = value; return this; } };
  await handler({ user, body, params, query: {}, ...options }, res);
  return res;
}
const productBody = (sku, stock = 10, shopId = 1) => ({ shop_id: shopId, sku, name: sku, unit: 'piece', category: 'Parts', location: 'Shelf 1', cost_price: 50, selling_price: 100, reorder_level: 2, opening_stock: stock });
const billBody = (product, qty, revision = 0) => ({ inventory_revision: revision, items: [{ product_id: product.id, name: product.name, qty, cost: 100 }], service_charge: 50, tax_snapshot: [], payment_status: 'Unpaid' });
const stock = async id => Number((await query('SELECT stock FROM inventory_products WHERE id=$1', [id])).rows[0].stock);
async function create(sku, opening = 10) {
  const res = await call(inventory.create, productBody(sku, opening));
  assert.equal(res.code, 200, res.body.error);
  return res.body.data;
}

before(async () => {
  await pg.exec(`
    CREATE TABLE shops (id SERIAL PRIMARY KEY, name TEXT, currency TEXT, deleted_at TIMESTAMPTZ);
    CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT);
    CREATE TABLE repairs (id SERIAL PRIMARY KEY, shop_id INTEGER REFERENCES shops(id), deleted_at TIMESTAMPTZ);
    CREATE TABLE permissions (id SERIAL PRIMARY KEY, module_name TEXT, permission_name TEXT, slug TEXT UNIQUE, description TEXT);
    CREATE TABLE role_permissions (role_id INTEGER, permission_id INTEGER REFERENCES permissions(id), PRIMARY KEY(role_id, permission_id));
    CREATE TABLE tax_settings (id SERIAL PRIMARY KEY, shop_id INTEGER, name TEXT, rate NUMERIC, is_inclusive BOOLEAN, is_active BOOLEAN, applies_to TEXT, deleted_at TIMESTAMPTZ);
    CREATE TABLE repair_bills (id SERIAL PRIMARY KEY, repair_id INTEGER UNIQUE REFERENCES repairs(id), items JSONB, service_charge NUMERIC, tax_snapshot JSONB, tax_total NUMERIC, subtotal_before_tax NUMERIC, total_amount NUMERIC, status TEXT, payment_status TEXT, payment_method TEXT, deleted_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW());
    INSERT INTO shops (id,name,currency) VALUES (1,'Workshop A','INR'), (2,'Workshop B','INR');
    INSERT INTO users (id,name) VALUES (1,'Manager');
    INSERT INTO repairs (id,shop_id) VALUES (1,1),(2,1),(3,1),(4,1),(5,1),(6,2),(7,1);
    INSERT INTO permissions (slug) VALUES ('manage:settings'), ('edit:repair');
    INSERT INTO role_permissions VALUES (1,1),(2,2);
  `);
  const migration = fs.readFileSync(path.join(__dirname, '../src/migrations/create_inventory.sql'), 'utf8');
  await pg.exec(migration);
  await pg.exec(migration);
});
after(async () => { await pg.close(); });

test('migration can run twice and grants separate read and management permissions', async () => {
  const { rows } = await query('SELECT role_id, slug FROM role_permissions JOIN permissions ON permission_id=permissions.id WHERE slug LIKE $1 ORDER BY role_id, slug', ['%:inventory']);
  assert.deepEqual(rows, [{ role_id: 1, slug: 'manage:inventory' }, { role_id: 1, slug: 'view:inventory' }, { role_id: 2, slug: 'view:inventory' }]);
});

test('stock receipts are retry-safe and adjustments cannot overdraw', async () => {
  const p = await create('RECEIPT');
  const movement = { shop_id: 1, quantity: 2.5, kind: 'receipt', reason: 'Delivery 42', request_id: 'receipt-42' };
  assert.equal((await call(inventory.adjust, movement, { id: p.id })).code, 200);
  assert.equal((await call(inventory.adjust, movement, { id: p.id })).code, 200);
  assert.equal(await stock(p.id), 12.5);
  assert.equal((await call(inventory.adjust, { ...movement, quantity: 3 }, { id: p.id })).code, 409);
  assert.equal((await call(inventory.adjust, { ...movement, request_id: 'shortage', kind: 'adjustment', quantity: -20 }, { id: p.id })).code, 409);
  assert.equal(await stock(p.id), 12.5);
  const history = await call(inventory.history, {}, { id: p.id }, { query: { shop_id: 1 } });
  assert.equal(history.body.data.length, 2); // opening + one receipt
});

test('bill saves deduct only the quantity difference; stale updates leave stock intact', async () => {
  const p = await create('BILL');
  const first = await call(billing.saveBill, billBody(p, 2), { repairId: 1 });
  assert.equal(first.code, 200, first.body.error);
  assert.equal(Number(first.body.data.total_amount), 250);
  assert.equal(await stock(p.id), 8);
  assert.equal((await call(billing.saveBill, billBody(p, 2), { repairId: 1 })).code, 409);
  const same = await call(billing.saveBill, billBody(p, 2, 1), { repairId: 1 });
  assert.equal(same.code, 200); assert.equal(await stock(p.id), 8);
  const fewer = await call(billing.saveBill, billBody(p, 0.5, 2), { repairId: 1 });
  assert.equal(fewer.code, 200); assert.equal(await stock(p.id), 9.5);
  const removed = await call(billing.saveBill, { ...billBody(p, 1, 3), items: [] }, { repairId: 1 });
  assert.equal(removed.code, 200); assert.equal(await stock(p.id), 10);
});

test('archiving returns stock once and replacement bills issue the full quantity again', async () => {
  const p = await create('ARCHIVE');
  const bill = await call(billing.saveBill, billBody(p, 3), { repairId: 2 });
  assert.equal(bill.code, 200); assert.equal(await stock(p.id), 7);
  assert.equal((await call(billing.deleteBill, {}, { id: bill.body.data.id })).code, 200);
  assert.equal(await stock(p.id), 10);
  assert.equal((await call(billing.deleteBill, {}, { id: bill.body.data.id })).code, 404);
  const empty = await call(billing.getBill, {}, { repairId: 2 });
  assert.deepEqual(empty.body.data.items, []);
  assert.equal(empty.body.data.inventory_revision, 2);
  const replaced = await call(billing.saveBill, billBody(p, 3, 2), { repairId: 2 });
  assert.equal(replaced.code, 200, replaced.body.error); assert.equal(await stock(p.id), 7);
});

test('insufficient second part rolls back earlier stock changes and the bill', async () => {
  const a = await create('ROLLBACK-A'), b = await create('ROLLBACK-B', 1);
  const body = billBody(a, 3); body.items.push({ product_id: b.id, name: b.name, qty: 2, cost: 100 });
  assert.equal((await call(billing.saveBill, body, { repairId: 3 })).code, 409);
  assert.equal(await stock(a.id), 10); assert.equal(await stock(b.id), 1);
  assert.equal((await query('SELECT * FROM repair_bills WHERE repair_id=3')).rows.length, 0);
  assert.equal((await query('SELECT * FROM inventory_movements WHERE repair_id=3')).rows.length, 0);
});

test('shop boundaries, archive restrictions and product versions are enforced', async () => {
  const p = await create('ACCESS');
  assert.equal((await call(inventory.list, {}, {}, { query: { shop_id: 2 } })).code, 403);
  assert.equal((await call(billing.saveBill, billBody(p, 1), { repairId: 6 }, { user: { ...user, role: 'super-admin' } })).code, 403);
  const archived = await call(inventory.update, { ...p, is_active: false }, { id: p.id });
  assert.equal(archived.code, 200);
  assert.equal((await call(inventory.update, { ...p, is_active: true }, { id: p.id })).code, 409);
  assert.equal((await call(billing.saveBill, billBody(p, 1), { repairId: 4 })).code, 400);
  assert.equal(await stock(p.id), 10);
});

test('malformed numbers and bill items return validation errors without changing stock', async () => {
  for (const value of [null, undefined, {}, [], true, ' ', 'abc', Infinity, 0.0001]) assert.throws(() => number(value, 'Quantity'));
  const res = await call(billing.saveBill, { items: [null] }, { repairId: 7 });
  assert.equal(res.code, 400);
});
