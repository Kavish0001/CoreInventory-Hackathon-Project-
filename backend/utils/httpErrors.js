class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function badRequest(message, details) {
  return new HttpError(400, message, details);
}

function unauthorized(message) {
  return new HttpError(401, message);
}

function forbidden(message) {
  return new HttpError(403, message);
}

function notFound(message) {
  return new HttpError(404, message);
}

module.exports = { HttpError, badRequest, unauthorized, forbidden, notFound };

