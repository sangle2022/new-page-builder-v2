'use strict';

class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const badRequest = (msg, details) => new ApiError(400, msg, details);
const unauthorized = (msg = 'Sign in required') => new ApiError(401, msg);
const forbidden = (msg = 'You do not have permission to do this') => new ApiError(403, msg);
const notFound = (msg = 'Not found') => new ApiError(404, msg);
const conflict = (msg, details) => new ApiError(409, msg, details);

// Wraps an async route handler so rejected promises reach the error middleware.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const ok = (res, data, extra = {}) => res.status(200).json({ success: true, data, ...extra });
const created = (res, data, extra = {}) => res.status(201).json({ success: true, data, ...extra });

module.exports = { ApiError, badRequest, unauthorized, forbidden, notFound, conflict, asyncHandler, ok, created };
