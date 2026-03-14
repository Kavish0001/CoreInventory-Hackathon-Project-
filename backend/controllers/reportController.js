const db = require('../utils/db');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await db.query('SELECT COUNT(*) FROM products');
    const lowStockItems = await db.query('SELECT COUNT(*) FROM stock s JOIN products p ON s.product_id = p.id WHERE s.quantity < p.reorder_level');
    const pendingReceipts = await db.query("SELECT COUNT(*) FROM receipts WHERE status IN ('draft','waiting','ready')");
    const pendingDeliveries = await db.query("SELECT COUNT(*) FROM deliveries WHERE status IN ('draft','waiting','ready')");
    const transfersToday = await db.query("SELECT COUNT(*) FROM inventory_movements WHERE type = 'TRANSFER' AND created_at >= CURRENT_DATE");
    const lateOperations = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM receipts WHERE schedule_date IS NOT NULL AND schedule_date < CURRENT_DATE AND status <> 'done') +
        (SELECT COUNT(*) FROM deliveries WHERE schedule_date IS NOT NULL AND schedule_date < CURRENT_DATE AND status <> 'done')
      AS late_count
    `);
    const waitingOperations = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM receipts WHERE status = 'waiting') +
        (SELECT COUNT(*) FROM deliveries WHERE status = 'waiting')
      AS waiting_count
    `);

    res.json({
      total_products: Number.parseInt(totalProducts.rows[0].count, 10),
      low_stock_items: Number.parseInt(lowStockItems.rows[0].count, 10),
      pending_receipts: Number.parseInt(pendingReceipts.rows[0].count, 10),
      pending_deliveries: Number.parseInt(pendingDeliveries.rows[0].count, 10),
      transfers_today: Number.parseInt(transfersToday.rows[0].count, 10),
      late_operations: Number.parseInt(lateOperations.rows[0]?.late_count || 0, 10),
      waiting_operations: Number.parseInt(waitingOperations.rows[0]?.waiting_count || 0, 10),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.getStockLedger = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const ledger = await db.query(`
      SELECT im.id, im.product_id, im.type, im.source_location_id, im.destination_location_id, im.quantity,
            im.reference_id, im.reference_code, im.contact, im.created_at,
            p.name as product_name, p.sku,
            sl.location_name as source_location,
            dl.location_name as destination_location
      FROM inventory_movements im
      JOIN products p ON im.product_id = p.id
      LEFT JOIN inventory_locations sl ON im.source_location_id = sl.id
      LEFT JOIN inventory_locations dl ON im.destination_location_id = dl.id
      WHERE ($1 = '' OR im.reference_code ILIKE '%' || $1 || '%' OR COALESCE(im.contact,'') ILIKE '%' || $1 || '%' OR p.name ILIKE '%' || $1 || '%' OR p.sku ILIKE '%' || $1 || '%')
      ORDER BY im.created_at DESC
    `, [q]);
    res.json(ledger.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.getStockSnapshot = async (req, res) => {
  const q = (req.query.q || '').trim();

  try {
    const rows = await db.query(
      `SELECT
         p.id AS product_id,
         p.name AS product_name,
         p.sku,
         COALESCE(SUM(s.quantity), 0) AS on_hand,
         COALESCE(SUM(s.quantity), 0) AS free_to_use
       FROM products p
       LEFT JOIN stock s ON s.product_id = p.id
       WHERE ($1 = '' OR p.name ILIKE '%' || $1 || '%' OR p.sku ILIKE '%' || $1 || '%')
       GROUP BY p.id, p.name, p.sku
       ORDER BY p.name ASC`,
      [q]
    );

    res.json(rows.rows.map((r) => ({
      ...r,
      on_hand: Number.parseInt(r.on_hand, 10),
      free_to_use: Number.parseInt(r.free_to_use, 10),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.getLowStockAlerts = async (req, res) => {
  try {
    const alerts = await db.query(`
      SELECT p.name, p.sku, s.quantity, p.reorder_level, w.name as warehouse_name
      FROM stock s
      JOIN products p ON s.product_id = p.id
      JOIN warehouses w ON s.warehouse_id = w.id
      WHERE s.quantity < p.reorder_level
    `);
    res.json(alerts.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
