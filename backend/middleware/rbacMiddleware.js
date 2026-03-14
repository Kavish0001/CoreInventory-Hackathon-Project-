const { forbidden } = require('../utils/httpErrors');

function requireRoles(...allowedRoles) {
  const allowed = new Set(allowedRoles.filter(Boolean));

  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !allowed.has(role)) {
      return next(forbidden('Insufficient permissions'));
    }
    return next();
  };
}

module.exports = { requireRoles };

