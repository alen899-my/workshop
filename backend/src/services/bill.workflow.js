const { fail, number, id, text, reconcileBillStock } = require('./inventory.service');
const { calculateBill } = require('./billing-calculation');

const list = value => typeof value === 'string' ? JSON.parse(value) : (value || []);
function checkScope(repair, user) {
  if (!repair || repair.deleted_at) fail('Repair not found', 404);
  if (user.role !== 'super-admin' && Number(repair.shop_id) !== Number(user.shopId)) fail('Access denied', 403);
}
async function lockRepair(client, repairId, user) {
  const repair = (await client.query('SELECT * FROM repairs WHERE id=$1 FOR UPDATE', [id(repairId, 'Repair')])).rows[0];
  checkScope(repair, user);
  return repair;
}
function payment(body, existing) {
  const status = body.payment_status ?? existing?.payment_status ?? 'Unpaid';
  if (!['Paid', 'Unpaid', 'Partial'].includes(status)) fail('Choose a valid payment status');
  const method = text(body.payment_method === undefined ? existing?.payment_method : body.payment_method, 'Payment method', 50) || null;
  return { status, method: status === 'Unpaid' ? null : method };
}

// Caller holds the repair lock. Every bill mutation uses repair -> bill -> product order.
async function saveBill(client, repair, body, user) {
  const existing = (await client.query('SELECT * FROM repair_bills WHERE repair_id=$1 FOR UPDATE', [repair.id])).rows[0];
  const revision = Number(existing?.inventory_revision || 0);
  if (number(body.inventory_revision ?? 0, 'Bill version', 0) !== revision) fail('This bill changed. Reload billing before saving.', 409);
  if (!Array.isArray(body.items) || body.items.length > 500) fail('Enter up to 500 bill items');
  const items = body.items.map(item => {
    if (!item || typeof item !== 'object') fail('Invalid bill item');
    return {
      ...(item.id != null ? { id: text(String(item.id), 'Item ID', 100) } : {}),
      name: text(item.name, 'Item name', 200, true), qty: number(item.qty, 'Quantity', 3, 0.001), cost: number(item.cost, 'Unit price', 2),
      ...(item.product_id != null ? { product_id: id(item.product_id, 'Product') } : {}),
    };
  });
  const service = number(body.service_charge ?? 0, 'Labour charge', 2);
  const requested = body.tax_snapshot ?? [];
  if (!Array.isArray(requested) || requested.length > 50) fail('Invalid taxes');
  const ids = requested.map(tax => id(tax?.id, 'Tax'));
  if (new Set(ids).size !== ids.length) fail('A tax can only be applied once');
  const priorTaxes = existing && !existing.deleted_at ? list(existing.tax_snapshot) : [];
  const masters = ids.length ? (await client.query('SELECT * FROM tax_settings WHERE id = ANY($1::int[]) AND shop_id=$2', [ids, repair.shop_id])).rows : [];
  const taxes = ids.map(taxId => {
    const prior = priorTaxes.find(t => Number(t.id) === taxId);
    const master = masters.find(t => Number(t.id) === taxId && t.is_active && !t.deleted_at);
    const source = prior || master;
    if (!source) fail('A selected tax is unavailable for this workshop');
    const rate = number(source.rate, 'Tax rate', 4);
    if (rate > 100 || !['parts', 'service', 'all'].includes(source.applies_to)) fail('Invalid tax configuration');
    return { id: taxId, name: source.name, rate, applies_to: source.applies_to, is_inclusive: !!source.is_inclusive };
  });
  const totals = calculateBill(items, service, taxes);
  if (!Number.isFinite(totals.total) || totals.total > 999999999) fail('Bill total exceeds the supported limit');
  const paid = payment(body, existing && !existing.deleted_at ? existing : null);
  // Archived bills already returned stock. Restoring must issue it again.
  const previous = existing && !existing.deleted_at ? list(existing.items) : [];
  await reconcileBillStock(client, repair, previous, items, user.id);
  const result = await client.query(
    `INSERT INTO repair_bills (repair_id,items,service_charge,tax_snapshot,tax_total,subtotal_before_tax,total_amount,status,payment_status,payment_method,inventory_revision)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'Active',$8,$9,$10)
     ON CONFLICT (repair_id) DO UPDATE SET items=EXCLUDED.items,service_charge=EXCLUDED.service_charge,tax_snapshot=EXCLUDED.tax_snapshot,tax_total=EXCLUDED.tax_total,subtotal_before_tax=EXCLUDED.subtotal_before_tax,total_amount=EXCLUDED.total_amount,status='Active',payment_status=EXCLUDED.payment_status,payment_method=EXCLUDED.payment_method,inventory_revision=EXCLUDED.inventory_revision,deleted_at=NULL,updated_at=NOW() RETURNING *`,
    [repair.id, JSON.stringify(items), service, JSON.stringify(totals.taxes), totals.taxTotal, totals.subtotal, totals.total, paid.status, paid.method, revision + 1],
  );
  return result.rows[0];
}

async function archiveBill(client, repair, bill, user) {
  if (!bill || bill.deleted_at) return;
  if (bill.payment_status === 'Paid' || bill.payment_status === 'Partial') fail('A paid or partially paid bill cannot be deleted. Correct its payment status first.', 409);
  await reconcileBillStock(client, repair, list(bill.items), [], user.id);
  await client.query("UPDATE repair_bills SET deleted_at=NOW(),status='Inactive',inventory_revision=inventory_revision+1,updated_at=NOW() WHERE id=$1", [bill.id]);
}
module.exports = { saveBill, archiveBill, lockRepair, checkScope, payment, list };
