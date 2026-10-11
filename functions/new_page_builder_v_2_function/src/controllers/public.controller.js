'use strict';

const path = require('path');
const fs = require('fs');
const leads = require('../services/lead.service');
const verification = require('../services/verification.service');
const publicPage = require('../services/publicPage.service');
const { clientIp } = require('../middleware/rateLimit');
const { ok, asyncHandler, notFound } = require('../utils/http');
const { escapeHtml } = require('../utils/text');

const RUNTIME_FILE = path.join(__dirname, '..', 'runtime', 'page-runtime.js');
let runtimeCache = null;

const runtime = (req, res) => {
  if (!runtimeCache) runtimeCache = fs.readFileSync(RUNTIME_FILE, 'utf8');
  res.set('Content-Type', 'application/javascript; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=300');
  res.send(runtimeCache);
};

// Neutral SVG placeholder for images that are not generated yet.
const placeholder = (req, res) => {
  const w = Math.min(4000, Math.max(16, Number(req.query.w) || 1200));
  const h = Math.min(4000, Math.max(16, Number(req.query.h) || 800));
  const label = escapeHtml(String(req.query.t || 'Image').slice(0, 60));
  const fs1 = Math.max(14, Math.round(Math.min(w, h) / 16));
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E8EEF8"/><stop offset="1" stop-color="#D3DEEF"/></linearGradient></defs>' +
    `<rect width="100%" height="100%" fill="url(#g)"/>` +
    `<g fill="#004AAD" opacity=".45" transform="translate(${w / 2 - 28},${h / 2 - 52})"><rect x="0" y="0" width="56" height="44" rx="8" fill="none" stroke="#004AAD" stroke-width="4"/><circle cx="18" cy="15" r="6"/><path d="M4 40l16-16 10 10 8-8 14 14z"/></g>` +
    `<text x="50%" y="${h / 2 + 28}" font-family="Inter,Arial,sans-serif" font-size="${fs1}" fill="#3B5A85" text-anchor="middle">${label}</text></svg>`;
  res.set('Content-Type', 'image/svg+xml');
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(svg);
};

// The pb-* design system, for the builder canvas (published pages inline it).
const baseCss = (req, res) => {
  const { BASE_CSS, themeVars } = require('../shared/pageStyles');
  res.set('Content-Type', 'text/css; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=600');
  res.send(`${themeVars({})}${BASE_CSS}`);
};

const view = asyncHandler(async (req, res) => {
  await leads.trackView(req.capp, req.params.id, (req.body && req.body.tracking) || {});
  ok(res, { tracked: true });
});

const submitLead = asyncHandler(async (req, res) => {
  const result = await leads.capture(req.capp, req.params.id, req.body || {}, { ip: clientIp(req), userAgent: req.get('user-agent') });
  ok(res, result);
});

const sendOtp = asyncHandler(async (req, res) => ok(res, await verification.sendOtp(req.body && req.body.phone)));
const verifyOtp = asyncHandler(async (req, res) => ok(res, await verification.verifyOtp(req.body && req.body.phone, req.body && req.body.code)));

const pincode = asyncHandler(async (req, res) => {
  const found = await verification.lookupPincode(req.capp, req.params.pin);
  if (!found) throw notFound('Pincode not found');
  ok(res, found);
});

const sendHtml = (res, { status, html }) => {
  res.status(status || 200);
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Cache-Control', 'no-cache');
  res.set('X-Content-Type-Options', 'nosniff');
  res.send(html);
};

const publishedPage = asyncHandler(async (req, res) => {
  sendHtml(res, await publicPage.renderPublished(req.capp, req.params.slug));
});

module.exports = { runtime, placeholder, baseCss, view, submitLead, sendOtp, verifyOtp, pincode, publishedPage, sendHtml };
