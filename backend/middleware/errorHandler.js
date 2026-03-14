const { HttpError } = require('../utils/httpErrors');

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const requestId = req.requestId;

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
      ...(requestId ? { request_id: requestId } : {}),
    });
  }

  // Fallback: avoid leaking internals in production
  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction ? 'Server error' : (err?.message || 'Server error');

  // eslint-disable-next-line no-console
  console.error(requestId ? `[${requestId}]` : '', err);

  return res.status(500).json({
    message,
    ...(requestId ? { request_id: requestId } : {}),
  });
}

module.exports = errorHandler;

