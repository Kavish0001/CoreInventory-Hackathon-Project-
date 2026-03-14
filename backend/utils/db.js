const { Pool } = require('pg');
const dotenv = require('dotenv');
const { getConfig } = require('./env');

dotenv.config();

const config = getConfig();

const pool = new Pool({
  user: config.db.user,
  host: config.db.host,
  database: config.db.name,
  password: config.db.password,
  port: config.db.port,
  max: config.db.max,
  idleTimeoutMillis: config.db.idleTimeoutMillis,
  connectionTimeoutMillis: config.db.connectionTimeoutMillis,
  ssl: config.db.ssl ? { rejectUnauthorized: false } : undefined,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
