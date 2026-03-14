const jwt = require('jsonwebtoken');
const { unauthorized } = require('../utils/httpErrors');
const { getConfig } = require('../utils/env');
const db = require('../utils/db');

const authMiddleware = async (req, res, next) => {
  try {
    const header = req.header('Authorization') || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1];

    if (!token) throw unauthorized('No token, authorization denied');

    const config = getConfig();
    const decoded = jwt.verify(token, config.jwtSecret);

    // Hydrate role from DB (token contains user_id only)
    const userRow = await db.query('SELECT id, role FROM users WHERE id = $1', [decoded.user_id]);
    if (userRow.rows.length === 0) throw unauthorized('User not found');

    req.user = { ...decoded, role: userRow.rows[0].role };
    return next();
  } catch (err) {
    return next(unauthorized('Token is not valid'));
  }
};

module.exports = authMiddleware;
