# CoreInventory Hackathon Project

CoreInventory is a modular inventory management platform built for hackathon delivery with production-style architecture.  
It supports end-to-end stock lifecycle operations across warehouses and locations:

- Authentication
- Dashboard metrics
- Product management
- Receipts (incoming stock)
- Delivery orders (outgoing stock)
- Internal transfers
- Stock adjustments
- Warehouse and location management
- Stock ledger and low-stock alerts

This implementation is aligned with the project source materials and focuses on backend-first correctness, modularity, and PostgreSQL-centric data integrity.

## Architecture

```text
React Frontend
   |
REST API (Node.js + Express)
   |
Controller Layer
   |
PostgreSQL Access Layer
   |
PostgreSQL Database
```

### Repository Structure

```text
backend/
  controllers/
  middleware/
  routes/
  utils/
  index.js

frontend/
  src/
    components/
    context/
    hooks/
    pages/
    services/

database/
  schema.sql
```

## Technology Stack

- Frontend: React, React Router, Axios, Tailwind CSS, Lucide Icons
- Backend: Node.js, Express, JWT, bcrypt, pg
- Database: PostgreSQL
- Validation and Quality: ESLint, modular route/controller separation

## Implemented Modules

### 1) Authentication

- Register and login endpoints
- Password hashing with bcrypt
- JWT-based authorization middleware
- Protected APIs for inventory operations and reports

### 2) Products

- Create, list, update, and get-by-id APIs
- Product attributes: name, SKU, category, unit, reorder level
- Search-ready frontend table

### 3) Warehouses and Locations

- Create and list warehouses
- Create and list inventory locations by warehouse
- Dedicated frontend page for warehouse management

### 4) Inventory Operations

- Receipts: increases stock + writes ledger entry
- Deliveries: validates availability, decreases stock + writes ledger
- Transfers: source decrement + destination increment + ledger entry
- Adjustments: reconciliation of counted stock with system stock + ledger entry

### 5) Reports

- Dashboard KPIs
- Stock ledger movement history
- Low-stock alerts

## Database Schema

The PostgreSQL schema is defined in `database/schema.sql` and includes:

- `users`
- `warehouses`
- `inventory_locations`
- `products`
- `stock`
- `receipts`, `receipt_items`
- `deliveries`, `delivery_items`
- `inventory_movements` (immutable operational ledger)

Key design principles:

- Stock snapshot table for current balances
- Separate movement ledger for traceability and audit
- Foreign-key relationships for integrity
- Conflict-safe stock upserts for location-level quantity maintenance

## API Overview

Base URL:

```text
http://localhost:5000/api
```

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/forgot-password` (returns `reset_code` only when `NODE_ENV != production`)
- `POST /auth/reset-password`

### Products

- `GET /products`
- `POST /products`
- `GET /products/:id`
- `PUT /products/:id`

### Warehouses

- `GET /warehouses`
- `POST /warehouses`
- `GET /warehouses/:warehouse_id/locations`
- `POST /warehouses/locations`

### Inventory

- `GET /inventory/receipts` (search: `?q=...`, filter: `?status=...`)
- `GET /inventory/deliveries` (search: `?q=...`, filter: `?status=...`)
- `POST /inventory/receipts` (creates Draft)
- `POST /inventory/receipts/:id/confirm` (Draft → Ready)
- `POST /inventory/receipts/:id/validate` (Ready → Done; updates stock + ledger)
- `POST /inventory/deliveries` (creates Draft)
- `POST /inventory/deliveries/:id/confirm` (Draft → Ready/Waiting based on stock)
- `POST /inventory/deliveries/:id/validate` (Ready → Done; updates stock + ledger)
- `POST /inventory/transfers`
- `POST /inventory/adjustments`

### Reports

- `GET /reports/dashboard`
- `GET /reports/ledger` (search: `?q=...`)
- `GET /reports/low-stock`
- `GET /reports/stock`

## Local Setup

## 1) Database

1. Create a PostgreSQL database named `coreinventory_db`
2. Execute `database/schema.sql` (or run `npm run init-db` from `backend/`)

## 2) Backend

```bash
cd backend
npm install
```

Create `.env` from `.env.example` and configure:

```env
PORT=5000
DB_USER=your_user
DB_HOST=localhost
DB_NAME=coreinventory_db
DB_PASSWORD=your_password
DB_PORT=5432
JWT_SECRET=your_jwt_secret
```

Run backend:

```bash
npm run start
```

## 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default:

```text
http://localhost:5173
```

## Validation Status

- Frontend lint passes (`npm run lint`)
- Frontend production build passes (`npm run build`)
- Backend entry syntax check passes (`node --check index.js`)

## Suggested Demo Flow

1. Login
2. Create warehouse and location
3. Create product
4. Create receipt to add stock
5. Transfer stock between locations
6. Create delivery
7. Run adjustment
8. Show live stock ledger and dashboard KPI updates

## Team Split (4-Developer Hackathon Model)

- Developer 1: Database schema + stock logic
- Developer 2: Backend routing/controllers
- Developer 3: Frontend pages and UX
- Developer 4: Auth, integration, validation, and final polish
