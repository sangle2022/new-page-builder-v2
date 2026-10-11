'use strict';

const leads = require('../services/lead.service');
const { ok, asyncHandler } = require('../utils/http');

const list = asyncHandler(async (req, res) => ok(res, await leads.list(req.capp, req.query)));
const get = asyncHandler(async (req, res) => ok(res, await leads.get(req.capp, req.params.id)));
const update = asyncHandler(async (req, res) => ok(res, await leads.update(req.capp, req.user, req.params.id, req.body || {})));
const remove = asyncHandler(async (req, res) => ok(res, await leads.remove(req.capp, req.user, req.params.id)));
const retryCrm = asyncHandler(async (req, res) => ok(res, await leads.retryCrm(req.capp, req.user, req.params.id)));
const channels = asyncHandler(async (req, res) => ok(res, await leads.channelStats(req.capp, req.query)));
const meta = (req, res) => ok(res, { statuses: leads.LEAD_STATUSES, channels: leads.CHANNELS });

const exportCsv = asyncHandler(async (req, res) => {
  const csv = await leads.exportCsv(req.capp, req.query);
  const stamp = new Date().toISOString().slice(0, 10);
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', `attachment; filename="leads-${stamp}.csv"`);
  res.send(csv);
});

module.exports = { list, get, update, remove, retryCrm, channels, meta, exportCsv };
