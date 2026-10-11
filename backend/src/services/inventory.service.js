const db = require('../config/db');

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function number(value, label, decimals = 3, minimum = 0) {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') fail(label + ' is required');
  const n = Number(value);
  if (!Number.isFinite(n) || n < minimum || n > 999999999 || Math.abs(n * 10 ** decimals - Math.round(n * 10 ** decimals)) > 0.0001) {
    fail(label + ' must be a valid number with up to ' + decimals + ' decimal places');
  }
  return n;
}

function id(value, label = 'ID') { return number(value, label, 0, 1); }
function text(value, label, max, required = false) {
  if (value != null && typeof value !== 'string') fail(label + ' must be text');
  const result = (value || '').trim();
  if ((required && !result) || result.length > max) fail('Enter a valid ' + label.toLowerCase());
  return result;
}
function shopScope(user, requested) {
  const shopId = id(requested || user.shopId, 'Shop');
  if (user.role !== 'super-admin' && shopId !== Number(user.shopId)) fail('Access denied', 403);
  return shopId;
}
async function transaction(run) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const result = await run(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
const roundStock = value => Math.round(value * 1000) / 1000;

// Called with the repair row locked, inside the SAME transaction as the bill write.
// Lock products in ID order to avoid deadlocks across repairs sharing multiple parts.
async function reconcileBillStock(client, repair, previousItems, items, actorId) {
  const quantities = list => {
    const result = new Map();
    for (const item of list) {
      if (item == null || item.product_id == null) continue;
      const productId = id(item.product_id, 'Product');
      const qty = Number(item.qty);
      if (!Number.isFinite(qty) || qty <= 0) fail('Invalid bill quantity for inventory item');
      result.set(productId, roundStock((result.get(productId) || 0) + qty));
    }
    return result;
  };
  const before = quantities(previousItems), after = quantities(items);
  const ids = [...new Set([...before.keys(), ...after.keys()])].sort((a, b) => a - b);
  if (!ids.length) return;
  const { rows } = await client.query('SELECT * FROM inventory_products WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE', [ids]);
  const products = new Map(rows.map(p => [p.id, p]));
  for (const productId of ids) {
    const product = products.get(productId);
    if (!product || Number(product.shop_id) !== Number(repair.shop_id)) fail('Inventory item does not belong to this repair workshop', 403);
    const delta = roundStock((after.get(productId) || 0) - (before.get(productId) || 0));
    if (delta > 0 && !product.is_active) fail(product.name + ' is archived');
    const balance = roundStock(Number(product.stock) - delta);
    if (balance < 0) fail('Insufficient stock for ' + product.name + '. Available: ' + product.stock + ' ' + product.unit, 409);
    for (const item of items.filter(i => Number(i.product_id) === productId)) {
      // Preserve the bill price snapshot, but identify parts from the authoritative catalogue.
      item.name = product.name;
      item.sku = product.sku;
      item.unit = product.unit;
    }
    if (!delta) continue;
    await client.query('UPDATE inventory_products SET stock = $1, version = version + 1, updated_at = NOW() WHERE id = $2', [balance, productId]);
    await client.query('INSERT INTO inventory_movements (shop_id, product_id, repair_id, actor_id, quantity, balance_after, kind, reason) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [repair.shop_id, productId, repair.id, actorId, -delta, balance, delta > 0 ? 'repair_issue' : 'repair_return', 'Repair bill quantity change']);
  }
}

module.exports = { fail, number, id, text, shopScope, transaction, reconcileBillStock, roundStock };
