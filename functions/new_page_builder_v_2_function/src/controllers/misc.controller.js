'use strict';

// Smaller areas: current user, templates, CRM, analytics, administration.

const config = require('../config');
const templates = require('../services/template.service');
const { buildDocument } = require('../shared/pageDocument');
const crm = require('../services/crm/crm.service');
const crmAuth = require('../services/crm/crmAuth.service');
const analytics = require('../services/analytics.service');
const admin = require('../services/admin.service');
const settings = require('../services/settings.service');
const roleSettings = require('../services/roleSettings.service');
const gemini = require('../services/ai/gemini.client');
const { PERMISSION_LABELS } = require('../config/roles');
const { ok, created, asyncHandler } = require('../utils/http');

// ---- me ----
const me = asyncHandler(async (req, res) => {
  ok(res, {
    user: req.user,
    permissionLabels: PERMISSION_LABELS,
    app: {
      functionBase: config.functionBase,
      publicBase: `${config.functionBase}/p/`,
      requireApproval: config.workflow.requireApproval,
      aiEnabled: gemini.isConfigured(),
      otpDemo: config.otp.provider === 'dummy',
    },
  });
});

// ---- templates ----
const listTemplates = asyncHandler(async (req, res) => ok(res, await templates.list(req.capp)));
const getTemplate = asyncHandler(async (req, res) => ok(res, await templates.preview(req.capp, req.params.key)));
// Full HTML document of a template, for preview iframes (no scripts).
const templatePreviewHtml = asyncHandler(async (req, res) => {
  const t = await templates.load(req.capp, req.params.key);
  // No page runtime in previews: show the first step of multi-step forms.
  const firstStep =
    '<script>document.querySelectorAll(\'.pb-form[data-pb-steps="true"]\').forEach(function(f){' +
    "var s=f.querySelector('.pb-form-step');if(s)s.classList.add('is-active')})</script>";
  const html = buildDocument({ title: t.name, body: t.html, css: t.css, theme: t.theme, bodyExtra: firstStep });
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Cache-Control', 'private, max-age=600');
  res.send(html);
});
const deleteTemplate = asyncHandler(async (req, res) => ok(res, await templates.remove(req.capp, req.user, req.params.id)));
const blocks = (req, res) => {
  res.set('Cache-Control', 'private, max-age=600');
  ok(res, templates.blocks());
};

// ---- CRM ----
const crmStatus = asyncHandler(async (req, res) => ok(res, await crmAuth.status(req.capp)));
const crmConnect = asyncHandler(async (req, res) => ok(res, { url: crmAuth.authorizeUrl(req.user) }));
const crmDisconnect = asyncHandler(async (req, res) => {
  await crmAuth.disconnect(req.capp);
  ok(res, { connected: false });
});
const crmLayouts = asyncHandler(async (req, res) => ok(res, await crm.getLayouts(req.capp)));
const crmFields = asyncHandler(async (req, res) => ok(res, await crm.getFields(req.capp, req.query.layoutId)));
const crmSources = (req, res) => ok(res, crm.SPECIAL_SOURCES);

// Zoho redirects the browser here after consent; send the user back to the
// app's settings screen with the result.
const crmCallback = async (req, res) => {
  const back = (q) => res.redirect(`${config.clientBase}/index.html#/settings?tab=crm&${q}`);
  try {
    if (req.query.error) return back(`crm=error&message=${encodeURIComponent(req.query.error)}`);
    await crmAuth.handleCallback(req.capp, req.user, {
      code: req.query.code,
      state: req.query.state,
      accountsServer: req.query['accounts-server'],
    });
    return back('crm=connected');
  } catch (e) {
    return back(`crm=error&message=${encodeURIComponent(e.message)}`);
  }
};

// ---- analytics ----
const dashboard = asyncHandler(async (req, res) => ok(res, await analytics.dashboard(req.capp)));
const reports = asyncHandler(async (req, res) => ok(res, await analytics.reports(req.capp, req.query)));

// ---- admin ----
const setupCheck = asyncHandler(async (req, res) => ok(res, await admin.setupCheck(req.capp)));
const users = asyncHandler(async (req, res) => ok(res, await admin.listUsers(req.userApp, req.capp)));
const roles = (req, res) => ok(res, admin.roleMatrix());
const saveRoles = asyncHandler(async (req, res) => {
  await roleSettings.save(req.capp, (req.body || {}).matrix || {});
  ok(res, admin.roleMatrix());
});
const resetRoles = asyncHandler(async (req, res) => {
  await roleSettings.reset(req.capp);
  ok(res, admin.roleMatrix());
});
const getCaptcha = asyncHandler(async (req, res) => {
  const keys = await settings.getCaptchaKeys(req.capp);
  ok(res, { siteKey: (keys && keys.siteKey) || '', hasSecret: !!(keys && keys.secretKey) });
});
const saveCaptcha = asyncHandler(async (req, res) => {
  const b = req.body || {};
  await settings.setCaptchaKeys(req.capp, { siteKey: String(b.siteKey || '').trim(), secretKey: String(b.secretKey || '').trim() });
  ok(res, { saved: true });
});
const listPincodes = asyncHandler(async (req, res) => ok(res, await admin.listPincodes(req.capp, req.query)));
const savePincode = asyncHandler(async (req, res) => created(res, await admin.upsertPincode(req.capp, { ...(req.body || {}), id: req.params.id })));
const importPincodes = asyncHandler(async (req, res) => ok(res, await admin.importPincodes(req.capp, (req.body || {}).rows)));
const deletePincode = asyncHandler(async (req, res) => ok(res, await admin.deletePincode(req.capp, req.params.id)));

module.exports = {
  me,
  listTemplates,
  getTemplate,
  templatePreviewHtml,
  deleteTemplate,
  blocks,
  crmStatus,
  crmConnect,
  crmDisconnect,
  crmLayouts,
  crmFields,
  crmSources,
  crmCallback,
  dashboard,
  reports,
  setupCheck,
  users,
  roles,
  saveRoles,
  resetRoles,
  getCaptcha,
  saveCaptcha,
  listPincodes,
  savePincode,
  importPincodes,
  deletePincode,
};
