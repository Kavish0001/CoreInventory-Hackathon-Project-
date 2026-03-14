const db = require('../utils/db');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await db.query('SELECT COUNT(*) FROM products');
    const lowStockItems = await db.query('SELECT COUNT(*) FROM stock s JOIN products p ON s.product_id = p.id WHERE s.quantity < p.reorder_level');
    const pendingReceipts = await db.query("SELECT COUNT(*) FROM receipts WHERE status = 'pending'");
    const pendingDeliveries = await db.query("SELECT COUNT(*) FROM deliveries WHERE status = 'pending'");
    const transfersToday = await db.query("SELECT COUNT(*) FROM inventory_movements WHERE type = 'TRANSFER' AND created_at >= CURRENT_DATE");

    res.json({
      total_products: Number.parseInt(totalProducts.rows[0].count, 10),
      low_stock_items: Number.parseInt(lowStockItems.rows[0].count, 10),
      pending_receipts: Number.parseInt(pendingReceipts.rows[0].count, 10),
      pending_deliveries: Number.parseInt(pendingDeliveries.rows[0].count, 10),
      transfers_today: Number.parseInt(transfersToday.rows[0].count, 10),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.getStockLedger = async (req, res) => {
  try {
    const ledger = await db.query(`
      SELECT im.*, p.name as product_name, p.sku, 
            sl.location_name as source_location, 
            dl.location_name as destination_location
      FROM inventory_movements im
      JOIN products p ON im.product_id = p.id
      LEFT JOIN inventory_locations sl ON im.source_location_id = sl.id
      LEFT JOIN inventory_locations dl ON im.destination_location_id = dl.id
      ORDER BY im.created_at DESC
    `);
    res.json(ledger.rows);
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
