const jwt = require('jsonwebtoken');
const { unauthorized } = require('../utils/httpErrors');
const { getConfig } = require('../utils/env');

const authMiddleware = (req, res, next) => {
  try {
    const header = req.header('Authorization') || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1];

    if (!token) throw unauthorized('No token, authorization denied');

    const config = getConfig();
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    return next();
  } catch (err) {
    return next(unauthorized('Token is not valid'));
  }
};

module.exports = authMiddleware;
