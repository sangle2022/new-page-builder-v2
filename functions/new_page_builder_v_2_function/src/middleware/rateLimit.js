'use strict';

// Small in-memory rate limiter for public endpoints (lead submit, OTP).
// Function instances are short-lived and not shared, so this is a speed bump
// against scripted abuse, not a hard global limit. Captcha and OTP are the
// real protections.

const buckets = new Map();

function clientIp(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || req.ip || (req.socket && req.socket.remoteAddress) || 'unknown';
}

const rateLimit = ({ windowMs = 60000, max = 20, key = 'default' } = {}) => (req, res, next) => {
  const now = Date.now();
  const id = `${key}:${clientIp(req)}`;
  const entry = buckets.get(id);
  if (!entry || entry.reset < now) {
    buckets.set(id, { count: 1, reset: now + windowMs });
  } else {
    entry.count += 1;
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({ success: false, message: 'Too many requests. Please wait a minute and try again.' });
    }
  }
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
  }
  return next();
};

module.exports = { rateLimit, clientIp };
