function required(name) {
  const value = process.env[name];
  if (value == null || String(value).trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name, fallback) {
  const value = process.env[name];
  if (value == null || String(value).trim() === '') return fallback;
  return value;
}

function optionalInt(name, fallback) {
  const raw = optional(name, null);
  if (raw == null) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function optionalBool(name, fallback) {
  const raw = optional(name, null);
  if (raw == null) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(raw).toLowerCase());
}

function getConfig() {
  const nodeEnv = optional('NODE_ENV', 'development');
  const isProduction = nodeEnv === 'production';

  return {
    nodeEnv,
    isProduction,
    port: optionalInt('PORT', 5000),
    jwtSecret: required('JWT_SECRET'),
    jwtExpiresIn: optional('JWT_EXPIRES_IN', '1h'),
    corsOrigin: optional('CORS_ORIGIN', isProduction ? '' : '*'),
    db: {
      user: required('DB_USER'),
      host: required('DB_HOST'),
      name: required('DB_NAME'),
      password: required('DB_PASSWORD'),
      port: optionalInt('DB_PORT', 5432),
      max: optionalInt('DB_POOL_MAX', 10),
      idleTimeoutMillis: optionalInt('DB_IDLE_TIMEOUT_MS', 30000),
      connectionTimeoutMillis: optionalInt('DB_CONN_TIMEOUT_MS', 5000),
      ssl: optionalBool('DB_SSL', false),
    },
  };
}

module.exports = { getConfig, required, optional, optionalInt, optionalBool };

