const db = require('../utils/db');

function padNumber(num, width) {
  const raw = String(num);
  return raw.length >= width ? raw : '0'.repeat(width - raw.length) + raw;
}

async function getWarehouseCode(warehouseId) {
  if (!warehouseId) return 'WH';
  const row = await db.query('SELECT short_code FROM warehouses WHERE id = $1', [warehouseId]);
  const code = row.rows[0]?.short_code || 'WH';
  return String(code).trim() || 'WH';
}

async function nextReferenceCode({ warehouseId, operation }) {
  const wh = await getWarehouseCode(warehouseId);
  const op = String(operation || '').toUpperCase();
  const prefix = `${wh}/${op}/`;

  const seq = await db.query(
    `INSERT INTO operation_sequences (warehouse_id, operation_type, current_value, prefix)
     VALUES ($1, $2, 1, $3)
     ON CONFLICT (warehouse_id, operation_type)
     DO UPDATE SET current_value = operation_sequences.current_value + 1, prefix = EXCLUDED.prefix
     RETURNING current_value, prefix`,
    [warehouseId, op, prefix]
  );

  const current = Number.parseInt(seq.rows[0].current_value, 10);
  const effectivePrefix = seq.rows[0].prefix || prefix;
  return `${effectivePrefix}${padNumber(current, 4)}`;
}

function normalizeProducts(products) {
  if (!Array.isArray(products) || products.length === 0) return [];
  return products
    .map((p) => ({
      product_id: Number.parseInt(p.product_id, 10),
      quantity: Number.parseInt(p.quantity ?? p.demand_qty, 10),
    }))
    .filter((p) => Number.isFinite(p.product_id) && Number.isFinite(p.quantity) && p.quantity > 0);
}

async function computeDeliveryShortages({ warehouseId, locationId, products }) {
  const shortages = [];

  for (const item of products) {
    const stockCheck = await db.query(
      'SELECT quantity FROM stock WHERE product_id = $1 AND warehouse_id = $2 AND location_id = $3',
      [item.product_id, warehouseId, locationId]
    );

    const available = stockCheck.rows.length > 0 ? Number.parseInt(stockCheck.rows[0].quantity, 10) : 0;
    if (available < item.quantity) {
      shortages.push({
        product_id: item.product_id,
        required: item.quantity,
        available,
        shortage: item.quantity - available,
      });
    }
  }

  return shortages;
}

// Receipts (Draft -> Ready -> Done)
exports.createReceipt = async (req, res) => {
  const { supplier, contact, warehouse_id, location_id, schedule_date, source_document, products } = req.body;
  const items = normalizeProducts(products);

  if (!supplier) return res.status(400).json({ message: 'Supplier is required' });
  if (!warehouse_id || !location_id) return res.status(400).json({ message: 'Warehouse and Location are required' });
  if (items.length === 0) return res.status(400).json({ message: 'At least one product is required' });

  try {
    await db.query('BEGIN');

    const referenceCode = await nextReferenceCode({ warehouseId: warehouse_id, operation: 'IN' });

    const receiptResult = await db.query(
      `INSERT INTO receipts (supplier, contact, warehouse_id, location_id, schedule_date, source_document, responsible_user_id, status, reference_code, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $8, $7)
       RETURNING id, reference_code`,
      [supplier, contact || null, warehouse_id, location_id, schedule_date || null, source_document || null, req.user.user_id, referenceCode]
    );
    const receiptId = receiptResult.rows[0].id;

    for (const item of items) {
      await db.query('INSERT INTO receipt_items (receipt_id, product_id, demand_qty, done_qty) VALUES ($1, $2, $3, 0)', [
        receiptId,
        item.product_id,
        item.quantity,
      ]);
    }

    await db.query('COMMIT');
    res.status(201).json({ message: 'Receipt created', receiptId, reference_code: referenceCode, status: 'draft' });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.confirmReceipt = async (req, res) => {
  const { id } = req.params;

  try {
    const receipt = await db.query('SELECT id, status FROM receipts WHERE id = $1', [id]);
    if (receipt.rows.length === 0) return res.status(404).json({ message: 'Receipt not found' });
    if (receipt.rows[0].status === 'done') return res.status(400).json({ message: 'Receipt already done' });

    await db.query("UPDATE receipts SET status = 'ready' WHERE id = $1", [id]);
    res.json({ message: 'Receipt marked Ready', status: 'ready' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.validateReceipt = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('BEGIN');

    const receipt = await db.query(
      'SELECT id, status, warehouse_id, location_id, reference_code, contact FROM receipts WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (receipt.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: 'Receipt not found' });
    }

    const doc = receipt.rows[0];
    if (doc.status === 'done') {
      await db.query('ROLLBACK');
      return res.status(400).json({ message: 'Receipt already done' });
    }

    const items = await db.query('SELECT product_id, demand_qty FROM receipt_items WHERE receipt_id = $1', [id]);
    if (items.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ message: 'Receipt has no items' });
    }

    for (const item of items.rows) {
      // Lock the row if it exists to reduce concurrency anomalies
      await db.query(
        'SELECT id FROM stock WHERE product_id = $1 AND warehouse_id = $2 AND location_id = $3 FOR UPDATE',
        [item.product_id, doc.warehouse_id, doc.location_id]
      );

      await db.query(
        `INSERT INTO stock (product_id, warehouse_id, location_id, quantity)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (product_id, warehouse_id, location_id)
         DO UPDATE SET quantity = stock.quantity + $4`,
        [item.product_id, doc.warehouse_id, doc.location_id, item.demand_qty]
      );

      await db.query(
        `INSERT INTO inventory_movements (product_id, type, destination_location_id, quantity, reference_id, reference_code, contact)
         VALUES ($1, 'RECEIPT', $2, $3, $4, $5, $6)`,
        [item.product_id, doc.location_id, item.demand_qty, doc.id, doc.reference_code, doc.contact || null]
      );
    }

    await db.query('UPDATE receipt_items SET done_qty = demand_qty WHERE receipt_id = $1', [id]);
    await db.query("UPDATE receipts SET status = 'done' WHERE id = $1", [id]);
    await db.query('COMMIT');

    res.json({ message: 'Receipt validated and stock updated', status: 'done' });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    const msg = err?.message || 'Server error';
    if (/^Insufficient stock\b/i.test(msg)) {
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: msg });
  }
};

// Stock snapshot by warehouse + location (used by Transfers UI)
exports.getLocationStock = async (req, res) => {
  const warehouseId = Number.parseInt(req.query.warehouse_id, 10);
  const locationId = Number.parseInt(req.query.location_id, 10);

  if (!Number.isFinite(warehouseId) || !Number.isFinite(locationId)) {
    return res.status(400).json({ message: 'warehouse_id and location_id are required' });
  }

  try {
    const rows = await db.query(
      `SELECT s.product_id, s.quantity, p.name, p.sku, p.per_unit_cost
       FROM stock s
       JOIN products p ON p.id = s.product_id
       WHERE s.warehouse_id = $1 AND s.location_id = $2
       ORDER BY p.name ASC`,
      [warehouseId, locationId]
    );
    res.json(rows.rows.map((r) => ({
      ...r,
      quantity: Number.parseInt(r.quantity, 10) || 0,
      per_unit_cost: Number(r.per_unit_cost ?? 0),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// Deliveries (Draft -> Waiting/Ready -> Done)
exports.createDelivery = async (req, res) => {
  const { customer, contact, delivery_address, warehouse_id, location_id, schedule_date, source_document, operation_type, products } = req.body;
  const items = normalizeProducts(products);

  if (!customer) return res.status(400).json({ message: 'Customer is required' });
  if (!warehouse_id || !location_id) return res.status(400).json({ message: 'Warehouse and Location are required' });
  if (items.length === 0) return res.status(400).json({ message: 'At least one product is required' });

  try {
    await db.query('BEGIN');

    const referenceCode = await nextReferenceCode({ warehouseId: warehouse_id, operation: 'OUT' });

    const deliveryResult = await db.query(
      `INSERT INTO deliveries (customer, contact, delivery_address, warehouse_id, location_id, schedule_date, source_document, operation_type, responsible_user_id, status, reference_code, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', $10, $9)
       RETURNING id, reference_code`,
      [customer, contact || null, delivery_address || null, warehouse_id, location_id, schedule_date || null, source_document || null, operation_type || null, req.user.user_id, referenceCode]
    );
    const deliveryId = deliveryResult.rows[0].id;

    for (const item of items) {
      await db.query('INSERT INTO delivery_items (delivery_id, product_id, demand_qty, done_qty) VALUES ($1, $2, $3, 0)', [
        deliveryId,
        item.product_id,
        item.quantity,
      ]);
    }

    await db.query('COMMIT');
    res.status(201).json({ message: 'Delivery created', deliveryId, reference_code: referenceCode, status: 'draft' });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

exports.confirmDelivery = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('BEGIN');

    const delivery = await db.query(
      'SELECT id, status, warehouse_id, location_id FROM deliveries WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (delivery.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: 'Delivery not found' });
    }

    const doc = delivery.rows[0];
    if (doc.status === 'done') {
      await db.query('ROLLBACK');
      return res.status(400).json({ message: 'Delivery already done' });
    }

    const items = await db.query('SELECT product_id, demand_qty AS quantity FROM delivery_items WHERE delivery_id = $1', [id]);
    const shortages = await computeDeliveryShortages({
      warehouseId: doc.warehouse_id,
      locationId: doc.location_id,
      products: items.rows,
    });

    if (shortages.length > 0) {
      await db.query("UPDATE deliveries SET status = 'waiting' WHERE id = $1", [id]);
      await db.query('COMMIT');
      return res.json({
        message: 'Delivery is Waiting (insufficient stock)',
        status: 'waiting',
        shortages,
      });
    }

    await db.query("UPDATE deliveries SET status = 'ready' WHERE id = $1", [id]);
    await db.query('COMMIT');
    return res.json({ message: 'Delivery marked Ready', status: 'ready' });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

exports.validateDelivery = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('BEGIN');

    const delivery = await db.query(
      'SELECT id, status, warehouse_id, location_id, reference_code, contact FROM deliveries WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (delivery.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: 'Delivery not found' });
    }

    const doc = delivery.rows[0];
    if (doc.status !== 'ready') {
      await db.query('ROLLBACK');
      return res.status(400).json({ message: 'Delivery must be Ready before validation' });
    }

    const items = await db.query('SELECT product_id, demand_qty AS quantity FROM delivery_items WHERE delivery_id = $1', [id]);
    const shortages = await computeDeliveryShortages({
      warehouseId: doc.warehouse_id,
      locationId: doc.location_id,
      products: items.rows,
    });

    if (shortages.length > 0) {
      await db.query("UPDATE deliveries SET status = 'waiting' WHERE id = $1", [id]);
      await db.query('COMMIT');
      return res.status(409).json({
        message: 'Insufficient stock; delivery moved to Waiting',
        status: 'waiting',
        shortages,
      });
    }

    for (const item of items.rows) {
      const updated = await db.query(
        `UPDATE stock
         SET quantity = quantity - $1
         WHERE product_id = $2 AND warehouse_id = $3 AND location_id = $4 AND quantity >= $1
         RETURNING quantity`,
        [item.quantity, item.product_id, doc.warehouse_id, doc.location_id]
      );

      if (updated.rows.length === 0) {
        await db.query("UPDATE deliveries SET status = 'waiting' WHERE id = $1", [id]);
        await db.query('COMMIT');
        return res.status(409).json({
          message: 'Insufficient stock; delivery moved to Waiting',
          status: 'waiting',
          shortages: await computeDeliveryShortages({
            warehouseId: doc.warehouse_id,
            locationId: doc.location_id,
            products: items.rows,
          }),
        });
      }

      await db.query(
        `INSERT INTO inventory_movements (product_id, type, source_location_id, quantity, reference_id, reference_code, contact)
         VALUES ($1, 'DELIVERY', $2, $3, $4, $5, $6)`,
        [item.product_id, doc.location_id, item.quantity, doc.id, doc.reference_code, doc.contact || null]
      );
    }

    await db.query('UPDATE delivery_items SET done_qty = demand_qty WHERE delivery_id = $1', [id]);
    await db.query("UPDATE deliveries SET status = 'done' WHERE id = $1", [id]);
    await db.query('COMMIT');
    res.json({ message: 'Delivery validated and stock updated', status: 'done' });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// Internal Transfers (Draft -> Ready -> Done)
exports.createTransfer = async (req, res) => {
  const {
    warehouse_id,
    source_location_id,
    destination_location_id,
    products,
    // Backward compatibility (single item)
    product_id,
    quantity,
  } = req.body;

  const items = normalizeProducts(products?.length ? products : product_id ? [{ product_id, quantity }] : []);

  if (!warehouse_id || !source_location_id || !destination_location_id) {
    return res.status(400).json({ message: 'Warehouse, Source, and Destination are required' });
  }
  if (items.length === 0) return res.status(400).json({ message: 'At least one product is required' });

  try {
    await db.query('BEGIN');

    const transferResult = await db.query(
      `INSERT INTO transfers (warehouse_id, source_location_id, destination_location_id, status, created_by)
       VALUES ($1, $2, $3, 'draft', $4)
       RETURNING id`,
      [warehouse_id, source_location_id, destination_location_id, req.user.user_id]
    );

    const transferId = transferResult.rows[0].id;
    const referenceCode = await nextReferenceCode({ warehouseId: warehouse_id, operation: 'INT' });
    await db.query('UPDATE transfers SET reference_code = $1 WHERE id = $2', [referenceCode, transferId]);

    for (const item of items) {
      await db.query('INSERT INTO transfer_items (transfer_id, product_id, quantity) VALUES ($1, $2, $3)', [
        transferId,
        item.product_id,
        item.quantity,
      ]);
    }

    await db.query("UPDATE transfers SET status = 'ready' WHERE id = $1", [transferId]);

    // Apply immediately for now (minimal UX): ready -> done in same call
    for (const item of items) {
      const updated = await db.query(
        `UPDATE stock
         SET quantity = quantity - $1
         WHERE product_id = $2 AND warehouse_id = $3 AND location_id = $4 AND quantity >= $1
         RETURNING quantity`,
        [item.quantity, item.product_id, warehouse_id, source_location_id]
      );

      if (updated.rows.length === 0) {
        throw new Error(`Insufficient stock for product ID ${item.product_id} at source`);
      }

      await db.query(
        `INSERT INTO stock (product_id, warehouse_id, location_id, quantity)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (product_id, warehouse_id, location_id)
         DO UPDATE SET quantity = stock.quantity + $4`,
        [item.product_id, warehouse_id, destination_location_id, item.quantity]
      );

      await db.query(
        `INSERT INTO inventory_movements (product_id, type, source_location_id, destination_location_id, quantity, reference_id, reference_code)
         VALUES ($1, 'TRANSFER', $2, $3, $4, $5, $6)`,
        [item.product_id, source_location_id, destination_location_id, item.quantity, transferId, referenceCode]
      );
    }

    await db.query("UPDATE transfers SET status = 'done' WHERE id = $1", [transferId]);
    await db.query('COMMIT');

    res.status(201).json({ message: 'Transfer completed', transferId, reference_code: referenceCode, status: 'done' });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// Adjustments (Draft -> Done) - minimal flow
exports.createAdjustment = async (req, res) => {
  const { warehouse_id, location_id, reason, notes, items, product_id, counted_quantity } = req.body;

  const normalizedItems = Array.isArray(items) && items.length
    ? items
        .map((i) => ({
          product_id: Number.parseInt(i.product_id, 10),
          counted_quantity: Number.parseInt(i.counted_quantity, 10),
        }))
        .filter((i) => Number.isFinite(i.product_id) && Number.isFinite(i.counted_quantity) && i.counted_quantity >= 0)
    : Number.isFinite(Number.parseInt(product_id, 10)) && Number.isFinite(Number.parseInt(counted_quantity, 10))
      ? [{ product_id: Number.parseInt(product_id, 10), counted_quantity: Number.parseInt(counted_quantity, 10) }]
      : [];

  if (!warehouse_id || !location_id) return res.status(400).json({ message: 'Warehouse and Location are required' });
  if (normalizedItems.length === 0) return res.status(400).json({ message: 'At least one product is required' });

  try {
    await db.query('BEGIN');

    const adjustmentResult = await db.query(
      `INSERT INTO adjustments (warehouse_id, location_id, status, reason, notes, created_by)
       VALUES ($1, $2, 'draft', $3, $4, $5)
       RETURNING id`,
      [warehouse_id, location_id, reason || null, notes || null, req.user.user_id]
    );
    const adjustmentId = adjustmentResult.rows[0].id;
    const referenceCode = await nextReferenceCode({ warehouseId: warehouse_id, operation: 'ADJ' });
    await db.query('UPDATE adjustments SET reference_code = $1 WHERE id = $2', [referenceCode, adjustmentId]);

    for (const item of normalizedItems) {
      const uomRes = await db.query('SELECT unit FROM products WHERE id = $1', [item.product_id]);
      const uom = uomRes.rows[0]?.unit || null;

      const stockCheck = await db.query(
        'SELECT quantity FROM stock WHERE product_id = $1 AND warehouse_id = $2 AND location_id = $3',
        [item.product_id, warehouse_id, location_id]
      );

      const systemQuantity = stockCheck.rows.length > 0 ? Number.parseInt(stockCheck.rows[0].quantity, 10) : 0;
      const difference = item.counted_quantity - systemQuantity;

      await db.query(
        'INSERT INTO adjustment_items (adjustment_id, product_id, uom, system_quantity, counted_quantity, difference) VALUES ($1, $2, $3, $4, $5, $6)',
        [adjustmentId, item.product_id, uom, systemQuantity, item.counted_quantity, difference]
      );

      await db.query(
        `INSERT INTO stock (product_id, warehouse_id, location_id, quantity)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (product_id, warehouse_id, location_id)
         DO UPDATE SET quantity = $4`,
        [item.product_id, warehouse_id, location_id, item.counted_quantity]
      );

      if (difference !== 0) {
        await db.query(
          `INSERT INTO inventory_movements (product_id, type, destination_location_id, quantity, reference_id, reference_code)
           VALUES ($1, 'ADJUSTMENT', $2, $3, $4, $5)`,
          [item.product_id, location_id, difference, adjustmentId, referenceCode]
        );
      }
    }

    await db.query("UPDATE adjustments SET status = 'done' WHERE id = $1", [adjustmentId]);
    await db.query('COMMIT');

    res.status(201).json({ message: 'Adjustment completed', adjustmentId, reference_code: referenceCode, status: 'done' });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    res.status(500).send('Server error');
  }
};

// Lists (for list/kanban views)
exports.listReceipts = async (req, res) => {
  const q = (req.query.q || '').trim();
  const status = (req.query.status || '').trim();

  try {
    const rows = await db.query(
      `SELECT r.id, r.reference_code, r.supplier, r.contact, r.schedule_date, r.status, r.created_at,
              w.name AS warehouse_name, l.location_name,
              (SELECT COUNT(*) FROM receipt_items ri WHERE ri.receipt_id = r.id) AS line_count
       FROM receipts r
       LEFT JOIN warehouses w ON r.warehouse_id = w.id
       LEFT JOIN inventory_locations l ON r.location_id = l.id
       WHERE ($1 = '' OR r.reference_code ILIKE '%' || $1 || '%' OR r.supplier ILIKE '%' || $1 || '%' OR COALESCE(r.contact,'') ILIKE '%' || $1 || '%')
         AND ($2 = '' OR r.status = $2)
       ORDER BY r.created_at DESC`,
      [q, status]
    );
    res.json(rows.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

// Transfers list (simple list view for UI)
exports.listTransfers = async (req, res) => {
  const q = (req.query.q || '').trim();

  try {
    const rows = await db.query(
      `SELECT t.id, t.reference_code, t.status, t.created_at,
              w.name AS warehouse_name,
              sl.location_name AS source_location,
              dl.location_name AS destination_location,
              u.name AS created_by_name,
              (SELECT COUNT(*) FROM transfer_items ti WHERE ti.transfer_id = t.id) AS line_count
       FROM transfers t
       LEFT JOIN warehouses w ON t.warehouse_id = w.id
       LEFT JOIN inventory_locations sl ON t.source_location_id = sl.id
       LEFT JOIN inventory_locations dl ON t.destination_location_id = dl.id
       LEFT JOIN users u ON t.created_by = u.id
       WHERE ($1 = '' OR t.reference_code ILIKE '%' || $1 || '%' OR COALESCE(u.name,'') ILIKE '%' || $1 || '%')
       ORDER BY t.created_at DESC
       LIMIT 200`,
      [q]
    );

    res.json(rows.rows.map((r) => ({
      ...r,
      line_count: Number.parseInt(r.line_count, 10) || 0,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

exports.listDeliveries = async (req, res) => {
  const q = (req.query.q || '').trim();
  const status = (req.query.status || '').trim();

  try {
    const rows = await db.query(
      `SELECT d.id, d.reference_code, d.customer, d.contact, d.schedule_date, d.status, d.created_at,
              w.name AS warehouse_name, l.location_name,
              (SELECT COUNT(*) FROM delivery_items di WHERE di.delivery_id = d.id) AS line_count
       FROM deliveries d
       LEFT JOIN warehouses w ON d.warehouse_id = w.id
       LEFT JOIN inventory_locations l ON d.location_id = l.id
       WHERE ($1 = '' OR d.reference_code ILIKE '%' || $1 || '%' OR d.customer ILIKE '%' || $1 || '%' OR COALESCE(d.contact,'') ILIKE '%' || $1 || '%')
         AND ($2 = '' OR d.status = $2)
       ORDER BY d.created_at DESC`,
      [q, status]
    );
    res.json(rows.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.getReceipt = async (req, res) => {
  const { id } = req.params;
  try {
    const receipt = await db.query(
      `SELECT r.*, w.name AS warehouse_name, l.location_name
       FROM receipts r
       LEFT JOIN warehouses w ON r.warehouse_id = w.id
       LEFT JOIN inventory_locations l ON r.location_id = l.id
       WHERE r.id = $1`,
      [id]
    );
    if (receipt.rows.length === 0) return res.status(404).json({ message: 'Receipt not found' });

    const items = await db.query(
      `SELECT ri.product_id, ri.demand_qty, ri.done_qty, p.name AS product_name, p.sku
       FROM receipt_items ri
       JOIN products p ON p.id = ri.product_id
       WHERE ri.receipt_id = $1
       ORDER BY ri.id ASC`,
      [id]
    );

    res.json({ receipt: receipt.rows[0], items: items.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

exports.getDelivery = async (req, res) => {
  const { id } = req.params;
  try {
    const delivery = await db.query(
      `SELECT d.*, w.name AS warehouse_name, l.location_name
       FROM deliveries d
       LEFT JOIN warehouses w ON d.warehouse_id = w.id
       LEFT JOIN inventory_locations l ON d.location_id = l.id
       WHERE d.id = $1`,
      [id]
    );
    if (delivery.rows.length === 0) return res.status(404).json({ message: 'Delivery not found' });

    const items = await db.query(
      `SELECT di.product_id, di.demand_qty, di.done_qty, p.name AS product_name, p.sku
       FROM delivery_items di
       JOIN products p ON p.id = di.product_id
       WHERE di.delivery_id = $1
       ORDER BY di.id ASC`,
      [id]
    );

    res.json({ delivery: delivery.rows[0], items: items.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

exports.getMoveHistory = async (req, res) => {
  const q = (req.query.q || '').trim();

  try {
    const rows = await db.query(
      `SELECT im.id, im.type, im.quantity, im.reference_code, im.contact, im.created_at,
              p.name AS product_name, p.sku,
              sl.location_name AS source_location,
              dl.location_name AS destination_location
       FROM inventory_movements im
       JOIN products p ON p.id = im.product_id
       LEFT JOIN inventory_locations sl ON sl.id = im.source_location_id
       LEFT JOIN inventory_locations dl ON dl.id = im.destination_location_id
       WHERE ($1 = '' OR im.reference_code ILIKE '%' || $1 || '%' OR COALESCE(im.contact,'') ILIKE '%' || $1 || '%' OR p.name ILIKE '%' || $1 || '%' OR p.sku ILIKE '%' || $1 || '%')
       ORDER BY im.created_at DESC`,
      [q]
    );

    // Add signed quantity for easy UI coloring (IN:+, OUT:-)
    const mapped = rows.rows.map((r) => ({
      ...r,
      signed_quantity: ['DELIVERY'].includes(r.type) ? -Number(r.quantity) : Number(r.quantity),
      direction: ['DELIVERY'].includes(r.type) ? 'OUT' : 'IN',
    }));

    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};
