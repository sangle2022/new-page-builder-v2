'use strict';

const crypto = require('crypto');
const config = require('../config');

// Small signed tokens (payload.signature) used for OTP verification proofs,
// partial-lead continuation and the CRM OAuth state parameter. They stop a
// visitor from forging "OTP verified" or editing someone else's lead.

const b64 = (s) => Buffer.from(s).toString('base64url');
const unb64 = (s) => Buffer.from(s, 'base64url').toString('utf8');
const hmac = (data) => crypto.createHmac('sha256', config.signingSecret).update(data).digest('base64url');

function sign(payload, ttlSeconds = 3600) {
  const body = b64(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds }));
  return `${body}.${hmac(body)}`;
}

function verify(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = hmac(body);
  if (!sig || sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(unb64(body));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

module.exports = { sign, verify };
