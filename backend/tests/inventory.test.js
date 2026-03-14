const request = require('supertest');
const { authHeader, registerAndLogin } = require('./helpers');

describe('Inventory workflows', () => {
  test('receipt validate increases stock and writes ledger + done_qty', async () => {
    const { app, token } = await registerAndLogin();

    const wh = await request(app).post('/api/warehouses').set(authHeader(token)).send({ name: 'WH1', short_code: 'WH' , location: 'City' });
    const warehouseId = wh.body.id;
    const loc = await request(app).post('/api/warehouses/locations').set(authHeader(token)).send({ warehouse_id: warehouseId, location_name: 'Stock1', short_code: 'STK1' });
    const locationId = loc.body.id;

    const prod = await request(app).post('/api/products').set(authHeader(token)).send({
      name: 'Desk',
      sku: 'DESK001',
      category: 'Furniture',
      unit: 'Units',
      per_unit_cost: 3000,
      reorder_level: 5,
    });
    const productId = prod.body.id;

    const createReceipt = await request(app).post('/api/inventory/receipts').set(authHeader(token)).send({
      supplier: 'Vendor A',
      contact: 'Azure Interior',
      warehouse_id: warehouseId,
      location_id: locationId,
      products: [{ product_id: productId, quantity: 10 }],
      source_document: 'PO-1001',
    });
    expect(createReceipt.statusCode).toBe(201);
    expect(createReceipt.body.reference_code).toMatch(/WH\/IN\/\d+/);

    const receiptId = createReceipt.body.receiptId;
    await request(app).post(`/api/inventory/receipts/${receiptId}/mark-as-todo`).set(authHeader(token));
    const validate = await request(app).post(`/api/inventory/receipts/${receiptId}/validate`).set(authHeader(token));
    expect(validate.statusCode).toBe(200);

    const stock = await global.__db.query(
      'SELECT quantity FROM stock WHERE product_id = $1 AND warehouse_id = $2 AND location_id = $3',
      [productId, warehouseId, locationId]
    );
    expect(Number(stock.rows[0].quantity)).toBe(10);

    const items = await global.__db.query('SELECT demand_qty, done_qty FROM receipt_items WHERE receipt_id = $1', [receiptId]);
    expect(Number(items.rows[0].demand_qty)).toBe(10);
    expect(Number(items.rows[0].done_qty)).toBe(10);

    const ledger = await global.__db.query('SELECT COUNT(*)::int AS c FROM inventory_movements WHERE reference_id = $1 AND type = $2', [receiptId, 'RECEIPT']);
    expect(ledger.rows[0].c).toBe(1);
  });

  test('delivery confirm sets waiting when insufficient stock; validate decrements when ready', async () => {
    const { app, token } = await registerAndLogin();

    const wh = await request(app).post('/api/warehouses').set(authHeader(token)).send({ name: 'WH1', short_code: 'WH' , location: 'City' });
    const warehouseId = wh.body.id;
    const loc = await request(app).post('/api/warehouses/locations').set(authHeader(token)).send({ warehouse_id: warehouseId, location_name: 'Stock1', short_code: 'STK1' });
    const locationId = loc.body.id;

    const prod = await request(app).post('/api/products').set(authHeader(token)).send({
      name: 'Table',
      sku: 'TBL001',
      category: 'Furniture',
      unit: 'Units',
      per_unit_cost: 1000,
      reorder_level: 1,
    });
    const productId = prod.body.id;

    const createDelivery = await request(app).post('/api/inventory/deliveries').set(authHeader(token)).send({
      customer: 'Customer A',
      contact: 'Azure Interior',
      delivery_address: 'Addr',
      warehouse_id: warehouseId,
      location_id: locationId,
      products: [{ product_id: productId, quantity: 5 }],
      source_document: 'SO-1',
      operation_type: 'Delivery',
    });
    expect(createDelivery.statusCode).toBe(201);
    expect(createDelivery.body.reference_code).toMatch(/WH\/OUT\/\d+/);
    const deliveryId = createDelivery.body.deliveryId;

    const confirm1 = await request(app).post(`/api/inventory/deliveries/${deliveryId}/mark-as-todo`).set(authHeader(token));
    expect(confirm1.statusCode).toBe(200);
    expect(confirm1.body.status).toBe('waiting');

    // Add stock via receipt
    const receipt = await request(app).post('/api/inventory/receipts').set(authHeader(token)).send({
      supplier: 'Vendor',
      warehouse_id: warehouseId,
      location_id: locationId,
      products: [{ product_id: productId, quantity: 10 }],
    });
    const receiptId = receipt.body.receiptId;
    await request(app).post(`/api/inventory/receipts/${receiptId}/validate`).set(authHeader(token));

    const confirm2 = await request(app).post(`/api/inventory/deliveries/${deliveryId}/confirm`).set(authHeader(token));
    expect(confirm2.statusCode).toBe(200);
    expect(['ready', 'waiting']).toContain(confirm2.body.status);
    if (confirm2.body.status !== 'ready') throw new Error('Expected delivery to be ready after stocking');

    const validate = await request(app).post(`/api/inventory/deliveries/${deliveryId}/validate`).set(authHeader(token));
    expect(validate.statusCode).toBe(200);

    const stock = await global.__db.query(
      'SELECT quantity FROM stock WHERE product_id = $1 AND warehouse_id = $2 AND location_id = $3',
      [productId, warehouseId, locationId]
    );
    expect(Number(stock.rows[0].quantity)).toBe(5);

    const items = await global.__db.query('SELECT demand_qty, done_qty FROM delivery_items WHERE delivery_id = $1', [deliveryId]);
    expect(Number(items.rows[0].demand_qty)).toBe(5);
    expect(Number(items.rows[0].done_qty)).toBe(5);
  });
});

