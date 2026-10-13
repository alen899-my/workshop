const db = require('../../config/db');
const { transaction, reconcileBillStock, fail, number, id, text } = require('../../services/inventory.service');

// @desc    Get bill for a repair
exports.getBill = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';
  const repairId = req.params.repairId;

  try {
    // Check repair access
    const repairRes = await db.query('SELECT shop_id FROM repairs WHERE id = $1 AND deleted_at IS NULL', [repairId]);
    if (repairRes.rows.length === 0) return res.status(404).json({ success: false, error: 'Repair not found' });
    if (!isSuperAdmin && Number(repairRes.rows[0].shop_id) !== Number(shopId)) return res.status(403).json({ success: false, error: 'Access denied' });

    const result = await db.query('SELECT * FROM repair_bills WHERE repair_id = $1', [repairId]);
    
    // If no bill exists yet, return empty structured data
    if (result.rows.length === 0 || result.rows[0].deleted_at) {
      return res.status(200).json({ success: true, data: { repair_id: repairId, items: [], service_charge: 0, total_amount: 0, inventory_revision: Number(result.rows[0]?.inventory_revision || 0) } });
    }

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('getBill Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Save/Update bill for a repair
exports.saveBill = async (req, res) => {
  try {
    const data = await transaction(async client => {
      const repairId = id(req.params.repairId, 'Repair');
      const repairRes = await client.query('SELECT id, shop_id FROM repairs WHERE id=$1 AND deleted_at IS NULL FOR UPDATE', [repairId]);
      if (!repairRes.rows.length) fail('Repair not found', 404);
      const repair = repairRes.rows[0];
      if (req.user.role !== 'super-admin' && Number(repair.shop_id) !== Number(req.user.shopId)) fail('Access denied', 403);
      const existing = (await client.query('SELECT * FROM repair_bills WHERE repair_id=$1 FOR UPDATE', [repairId])).rows[0];
      // Archiving has already returned these parts. A replacement bill starts at zero usage.
      const previousItems = existing && !existing.deleted_at ? (typeof existing.items === "string" ? JSON.parse(existing.items) : existing.items) || [] : [];
      if (!Array.isArray(req.body.items) || req.body.items.length > 500) fail('Enter up to 500 bill items');
      const items = req.body.items.map(item => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) fail('Invalid bill item');
        return {
        ...(item.id != null ? { id: String(item.id) } : {}),
        name: text(item.name, 'Item name', 200, true),
        qty: number(item.qty, 'Quantity', 3, 0.001),
        cost: number(item.cost, 'Unit price', 2),
        ...(item.product_id != null ? { product_id: id(item.product_id, 'Product') } : {}),
        ...(typeof item.image_url === 'string' && item.image_url ? { image_url: text(item.image_url, 'Image URL', 1000) } : {}),
        };
      });
      const usesInventory = [...previousItems, ...items].some(item => item.product_id != null);
      const revision = Number(existing?.inventory_revision || 0);
      if ((usesInventory && req.body.inventory_revision == null) ||
          (req.body.inventory_revision != null && number(req.body.inventory_revision, 'Bill version', 0) !== revision)) {
        fail('This bill changed or needs to be reloaded. Reopen billing before saving inventory items.', 409);
      }
      if (usesInventory) await reconcileBillStock(client, repair, previousItems, items, req.user.id);
      const service = number(req.body.service_charge ?? 0, 'Labour charge', 2);
      const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
      const partsTotal = round(items.reduce((sum, item) => sum + round(item.cost * item.qty), 0));
      if (!Array.isArray(req.body.tax_snapshot || [])) fail('Invalid taxes');
      const taxes = (req.body.tax_snapshot || []).map(tax => {
        if (!tax || typeof tax !== 'object' || Array.isArray(tax)) fail('Invalid tax configuration');
        const rate = number(tax.rate, 'Tax rate', 4);
        if (rate > 100 || !['all', 'service', 'parts'].includes(tax.applies_to) || typeof tax.is_inclusive !== 'boolean') fail('Invalid tax configuration');
        const base = tax.applies_to === 'service' ? service : tax.applies_to === 'all' ? partsTotal + service : partsTotal;
        return { id: id(tax.id, 'Tax'), name: text(tax.name, 'Tax name', 100, true), rate, applies_to: tax.applies_to, is_inclusive: tax.is_inclusive,
          amount: round(tax.is_inclusive ? base - base / (1 + rate / 100) : base * rate / 100) };
      });
      const subtotal = round(partsTotal + service);
      const total = round(subtotal + taxes.filter(t => !t.is_inclusive).reduce((sum, t) => sum + t.amount, 0));
      const paymentStatus = req.body.payment_status || 'Unpaid';
      if (!['Paid', 'Unpaid', 'Partial'].includes(paymentStatus)) fail('Invalid payment status');
      const paymentMethod = text(req.body.payment_method, 'Payment method', 50) || null;
      const result = await client.query('INSERT INTO repair_bills (repair_id, items, service_charge, tax_snapshot, tax_total, subtotal_before_tax, total_amount, status, payment_status, payment_method, inventory_revision) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (repair_id) DO UPDATE SET items=EXCLUDED.items, service_charge=EXCLUDED.service_charge, tax_snapshot=EXCLUDED.tax_snapshot, tax_total=EXCLUDED.tax_total, subtotal_before_tax=EXCLUDED.subtotal_before_tax, total_amount=EXCLUDED.total_amount, status=EXCLUDED.status, payment_status=EXCLUDED.payment_status, payment_method=EXCLUDED.payment_method, inventory_revision=EXCLUDED.inventory_revision, deleted_at=NULL, updated_at=CURRENT_TIMESTAMP RETURNING *',
        [repairId, JSON.stringify(items), service, JSON.stringify(taxes), round(taxes.reduce((sum, t) => sum + t.amount, 0)), subtotal, total, 'Active', paymentStatus, paymentMethod, revision + 1]);
      return result.rows[0];
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('saveBill Error:', error);
    res.status(error.status || 500).json({ success: false, error: error.status ? error.message : 'Could not save bill' });
  }
};

// @desc    Get all bills for a shop
exports.getAllBills = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';

  try {
    let query = `
      SELECT 
        rb.id, rb.repair_id, rb.items, rb.service_charge, 
        rb.tax_snapshot, rb.tax_total, rb.subtotal_before_tax, rb.total_amount, rb.payment_status, rb.payment_method, rb.inventory_revision, rb.created_at, rb.updated_at,
        r.vehicle_number, r.owner_name, r.repair_date, r.status, r.vehicle_image, r.vehicle_type, r.service_type, r.phone_number, r.complaints,
        u.name as attending_worker_name
      FROM repair_bills rb
      JOIN repairs r ON rb.repair_id = r.id
      LEFT JOIN users u ON r.attending_worker_id = u.id
    `;
    const params = [];
    let paramIndex = 1;

    const { recordStatus, status, payment_status, search } = req.query;
    const rStatusFilter = (recordStatus === 'Inactive' || status === 'Inactive') 
      ? 'rb.deleted_at IS NOT NULL' 
      : 'rb.deleted_at IS NULL';

    let whereClauses = [rStatusFilter, 'r.deleted_at IS NULL'];

    if (!isSuperAdmin) {
      whereClauses.push(`r.shop_id = $${paramIndex}`);
      params.push(shopId);
      paramIndex++;
    }

    if (search) {
      whereClauses.push(`(r.vehicle_number ILIKE $${paramIndex} OR r.owner_name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (payment_status) {
      whereClauses.push(`rb.payment_status = $${paramIndex}`);
      params.push(payment_status);
      paramIndex++;
    }

    query += ` WHERE ` + whereClauses.join(' AND ') + ` ORDER BY rb.created_at DESC`;

    const result = await db.query(query, params);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getAllBills Error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Delete bill for a repair (archives + returns inventory stock)
exports.deleteBill = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';
  const billId = req.params.id;

  try {
    const data = await transaction(async client => {
      // Always take the repair lock before the bill lock, just like saveBill.
      const owner = await client.query('SELECT repair_id FROM repair_bills WHERE id=$1', [billId]);
      if (!owner.rows.length) fail('Bill not found', 404);
      const lockedRepair = await client.query('SELECT shop_id FROM repairs WHERE id=$1 FOR UPDATE', [owner.rows[0].repair_id]);
      if (!lockedRepair.rows.length || (!isSuperAdmin && Number(lockedRepair.rows[0].shop_id) !== Number(shopId))) fail('Bill not found', 404);
      const checkRes = await client.query(`
        SELECT rb.*, r.shop_id FROM repair_bills rb
        JOIN repairs r ON rb.repair_id = r.id
        WHERE rb.id = $1 AND rb.deleted_at IS NULL ${isSuperAdmin ? '' : 'AND r.shop_id = $2'}
        FOR UPDATE OF rb
      `, isSuperAdmin ? [billId] : [billId, shopId]);

      if (checkRes.rows.length === 0) fail('Bill not found', 404);
      const bill = checkRes.rows[0];
      const repair = { id: bill.repair_id, shop_id: bill.shop_id };
      const previousItems = typeof bill.items === 'string' ? JSON.parse(bill.items || '[]') : (bill.items || []);
      // Returning stock: reconcile previous items against an empty bill.
      // No-op when the bill never used inventory.
      if (Array.isArray(previousItems) && previousItems.some(item => item && item.product_id != null)) {
        await reconcileBillStock(client, repair, previousItems, [], req.user.id);
      }
      const result = await client.query(
        `UPDATE repair_bills SET deleted_at = NOW(), status = 'Inactive', inventory_revision = inventory_revision + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [billId]
      );
      return result.rows[0];
    });
    res.status(200).json({ success: true, data, message: 'Bill archived (Inactive). Inventory stock returned.' });
  } catch (error) {
    console.error('deleteBill Error:', error);
    res.status(error.status || 500).json({ success: false, error: error.status ? error.message : 'Server error' });
  }
};
// @desc    Update payment status
exports.updatePaymentStatus = async (req, res) => {
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';
  const id = req.params.id;
    const { payment_status, payment_method } = req.body;

    try {
      // Verify ownership
      const checkRes = await db.query(`
        SELECT rb.id FROM repair_bills rb
        JOIN repairs r ON rb.repair_id = r.id
        WHERE rb.id = $1 ${isSuperAdmin ? '' : 'AND r.shop_id = $2'}
      `, isSuperAdmin ? [id] : [id, shopId]);

      if (checkRes.rows.length === 0) return res.status(404).json({ success: false, error: 'Bill not found' });

      let result;
      if (payment_method !== undefined) {
        result = await db.query(
          `UPDATE repair_bills SET payment_status = $1, payment_method = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
          [payment_status, payment_method, id]
        );
      } else {
        result = await db.query(
          `UPDATE repair_bills SET payment_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
          [payment_status, id]
        );
      }
      res.status(200).json({ success: true, data: result.rows[0], message: 'Payment status updated' });
    } catch (error) {
      console.error('updatePaymentStatus Error:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  };
