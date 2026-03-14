const db = require('../utils/db');

// Receipts
exports.createReceipt = async (req, res) => {
  const { supplier, warehouse_id, location_id, products } = req.body;

  try {
    await db.query('BEGIN');

    const receiptResult = await db.query(
      'INSERT INTO receipts (supplier, status) VALUES ($1, $2) RETURNING id',
      [supplier, 'completed']
    );
    const receiptId = receiptResult.rows[0].id;

    for (const item of products) {
      const { product_id, quantity } = item;

      // Insert receipt item
      await db.query(
        'INSERT INTO receipt_items (receipt_id, product_id, quantity) VALUES ($1, $2, $3)',
        [receiptId, product_id, quantity]
      );

      // Update stock
      await db.query(
        `INSERT INTO stock (product_id, warehouse_id, location_id, quantity)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (product_id, warehouse_id, location_id)
         DO UPDATE SET quantity = stock.quantity + $4`,
        [product_id, warehouse_id, location_id, quantity]
      );

      // Log movement
      await db.query(
        `INSERT INTO inventory_movements (product_id, type, destination_location_id, quantity, reference_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [product_id, 'RECEIPT', location_id, quantity, receiptId]
      );
    }

    await db.query('COMMIT');
    res.status(201).json({ message: 'Receipt created and stock updated', receiptId });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    res.status(500).send('Server error');
  }
};

// Deliveries
exports.createDelivery = async (req, res) => {
  const { customer, warehouse_id, location_id, products } = req.body;

  try {
    await db.query('BEGIN');

    // Check stock first
    for (const item of products) {
      const { product_id, quantity } = item;
      const stockCheck = await db.query(
        'SELECT quantity FROM stock WHERE product_id = $1 AND warehouse_id = $2 AND location_id = $3',
        [product_id, warehouse_id, location_id]
      );

      if (stockCheck.rows.length === 0 || stockCheck.rows[0].quantity < quantity) {
        throw new Error(`Insufficient stock for product ID ${product_id}`);
      }
    }

    const deliveryResult = await db.query(
      'INSERT INTO deliveries (customer, status) VALUES ($1, $2) RETURNING id',
      [customer, 'completed']
    );
    const deliveryId = deliveryResult.rows[0].id;

    for (const item of products) {
      const { product_id, quantity } = item;

      // Insert delivery item
      await db.query(
        'INSERT INTO delivery_items (delivery_id, product_id, quantity) VALUES ($1, $2, $3)',
        [deliveryId, product_id, quantity]
      );

      // Update stock
      await db.query(
        'UPDATE stock SET quantity = quantity - $1 WHERE product_id = $2 AND warehouse_id = $3 AND location_id = $4',
        [quantity, product_id, warehouse_id, location_id]
      );

      // Log movement
      await db.query(
        `INSERT INTO inventory_movements (product_id, type, source_location_id, quantity, reference_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [product_id, 'DELIVERY', location_id, quantity, deliveryId]
      );
    }

    await db.query('COMMIT');
    res.status(201).json({ message: 'Delivery created and stock updated', deliveryId });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// Transfers
exports.createTransfer = async (req, res) => {
  const { product_id, source_warehouse_id, source_location_id, dest_warehouse_id, dest_location_id, quantity } = req.body;

  try {
    await db.query('BEGIN');

    // Check source stock
    const stockCheck = await db.query(
      'SELECT quantity FROM stock WHERE product_id = $1 AND warehouse_id = $2 AND location_id = $3',
      [product_id, source_warehouse_id, source_location_id]
    );

    if (stockCheck.rows.length === 0 || stockCheck.rows[0].quantity < quantity) {
      throw new Error('Insufficient stock at source location');
    }

    // Deduct from source
    await db.query(
      'UPDATE stock SET quantity = quantity - $1 WHERE product_id = $2 AND warehouse_id = $3 AND location_id = $4',
      [quantity, product_id, source_warehouse_id, source_location_id]
    );

    // Add to destination
    await db.query(
      `INSERT INTO stock (product_id, warehouse_id, location_id, quantity)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (product_id, warehouse_id, location_id)
       DO UPDATE SET quantity = stock.quantity + $4`,
      [product_id, dest_warehouse_id, dest_location_id, quantity]
    );

    // Log movement
    await db.query(
      `INSERT INTO inventory_movements (product_id, type, source_location_id, destination_location_id, quantity)
       VALUES ($1, $2, $3, $4, $5)`,
      [product_id, 'TRANSFER', source_location_id, dest_location_id, quantity]
    );

    await db.query('COMMIT');
    res.status(201).json({ message: 'Transfer completed' });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// Adjustments
exports.createAdjustment = async (req, res) => {
  const { product_id, warehouse_id, location_id, counted_quantity } = req.body;

  try {
    await db.query('BEGIN');

    const stockCheck = await db.query(
      'SELECT quantity FROM stock WHERE product_id = $1 AND warehouse_id = $2 AND location_id = $3',
      [product_id, warehouse_id, location_id]
    );

    const systemQuantity = stockCheck.rows.length > 0 ? stockCheck.rows[0].quantity : 0;
    const difference = counted_quantity - systemQuantity;

    if (difference !== 0) {
      // Update stock
      await db.query(
        `INSERT INTO stock (product_id, warehouse_id, location_id, quantity)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (product_id, warehouse_id, location_id)
         DO UPDATE SET quantity = $4`,
        [product_id, warehouse_id, location_id, counted_quantity]
      );

      // Log movement
      await db.query(
        `INSERT INTO inventory_movements (product_id, type, destination_location_id, quantity)
         VALUES ($1, $2, $3, $4)`,
        [product_id, 'ADJUSTMENT', location_id, difference]
      );
    }

    await db.query('COMMIT');
    res.status(201).json({ message: 'Adjustment completed', difference });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    res.status(500).send('Server error');
  }
};
