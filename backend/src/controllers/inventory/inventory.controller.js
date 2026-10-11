const db = require('../../config/db');
const { fail, number, id, text, shopScope, transaction, roundStock } = require('../../services/inventory.service');
const { getFileUrl, deleteFromR2 } = require('../../middleware/upload');

const handle = action => async (req, res) => {
  try { res.json({ success: true, ...await action(req) }); }
  catch (error) {
    console.error('Inventory:', error.message);
    res.status(error.code === '23505' ? 409 : error.status || 500).json({ success: false,
      error: error.code === '23505' ? 'This SKU or stock request already exists in this workshop.' : error.status ? error.message : 'Could not save or load inventory' });
  }
};

exports.shops = handle(async req => {
  const { rows } = await db.query('SELECT id, name, currency FROM shops WHERE deleted_at IS NULL AND ($1::boolean OR id=$2) ORDER BY name', [req.user.role === 'super-admin', req.user.shopId || null]);
  return { data: rows };
});

function fields(body) {
  return [text(body.sku, 'SKU', 80, true).toUpperCase(), text(body.name, 'Name', 160, true),
    text(body.category, 'Category', 80), text(body.unit, 'Unit', 30, true), text(body.location, 'Location', 120),
    number(body.cost_price, 'Cost price', 2), number(body.selling_price, 'Selling price', 2), number(body.reorder_level, 'Reorder level')];
}

// Optional link to a shop tax (parts/all scope only). Validated against the same workshop.
async function taxLink(client, shopId, taxId) {
  if (taxId == null || taxId === '') return null;
  const tax = await client.query(
    "SELECT id FROM tax_settings WHERE id = $1 AND shop_id = $2 AND deleted_at IS NULL AND is_active = TRUE AND applies_to IN ('parts', 'all')",
    [id(taxId, 'Tax'), shopId]);
  if (!tax.rows.length) fail('Selected tax is not available for this workshop', 400);
  return tax.rows[0].id;
}

exports.list = handle(async req => {
  const shopId = shopScope(req.user, req.query.shop_id);
  const limit = Math.min(100, id(req.query.limit || 50, 'Limit'));
  const offset = number(req.query.offset || 0, 'Offset', 0);
  const search = text(req.query.search, 'Search', 160);
  const active = req.query.archived !== 'true';
  const low = req.query.low_stock === 'true';
  const result = await db.query('SELECT p.*, t.name AS tax_name, t.rate AS tax_rate, t.is_inclusive AS tax_inclusive, COUNT(*) OVER() AS total_count FROM inventory_products p LEFT JOIN tax_settings t ON t.id = p.tax_id WHERE p.shop_id = $1 AND p.is_active = $2 AND (p.name ILIKE $3 OR p.sku ILIKE $3 OR p.category ILIKE $3) AND ($4::boolean = FALSE OR p.stock <= p.reorder_level) ORDER BY p.name, p.id LIMIT $5 OFFSET $6',
    [shopId, active, '%' + search + '%', low, limit, offset]);
  return { data: result.rows, has_more: offset + result.rows.length < Number(result.rows[0]?.total_count || 0) };
});

exports.create = handle(req => transaction(async client => {
  const shopId = shopScope(req.user, req.body.shop_id);
  const stock = number(req.body.opening_stock ?? 0, 'Opening stock');
  const values = fields(req.body);
  const shop = await client.query('SELECT id FROM shops WHERE id = $1 AND deleted_at IS NULL', [shopId]);
  if (!shop.rows.length) fail('Workshop not found', 404);
  const taxId = await taxLink(client, shopId, req.body.tax_id);
  const { rows } = await client.query('INSERT INTO inventory_products (shop_id, sku, name, category, unit, location, cost_price, selling_price, reorder_level, stock, tax_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *', [shopId, ...values, stock, taxId]);
  if (stock) await client.query('INSERT INTO inventory_movements (shop_id, product_id, actor_id, quantity, balance_after, kind, reason) VALUES ($1,$2,$3,$4,$4,$5,$6)',
    [shopId, rows[0].id, req.user.id, stock, 'opening', 'Opening balance']);
  return { data: rows[0] };
}));

exports.update = handle(req => transaction(async client => {
  const productId = id(req.params.id), shopId = shopScope(req.user, req.body.shop_id);
  const values = fields(req.body);
  if (typeof req.body.is_active !== 'boolean') fail('Product active status is required');
  const current = await client.query('SELECT * FROM inventory_products WHERE id = $1 AND shop_id = $2 FOR UPDATE', [productId, shopId]);
  if (!current.rows.length) fail('Product not found', 404);
  if (Number(current.rows[0].version) !== id(req.body.version, 'Version')) fail('Product changed. Refresh before editing.', 409);
  // Changing units with stock/history would change the meaning of every existing movement.
  if (values[3] !== current.rows[0].unit) fail('Stock unit cannot be changed. Create a separate product for a different unit.');
  const taxId = await taxLink(client, shopId, req.body.tax_id);
  const { rows } = await client.query('UPDATE inventory_products SET sku=$1, name=$2, category=$3, unit=$4, location=$5, cost_price=$6, selling_price=$7, reorder_level=$8, tax_id=$9, is_active=$10, version=version+1, updated_at=NOW() WHERE id=$11 RETURNING *',
    [...values, taxId, req.body.is_active, productId]);
  return { data: rows[0] };
}));

exports.adjust = handle(req => transaction(async client => {
  const productId = id(req.params.id), shopId = shopScope(req.user, req.body.shop_id);
  const quantity = number(req.body.quantity, 'Quantity', 3, -999999999);
  const kind = req.body.kind;
  if (!quantity || !['receipt', 'adjustment'].includes(kind) || (kind === 'receipt' && quantity <= 0)) fail('Enter a valid stock movement');
  const reason = text(req.body.reason, 'Reason', 300, true);
  const requestId = text(req.body.request_id, 'Request ID', 100, true);
  const { rows } = await client.query('SELECT * FROM inventory_products WHERE id=$1 AND shop_id=$2 FOR UPDATE', [productId, shopId]);
  if (!rows.length) fail('Product not found', 404);
  const prior = await client.query('SELECT * FROM inventory_movements WHERE shop_id=$1 AND request_id=$2', [shopId, requestId]);
  if (prior.rows.length) {
    const previous = prior.rows[0];
    if (previous.product_id !== productId || Number(previous.quantity) !== quantity || previous.kind !== kind || previous.reason !== reason) fail('Request ID was already used for a different stock change', 409);
    return { data: rows[0] };
  }
  if (!rows[0].is_active) fail('Restore the product before adjusting stock');
  const balance = roundStock(Number(rows[0].stock) + quantity);
  if (balance < 0) fail('This adjustment would make stock negative', 409);
  const updated = await client.query('UPDATE inventory_products SET stock=$1, version=version+1, updated_at=NOW() WHERE id=$2 RETURNING *', [balance, productId]);
  await client.query('INSERT INTO inventory_movements (shop_id, product_id, actor_id, quantity, balance_after, kind, reason, request_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [shopId, productId, req.user.id, quantity, balance, kind, reason, requestId]);
  return { data: updated.rows[0] };
}));

exports.history = handle(async req => {
  const shopId = shopScope(req.user, req.query.shop_id), productId = id(req.params.id);
  const before = req.query.before ? id(req.query.before) : Number.MAX_SAFE_INTEGER;
  const { rows } = await db.query('SELECT m.*, u.name AS actor_name FROM inventory_movements m LEFT JOIN users u ON u.id=m.actor_id WHERE m.shop_id=$1 AND m.product_id=$2 AND m.id < $3 ORDER BY m.id DESC LIMIT 51', [shopId, productId, before]);
  return { data: rows.slice(0, 50), has_more: rows.length > 50 };
});

exports.image = handle(req => transaction(async client => {
  const productId = id(req.params.id), shopId = shopScope(req.user, req.body.shop_id);
  const { rows } = await client.query('SELECT * FROM inventory_products WHERE id=$1 AND shop_id=$2 FOR UPDATE', [productId, shopId]);
  if (!rows.length) fail('Product not found', 404);
  let imageUrl = rows[0].image_url || null;
  if (req.file) {
    if (imageUrl) await deleteFromR2(imageUrl);
    imageUrl = getFileUrl(req.file);
    if (!imageUrl) fail('Image upload failed');
  } else if (String(req.body.remove || '').toLowerCase() === 'true') {
    if (imageUrl) await deleteFromR2(imageUrl);
    imageUrl = null;
  } else {
    fail('Choose an image to upload');
  }
  const updated = await client.query('UPDATE inventory_products SET image_url=$1, version=version+1, updated_at=NOW() WHERE id=$2 RETURNING *', [imageUrl, productId]);
  return { data: updated.rows[0] };
}));
