'use strict';

const config = require('../config');
const gemini = require('../services/ai/gemini.client');
const pageGeneration = require('../services/ai/pageGeneration.service');
const pageModification = require('../services/ai/pageModification.service');
const content = require('../services/ai/contentGeneration.service');
const images = require('../services/ai/imageGeneration.service');
const aiLog = require('../services/ai/aiLog.service');
const pages = require('../services/page.service');
const aiJobs = require('../services/ai/aiJobs.service');
const { ok, asyncHandler, forbidden } = require('../utils/http');

const status = (req, res) =>
  ok(res, {
    enabled: gemini.isConfigured(),
    textModel: config.gemini.textModel,
    imageModel: config.gemini.imageModel,
    reuseThreshold: config.gemini.reuseThreshold,
    backgroundJobs: aiJobs.jobsEnabled(),
  });

const generatePage = asyncHandler(async (req, res) => ok(res, await pageGeneration.generate(req.capp, req.user, req.body || {})));

const modifyPage = asyncHandler(async (req, res) => {
  const b = req.body || {};
  if (b.pageId) {
    const page = pages.toDto(await pages.getRow(req.capp, b.pageId));
    if (!pages.canEdit(req.user, page)) throw forbidden('You cannot edit this page');
  }
  ok(res, await pageModification.modify(req.capp, req.user, b));
});

const rewrite = asyncHandler(async (req, res) => ok(res, await content.rewrite(req.capp, req.user, req.body || {})));
const seo = asyncHandler(async (req, res) => ok(res, await content.seo(req.capp, req.user, req.body || {})));
const imagePrompt = asyncHandler(async (req, res) => ok(res, await content.enhanceImagePrompt(req.capp, req.user, req.body || {})));
const suggestImages = asyncHandler(async (req, res) => ok(res, await images.suggest(req.capp, (req.body || {}).prompt)));
const generateImage = asyncHandler(async (req, res) => ok(res, await images.generate(req.capp, req.user, req.body || {})));
// Start any AI task. Returns the result directly, or a jobId to poll when
// background jobs are enabled (AI_JOBPOOL).
const startJob = asyncHandler(async (req, res) => {
  const { kind, payload = {} } = req.body || {};
  if (kind === 'page_modify' && payload.pageId) {
    const page = pages.toDto(await pages.getRow(req.capp, payload.pageId));
    if (!pages.canEdit(req.user, page)) throw forbidden('You cannot edit this page');
  }
  ok(res, await aiJobs.start(req.capp, req.user, kind, payload));
});
const getJob = asyncHandler(async (req, res) => ok(res, await aiJobs.get(req.capp, req.user, req.params.id)));

const usage = asyncHandler(async (req, res) => ok(res, await aiLog.usageSummary(req.capp, { days: Number(req.query.days) || 30 })));

module.exports = { startJob, getJob, status, generatePage, modifyPage, rewrite, seo, imagePrompt, suggestImages, generateImage, usage };
