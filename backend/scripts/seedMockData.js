const path = require('node:path');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const db = require('../utils/db');

dotenv.config({ override: true, path: path.join(__dirname, '..', '.env') });

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    reset: args.has('--reset'),
    quiet: args.has('--quiet'),
  };
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

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

async function upsertUser({ name, email, login_id, role, password }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const res = await db.query(
    `INSERT INTO users (name, login_id, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role
     RETURNING id, name, email, login_id, role`,
    [name, login_id || null, email, passwordHash, role]
  );
  return res.rows[0];
}

async function upsertWarehouse({ name, short_code, location, address }) {
  const res = await db.query(
    `INSERT INTO warehouses (name, short_code, location, address)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (short_code) DO UPDATE SET name = EXCLUDED.name, location = EXCLUDED.location, address = EXCLUDED.address
     RETURNING id, name, short_code`,
    [name, short_code, location || null, address || null]
  );
  return res.rows[0];
}

async function upsertLocation({ warehouse_id, location_name, short_code }) {
  const res = await db.query(
    `INSERT INTO inventory_locations (warehouse_id, location_name, short_code)
     VALUES ($1, $2, $3)
     ON CONFLICT (warehouse_id, short_code) DO UPDATE SET location_name = EXCLUDED.location_name
     RETURNING id, warehouse_id, location_name, short_code`,
    [warehouse_id, location_name, short_code || null]
  );
  return res.rows[0];
}

async function upsertProduct({ name, sku, category, unit, per_unit_cost, reorder_level }) {
  const res = await db.query(
    `INSERT INTO products (name, sku, category, unit, per_unit_cost, reorder_level)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, unit = EXCLUDED.unit, per_unit_cost = EXCLUDED.per_unit_cost, reorder_level = EXCLUDED.reorder_level
     RETURNING id, name, sku`,
    [name, sku, category || null, unit || null, per_unit_cost || 0, reorder_level || 0]
  );
  return res.rows[0];
}

async function addStock({ product_id, warehouse_id, location_id, quantityDelta }) {
  await db.query(
    `INSERT INTO stock (product_id, warehouse_id, location_id, quantity)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (product_id, warehouse_id, location_id)
     DO UPDATE SET quantity = stock.quantity + $4`,
    [product_id, warehouse_id, location_id, quantityDelta]
  );
}

async function getStockQty({ product_id, warehouse_id, location_id }) {
  const res = await db.query(
    'SELECT quantity FROM stock WHERE product_id = $1 AND warehouse_id = $2 AND location_id = $3',
    [product_id, warehouse_id, location_id]
  );
  if (res.rows.length === 0) return 0;
  return Number.parseInt(res.rows[0].quantity, 10) || 0;
}

async function subtractStockSafe({ product_id, warehouse_id, location_id, desiredQty }) {
  const available = await getStockQty({ product_id, warehouse_id, location_id });
  const qty = Math.max(0, Math.min(Number(desiredQty) || 0, available));
  if (qty <= 0) return 0;
  await addStock({ product_id, warehouse_id, location_id, quantityDelta: -qty });
  return qty;
}

async function insertMovement({ product_id, type, source_location_id, destination_location_id, quantity, reference_id, reference_code, contact }) {
  await db.query(
    `INSERT INTO inventory_movements (product_id, type, source_location_id, destination_location_id, quantity, reference_id, reference_code, contact)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [product_id, type, source_location_id || null, destination_location_id || null, quantity, reference_id || null, reference_code || null, contact || null]
  );
}

async function resetAll() {
  // Dev-only: wipe application tables. Use with care.
  await db.query('BEGIN');
  try {
    await db.query(
      `TRUNCATE TABLE
        inventory_movements,
        adjustment_items,
        adjustments,
        transfer_items,
        transfers,
        delivery_items,
        deliveries,
        receipt_items,
        receipts,
        stock,
        products,
        inventory_locations,
        warehouses,
        password_reset_codes,
        operation_sequences,
        users
      RESTART IDENTITY CASCADE`
    );
    await db.query('COMMIT');
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  }
}

async function main() {
  const { reset, quiet } = parseArgs(process.argv);
  const seed = Number.parseInt(process.env.MOCK_SEED || '', 10) || Math.floor(Date.now() / 1000);
  const rng = mulberry32(seed);

  const managerPassword = process.env.MOCK_MANAGER_PASSWORD || 'Manager@123!';
  const staffPassword = process.env.MOCK_STAFF_PASSWORD || 'Staff@123!';

  const warehousesCount = Math.max(1, Number.parseInt(process.env.MOCK_WAREHOUSES || '2', 10));
  const productsCount = Math.max(10, Number.parseInt(process.env.MOCK_PRODUCTS || '40', 10));
  const staffCount = Math.max(1, Number.parseInt(process.env.MOCK_STAFF_USERS || '3', 10));
  const receiptsCount = Math.max(0, Number.parseInt(process.env.MOCK_RECEIPTS || '10', 10));
  const deliveriesCount = Math.max(0, Number.parseInt(process.env.MOCK_DELIVERIES || '10', 10));
  const transfersCount = Math.max(0, Number.parseInt(process.env.MOCK_TRANSFERS || '10', 10));

  if (reset) {
    await resetAll();
  }

  await db.query('BEGIN');
  try {
    // Users
    const manager = await upsertUser({
      name: 'Inventory Manager',
      email: 'manager@coreinventory.dev',
      login_id: 'manager01',
      role: 'manager',
      password: managerPassword,
    });

    const staffUsers = [];
    for (let i = 1; i <= staffCount; i++) {
      // keep login_id <= 12 chars
      const loginId = `staff${padNumber(i, 2)}`;
      staffUsers.push(await upsertUser({
        name: `Warehouse Staff ${i}`,
        email: `staff${i}@coreinventory.dev`,
        login_id: loginId,
        role: 'warehouse_staff',
        password: staffPassword,
      }));
    }

    // Warehouses + Locations
    const cities = ['Mumbai', 'Pune', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai'];
    const warehouses = [];
    const locationsByWarehouse = new Map();

    for (let i = 1; i <= warehousesCount; i++) {
      const shortCode = `WH${padNumber(i, 2)}`;
      const warehouse = await upsertWarehouse({
        name: `Warehouse ${i}`,
        short_code: shortCode,
        location: pick(rng, cities),
        address: `Plot ${10 + i}, Industrial Area`,
      });
      warehouses.push(warehouse);

      const receiving = await upsertLocation({ warehouse_id: warehouse.id, location_name: 'Receiving', short_code: 'RECV' });
      const stock = await upsertLocation({ warehouse_id: warehouse.id, location_name: 'Stock', short_code: 'STOCK' });
      const output = await upsertLocation({ warehouse_id: warehouse.id, location_name: 'Output', short_code: 'OUT' });
      locationsByWarehouse.set(String(warehouse.id), { receiving, stock, output });
    }

    // Products
    const categories = ['Electronics', 'Packaging', 'Office', 'Hardware', 'Consumables'];
    const units = ['pcs', 'box', 'kg', 'm'];
    const products = [];
    for (let i = 1; i <= productsCount; i++) {
      const sku = `SKU-${padNumber(i, 4)}`;
      const product = await upsertProduct({
        name: `Product ${i}`,
        sku,
        category: pick(rng, categories),
        unit: pick(rng, units),
        per_unit_cost: Number((rng() * 200 + 5).toFixed(2)),
        reorder_level: Math.floor(rng() * 15),
      });
      products.push(product);
    }

    // Seed baseline stock in each warehouse Stock location
    for (const wh of warehouses) {
      const locs = locationsByWarehouse.get(String(wh.id));
      for (const p of products) {
        const qty = Math.floor(rng() * 120); // 0..119
        if (qty <= 0) continue;
        await addStock({ product_id: p.id, warehouse_id: wh.id, location_id: locs.stock.id, quantityDelta: qty });
      }
    }

    // Receipts (done): add stock to Receiving then to Stock (simplified)
    for (let i = 0; i < receiptsCount; i++) {
      const wh = pick(rng, warehouses);
      const locs = locationsByWarehouse.get(String(wh.id));
      const ref = await nextReferenceCode({ warehouseId: wh.id, operation: 'IN' });

      const supplier = pick(rng, ['ACME Supplies', 'Globex', 'Initech', 'Umbrella Corp', 'Stark Parts']);
      const statusRoll = rng();
      const status = statusRoll < 0.15 ? 'draft' : statusRoll < 0.30 ? 'waiting' : statusRoll < 0.45 ? 'ready' : 'done';
      const receipt = await db.query(
        `INSERT INTO receipts (supplier, contact, warehouse_id, location_id, schedule_date, responsible_user_id, status, reference_code, created_by)
         VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7, $8)
         RETURNING id`,
        [supplier, 'Vendor', wh.id, locs.stock.id, manager.id, status, ref, manager.id]
      );

      const lineCount = 2 + Math.floor(rng() * 4);
      for (let l = 0; l < lineCount; l++) {
        const p = pick(rng, products);
        const qty = 5 + Math.floor(rng() * 35);
        await db.query(
          'INSERT INTO receipt_items (receipt_id, product_id, demand_qty, done_qty) VALUES ($1, $2, $3, $4)',
          [receipt.rows[0].id, p.id, qty, status === 'done' ? qty : 0]
        );
        if (status === 'done') {
          await addStock({ product_id: p.id, warehouse_id: wh.id, location_id: locs.stock.id, quantityDelta: qty });
          await insertMovement({
            product_id: p.id,
            type: 'RECEIPT',
            source_location_id: null,
            destination_location_id: locs.stock.id,
            quantity: qty,
            reference_id: receipt.rows[0].id,
            reference_code: ref,
            contact: 'Vendor',
          });
        }
      }
    }

    // Deliveries (done): subtract from Stock
    for (let i = 0; i < deliveriesCount; i++) {
      const wh = pick(rng, warehouses);
      const locs = locationsByWarehouse.get(String(wh.id));
      const ref = await nextReferenceCode({ warehouseId: wh.id, operation: 'OUT' });

      const customer = pick(rng, ['Client A', 'Client B', 'Client C', 'Retailer X', 'Retailer Y']);
      const statusRoll = rng();
      const status = statusRoll < 0.15 ? 'draft' : statusRoll < 0.30 ? 'waiting' : statusRoll < 0.45 ? 'ready' : 'done';
      const delivery = await db.query(
        `INSERT INTO deliveries (customer, contact, delivery_address, warehouse_id, location_id, schedule_date, source_document, operation_type, responsible_user_id, status, reference_code, created_by)
         VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7, $8, $9, $10, $8)
         RETURNING id`,
        [customer, 'Customer', 'Some Address', wh.id, locs.stock.id, `SO${padNumber(i + 1, 4)}`, 'Delivery', manager.id, status, ref]
      );

      const lineCount = 1 + Math.floor(rng() * 4);
      for (let l = 0; l < lineCount; l++) {
        const p = pick(rng, products);
        const desired = 1 + Math.floor(rng() * 12);
        const qty = status === 'done'
          ? await subtractStockSafe({ product_id: p.id, warehouse_id: wh.id, location_id: locs.stock.id, desiredQty: desired })
          : desired;

        if (qty <= 0) continue;
        await db.query(
          'INSERT INTO delivery_items (delivery_id, product_id, demand_qty, done_qty) VALUES ($1, $2, $3, $4)',
          [delivery.rows[0].id, p.id, qty, status === 'done' ? qty : 0]
        );
        if (status === 'done') {
          await insertMovement({
            product_id: p.id,
            type: 'DELIVERY',
            source_location_id: locs.stock.id,
            destination_location_id: null,
            quantity: qty,
            reference_id: delivery.rows[0].id,
            reference_code: ref,
            contact: 'Customer',
          });
        }
      }
    }

    // Transfers (done): Stock -> Output
    for (let i = 0; i < transfersCount; i++) {
      const wh = pick(rng, warehouses);
      const locs = locationsByWarehouse.get(String(wh.id));
      const createdBy = pick(rng, [manager, ...staffUsers]);
      const ref = await nextReferenceCode({ warehouseId: wh.id, operation: 'INT' });

      const transfer = await db.query(
        `INSERT INTO transfers (warehouse_id, source_location_id, destination_location_id, status, created_by, reference_code)
         VALUES ($1, $2, $3, 'done', $4, $5)
         RETURNING id`,
        [wh.id, locs.stock.id, locs.output.id, createdBy.id, ref]
      );

      const lineCount = 1 + Math.floor(rng() * 3);
      for (let l = 0; l < lineCount; l++) {
        const p = pick(rng, products);
        const desired = 1 + Math.floor(rng() * 8);
        const qty = await subtractStockSafe({ product_id: p.id, warehouse_id: wh.id, location_id: locs.stock.id, desiredQty: desired });
        if (qty <= 0) continue;
        await db.query(
          'INSERT INTO transfer_items (transfer_id, product_id, quantity) VALUES ($1, $2, $3)',
          [transfer.rows[0].id, p.id, qty]
        );
        await addStock({ product_id: p.id, warehouse_id: wh.id, location_id: locs.output.id, quantityDelta: qty });
        await insertMovement({
          product_id: p.id,
          type: 'TRANSFER',
          source_location_id: locs.stock.id,
          destination_location_id: locs.output.id,
          quantity: qty,
          reference_id: transfer.rows[0].id,
          reference_code: ref,
        });
      }
    }

    await db.query('COMMIT');

    if (!quiet) {
      console.log('Mock data seed complete.');
      console.log('');
      console.log('Login users:');
      console.log(`- Inventory Manager: manager@coreinventory.dev / ${managerPassword}`);
      console.log(`- Warehouse Staff: staff1@coreinventory.dev / ${staffPassword} (and staff2..., staffN...)`);
      console.log('');
      console.log(`Seed: ${seed}`);
      console.log('Tip: re-run with --reset to wipe and reseed.');
    }
  } catch (e) {
    await db.query('ROLLBACK');
    console.error('Seeding failed:', e);
    process.exitCode = 1;
  } finally {
    await db.pool.end().catch(() => {});
  }
}

main();
