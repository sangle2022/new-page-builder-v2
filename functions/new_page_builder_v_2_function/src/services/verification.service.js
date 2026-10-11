'use strict';

const axios = require('axios');
const config = require('../config');
const db = require('../utils/db');
const settings = require('./settings.service');
const { sign, verify } = require('../utils/sign');
const { badRequest } = require('../utils/http');

// ---------- reCAPTCHA (verified on the server; V1 only checked it in the browser) ----------
async function verifyCaptcha(capp, token, remoteIp) {
  const keys = await settings.getCaptchaKeys(capp);
  if (!keys || !keys.secretKey) return true; // not configured: nothing to enforce
  if (!token) return false;
  try {
    const params = new URLSearchParams({ secret: keys.secretKey, response: token });
    if (remoteIp) params.append('remoteip', remoteIp);
    const { data } = await axios.post('https://www.google.com/recaptcha/api/siteverify', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 8000,
    });
    return !!data.success;
  } catch (e) {
    console.error('[captcha] verification error', e.message);
    return false;
  }
}

// ---------- OTP ----------
// Providers: "dummy" (fixed code, for development/demo) and "karix" (the SMS
// gateway V1 integrated). The browser never learns the code; after a
// successful check it receives a signed token bound to the number, and the
// lead endpoint requires that token.

const normalizePhone = (p) => String(p || '').replace(/\D/g, '').slice(-10);

async function karixCall(path, params) {
  const k = config.otp.karix;
  if (!k.accessKey || !k.departmentId) throw badRequest('OTP provider is not configured');
  const { data } = await axios.get(`${k.baseUrl}/${path}`, {
    params: { ipaddress: k.ipAddress, ...params },
    headers: { access_key: k.accessKey, 'department-id': k.departmentId },
    timeout: 10000,
  });
  return String(data || '');
}

async function sendOtp(phone) {
  const p = normalizePhone(phone);
  if (p.length !== 10) throw badRequest('Enter a valid 10 digit mobile number');
  if (config.otp.provider === 'karix') {
    const res = await karixCall('otpgenservlet', { mobile: `${config.otp.karix.countryCode}${p}` });
    if (!/generated successfully/i.test(res)) throw badRequest('Could not send the OTP. Please try again.');
    return { sent: true };
  }
  return { sent: true, hint: `Demo mode: use ${config.otp.dummyCode}` };
}

async function verifyOtp(phone, code) {
  const p = normalizePhone(phone);
  if (p.length !== 10 || !/^\d{4,8}$/.test(String(code || ''))) throw badRequest('Enter the code you received');
  let okCode = false;
  if (config.otp.provider === 'karix') {
    const res = await karixCall('otpvalidationservlet', { mobile: `${config.otp.karix.countryCode}${p}`, otp: code });
    okCode = /verified successfully/i.test(res);
  } else {
    okCode = String(code) === config.otp.dummyCode;
  }
  if (!okCode) throw badRequest('That code is not right. Please check and try again.');
  return { verified: true, otpToken: sign({ t: 'otp', phone: p }, 60 * 60) };
}

function isOtpTokenValid(token, phone) {
  const payload = verify(token);
  return !!payload && payload.t === 'otp' && payload.phone === normalizePhone(phone);
}

// ---------- Pincode lookup (V1 Pincodes table) ----------
async function lookupPincode(capp, pincode) {
  if (!/^\d{6}$/.test(String(pincode || ''))) throw badRequest('Enter a 6 digit pincode');
  const rows = await db.select(capp, 'Pincodes', `pincode = ${db.q(pincode)}`, 'LIMIT 100');
  if (!rows.length) return null;
  return {
    pincode,
    areas: [...new Set(rows.map((r) => r.area_name).filter(Boolean))],
    city: rows[0].city || '',
    state: rows[0].state || '',
    country: rows[0].country || 'India',
  };
}

module.exports = { verifyCaptcha, sendOtp, verifyOtp, isOtpTokenValid, normalizePhone, lookupPincode };
