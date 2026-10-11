'use strict';

// Routes reachable without signing in: published-page support only.

const express = require('express');
const c = require('../controllers/public.controller');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

// Published pages call these from other origins (embeds, custom domains).
router.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
});

router.get('/runtime.js', c.runtime);
router.get('/placeholder.svg', c.placeholder);
router.get('/page-base.css', c.baseCss);
router.post('/pages/:id/view', rateLimit({ key: 'view', max: 60 }), c.view);
router.post('/pages/:id/leads', rateLimit({ key: 'lead', max: 15 }), c.submitLead);
router.post('/otp/send', rateLimit({ key: 'otp-send', max: 5 }), c.sendOtp);
router.post('/otp/verify', rateLimit({ key: 'otp-verify', max: 10 }), c.verifyOtp);
router.get('/pincode/:pin', rateLimit({ key: 'pincode', max: 60 }), c.pincode);

module.exports = router;
