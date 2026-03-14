const { Client } = require('pg');
const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ override: true, path: path.join(__dirname, '..', '.env') });

async function main() {
  const {
    DB_USER,
    DB_HOST,
    DB_PASSWORD,
    DB_PORT = '5432',
    DB_NAME = 'coreinventory_db',
    DB_SSL,
  } = process.env;

  if (!DB_USER || !DB_HOST || !DB_PASSWORD || !DB_NAME) {
    throw new Error('Missing DB env. Ensure backend/.env has DB_USER, DB_HOST, DB_PASSWORD, DB_NAME.');
  }

  const client = new Client({
    user: DB_USER,
    host: DB_HOST,
    password: DB_PASSWORD,
    port: Number.parseInt(DB_PORT, 10),
    database: 'postgres',
    ssl: DB_SSL && ['1', 'true', 'yes', 'on'].includes(String(DB_SSL).toLowerCase())
      ? { rejectUnauthorized: false }
      : undefined,
  });

  await client.connect();
  try {
    const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME]);
    if (exists.rows.length === 0) {
      await client.query(`CREATE DATABASE "${DB_NAME.replaceAll('"', '""')}"`);
      console.log(`Database created: ${DB_NAME}`);
    } else {
      console.log(`Database already exists: ${DB_NAME}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

