-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    login_id VARCHAR(12) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Password reset (no 3rd-party email/SMS; codes are generated server-side)
CREATE TABLE IF NOT EXISTS password_reset_codes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_user_id ON password_reset_codes(user_id);

-- Warehouses Table
CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_code VARCHAR(16) UNIQUE, -- e.g. WH
    location VARCHAR(255),
    address VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Locations (Within Warehouses)
CREATE TABLE IF NOT EXISTS inventory_locations (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE,
    location_name VARCHAR(255) NOT NULL,
    short_code VARCHAR(32),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_locations_wh_short_code ON inventory_locations(warehouse_id, short_code);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(50),
    reorder_level INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stock Table (Snapshot)
CREATE TABLE IF NOT EXISTS stock (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES inventory_locations(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 0,
    UNIQUE(product_id, warehouse_id, location_id)
);

-- Receipts Table
CREATE TABLE IF NOT EXISTS receipts (
    id SERIAL PRIMARY KEY,
    supplier VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE RESTRICT,
    location_id INTEGER REFERENCES inventory_locations(id) ON DELETE RESTRICT,
    schedule_date DATE,
    responsible_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, waiting, ready, done, cancelled
    reference_code VARCHAR(64) UNIQUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT receipts_status_check CHECK (status IN ('draft','waiting','ready','done','cancelled'))
);

-- Receipt Items Table
CREATE TABLE IF NOT EXISTS receipt_items (
    id SERIAL PRIMARY KEY,
    receipt_id INTEGER REFERENCES receipts(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL
);

-- Deliveries Table
CREATE TABLE IF NOT EXISTS deliveries (
    id SERIAL PRIMARY KEY,
    customer VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    delivery_address VARCHAR(500),
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE RESTRICT,
    location_id INTEGER REFERENCES inventory_locations(id) ON DELETE RESTRICT,
    schedule_date DATE,
    responsible_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, waiting, ready, done, cancelled
    reference_code VARCHAR(64) UNIQUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT deliveries_status_check CHECK (status IN ('draft','waiting','ready','done','cancelled'))
);

-- Delivery Items Table
CREATE TABLE IF NOT EXISTS delivery_items (
    id SERIAL PRIMARY KEY,
    delivery_id INTEGER REFERENCES deliveries(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL
);

-- Internal Transfers (document table; movements stay in ledger)
CREATE TABLE IF NOT EXISTS transfers (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE RESTRICT,
    source_location_id INTEGER REFERENCES inventory_locations(id) ON DELETE RESTRICT,
    destination_location_id INTEGER REFERENCES inventory_locations(id) ON DELETE RESTRICT,
    status VARCHAR(50) DEFAULT 'draft',
    reference_code VARCHAR(64) UNIQUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT transfers_status_check CHECK (status IN ('draft','waiting','ready','done','cancelled'))
);

CREATE TABLE IF NOT EXISTS transfer_items (
    id SERIAL PRIMARY KEY,
    transfer_id INTEGER REFERENCES transfers(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0)
);

-- Stock Adjustments (document table; movements stay in ledger)
CREATE TABLE IF NOT EXISTS adjustments (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE RESTRICT,
    location_id INTEGER REFERENCES inventory_locations(id) ON DELETE RESTRICT,
    status VARCHAR(50) DEFAULT 'draft',
    reference_code VARCHAR(64) UNIQUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT adjustments_status_check CHECK (status IN ('draft','waiting','ready','done','cancelled'))
);

CREATE TABLE IF NOT EXISTS adjustment_items (
    id SERIAL PRIMARY KEY,
    adjustment_id INTEGER REFERENCES adjustments(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,
    system_quantity INTEGER NOT NULL,
    counted_quantity INTEGER NOT NULL,
    difference INTEGER NOT NULL
);

-- Inventory Movements (Ledger)
CREATE TABLE IF NOT EXISTS inventory_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    type VARCHAR(50) NOT NULL, -- RECEIPT, DELIVERY, TRANSFER, ADJUSTMENT
    source_location_id INTEGER REFERENCES inventory_locations(id),
    destination_location_id INTEGER REFERENCES inventory_locations(id),
    quantity INTEGER NOT NULL,
    reference_id INTEGER, -- ID of receipt, delivery, etc.
    reference_code VARCHAR(64),
    contact VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference_code ON inventory_movements(reference_code);

-- ----------------------------------------
-- Lightweight "migrations" for dev: ensure
-- existing tables get new columns when the
-- DB was created with an older schema.sql.
-- ----------------------------------------

-- users
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_id VARCHAR(12);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'users_login_id_key'
  ) THEN
    CREATE UNIQUE INDEX users_login_id_key ON users(login_id);
  END IF;
END $$;

-- warehouses
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS short_code VARCHAR(16);
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS address VARCHAR(500);
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'warehouses_short_code_key'
  ) THEN
    CREATE UNIQUE INDEX warehouses_short_code_key ON warehouses(short_code);
  END IF;
END $$;

-- inventory_locations
ALTER TABLE inventory_locations ADD COLUMN IF NOT EXISTS short_code VARCHAR(32);
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uq_inventory_locations_wh_short_code'
  ) THEN
    CREATE UNIQUE INDEX uq_inventory_locations_wh_short_code ON inventory_locations(warehouse_id, short_code);
  END IF;
END $$;

-- receipts
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS contact VARCHAR(255);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS warehouse_id INTEGER;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS location_id INTEGER;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS schedule_date DATE;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS responsible_user_id INTEGER;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS reference_code VARCHAR(64);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS created_by INTEGER;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'receipts_reference_code_key'
  ) THEN
    CREATE UNIQUE INDEX receipts_reference_code_key ON receipts(reference_code);
  END IF;
END $$;

-- deliveries
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS contact VARCHAR(255);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS delivery_address VARCHAR(500);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS warehouse_id INTEGER;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS location_id INTEGER;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS schedule_date DATE;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS responsible_user_id INTEGER;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS reference_code VARCHAR(64);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS created_by INTEGER;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'deliveries_reference_code_key'
  ) THEN
    CREATE UNIQUE INDEX deliveries_reference_code_key ON deliveries(reference_code);
  END IF;
END $$;

-- inventory_movements
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS reference_code VARCHAR(64);
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS contact VARCHAR(255);
