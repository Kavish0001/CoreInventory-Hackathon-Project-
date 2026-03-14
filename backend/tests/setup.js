const fs = require('node:fs');
const path = require('node:path');

process.env.NODE_ENV = 'test';

const db = require('../utils/db');

async function applySchema() {
  const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await db.query(schema);
}

async function truncateAllTables() {
  const result = await db.query(
    `SELECT tablename
     FROM pg_tables
     WHERE schemaname = 'public'`
  );

  const tables = result.rows.map((r) => r.tablename).filter(Boolean);
  if (tables.length === 0) return;

  const quoted = tables.map((t) => `"${String(t).replace(/"/g, '""')}"`).join(', ');
  await db.query(`TRUNCATE ${quoted} RESTART IDENTITY CASCADE`);
}

global.__db = db;
global.__truncateAllTables = truncateAllTables;

beforeAll(async () => {
  await applySchema();
  await truncateAllTables();
});

afterEach(async () => {
  await truncateAllTables();
});

afterAll(async () => {
  await truncateAllTables();
  await db.pool.end();
});

