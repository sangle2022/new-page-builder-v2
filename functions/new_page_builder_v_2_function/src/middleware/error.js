'use strict';

const { ApiError } = require('../utils/http');

// Internals are logged, never sent to the client.
// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  const status = err instanceof ApiError ? err.status : err.status || err.statusCode || 500;
  if (status >= 500) console.error(`[${req.method} ${req.originalUrl}]`, err);
  const message =
    status >= 500 && !(err instanceof ApiError) ? 'Something went wrong. Please try again.' : err.message;
  if (res.headersSent) return undefined;
  return res
    .status(status)
    .json({ success: false, message, ...(err.details ? { details: err.details } : {}) });
};
