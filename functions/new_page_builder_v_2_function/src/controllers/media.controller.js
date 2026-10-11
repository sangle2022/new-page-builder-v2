'use strict';

const media = require('../services/media.service');
const { ok, created, asyncHandler, badRequest } = require('../utils/http');

const list = asyncHandler(async (req, res) => ok(res, await media.list(req.capp, { ...req.query, semantic: req.query.semantic !== 'false' })));
const stats = asyncHandler(async (req, res) => ok(res, await media.stats(req.capp)));

// multipart/form-data, field "files" (one or many), optional "tags" (comma
// separated) and "description".
const upload = asyncHandler(async (req, res) => {
  const raw = req.files && (req.files.files || req.files.file);
  const files = Array.isArray(raw) ? raw : raw ? [raw] : [];
  if (!files.length) throw badRequest('Choose at least one image');
  if (files.length > 20) throw badRequest('Upload up to 20 images at a time');
  const tags = String((req.body && req.body.tags) || '').split(',').filter(Boolean);
  const description = String((req.body && req.body.description) || '');
  const results = [];
  const errors = [];
  for (const f of files) {
    try {
      // eslint-disable-next-line no-await-in-loop
      results.push(await media.upload(req.capp, req.user, f, { tags, description }));
    } catch (e) {
      errors.push({ name: f.name, message: e.message });
    }
  }
  if (!results.length) throw badRequest(errors.map((e) => e.message).join(' '));
  created(res, results, { errors });
});

const update = asyncHandler(async (req, res) => ok(res, await media.update(req.capp, req.user, req.params.id, req.body || {})));
const remove = asyncHandler(async (req, res) => ok(res, await media.remove(req.capp, req.user, req.params.id)));
const markUsed = asyncHandler(async (req, res) => ok(res, await media.markUsed(req.capp, (req.body && req.body.ids) || [])));

module.exports = { list, stats, upload, update, remove, markUsed };
