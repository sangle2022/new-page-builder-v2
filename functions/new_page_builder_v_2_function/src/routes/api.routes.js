'use strict';

// Authenticated API. Every route requires a signed-in Catalyst user and the
// permission listed next to it (see config/roles.js).

const express = require('express');
const { requireAuth, requirePermission: can } = require('../middleware/auth');
const { P } = require('../config/roles');
const pages = require('../controllers/page.controller');
const leads = require('../controllers/lead.controller');
const media = require('../controllers/media.controller');
const ai = require('../controllers/ai.controller');
const m = require('../controllers/misc.controller');

const router = express.Router();
router.use(requireAuth);

router.get('/me', m.me);

// ---- pages ----
router.get('/pages', can(P.PAGE_VIEW), pages.list);
router.post('/pages', can(P.PAGE_CREATE), pages.create);
router.get('/pages/slug-available', can(P.PAGE_VIEW), pages.slugAvailable);
router.get('/pages/:id', can(P.PAGE_VIEW), pages.get);
router.patch('/pages/:id', can(P.PAGE_EDIT), pages.updateMeta);
router.delete('/pages/:id', can([P.PAGE_DELETE, P.PAGE_CREATE]), pages.remove);
router.get('/pages/:id/document', can(P.PAGE_VIEW), pages.getDocument);
router.put('/pages/:id/document', can(P.PAGE_EDIT), pages.saveDocument);
router.post('/pages/:id/duplicate', can(P.PAGE_CREATE), pages.duplicate);
router.get('/pages/:id/preview', can(P.PAGE_VIEW), pages.preview);
router.get('/pages/:id/versions', can(P.PAGE_VIEW), pages.versions);
router.post('/pages/:id/versions/:n/restore', can(P.PAGE_EDIT), pages.restoreVersion);
router.get('/pages/:id/history', can(P.PAGE_VIEW), pages.history);
router.get('/pages/:id/share', can(P.PAGE_VIEW), pages.share);
router.get('/pages/:id/mapping', can(P.PAGE_VIEW), pages.getMapping);
router.put('/pages/:id/mapping', can([P.PAGE_EDIT, P.CRM_MANAGE]), pages.saveMapping);
router.post('/pages/:id/template', can(P.TEMPLATE_MANAGE), pages.saveAsTemplate);

// ---- workflow ----
router.get('/approvals', can(P.PAGE_VIEW), pages.approvals);
router.post('/pages/:id/submit', can(P.PAGE_SUBMIT), pages.submit);
router.post('/pages/:id/withdraw', can([P.PAGE_SUBMIT, P.PAGE_APPROVE]), pages.withdraw);
router.post('/pages/:id/approve', can(P.PAGE_APPROVE), pages.approve);
router.post('/pages/:id/reject', can(P.PAGE_APPROVE), pages.reject);
router.post('/pages/:id/publish', can(P.PAGE_PUBLISH), pages.publish);
router.post('/pages/:id/unpublish', can(P.PAGE_PUBLISH), pages.unpublish);

// ---- leads ----
router.get('/leads', can(P.LEAD_VIEW), leads.list);
router.get('/leads/meta', can(P.LEAD_VIEW), leads.meta);
router.get('/leads/export', can(P.LEAD_EXPORT), leads.exportCsv);
router.get('/leads/channels', can(P.LEAD_VIEW), leads.channels);
router.get('/leads/:id', can(P.LEAD_VIEW), leads.get);
router.patch('/leads/:id', can(P.LEAD_UPDATE), leads.update);
router.delete('/leads/:id', can(P.LEAD_DELETE), leads.remove);
router.post('/leads/:id/crm-sync', can(P.LEAD_UPDATE), leads.retryCrm);

// ---- media gallery ----
router.get('/media', can(P.MEDIA_VIEW), media.list);
router.get('/media/stats', can(P.MEDIA_VIEW), media.stats);
router.post('/media', can(P.MEDIA_UPLOAD), media.upload);
router.post('/media/used', can(P.MEDIA_VIEW), media.markUsed);
router.patch('/media/:id', can(P.MEDIA_UPLOAD), media.update);
router.delete('/media/:id', can([P.MEDIA_DELETE, P.MEDIA_UPLOAD]), media.remove);

// ---- AI ----
router.get('/ai/status', ai.status);
router.post('/ai/jobs', can(P.AI_USE), ai.startJob);
router.get('/ai/jobs/:id', can([P.AI_USE, P.MEDIA_VIEW]), ai.getJob);
router.post('/ai/pages/generate', can(P.AI_USE), ai.generatePage);
router.post('/ai/pages/modify', can(P.AI_USE), ai.modifyPage);
router.post('/ai/content/rewrite', can(P.AI_USE), ai.rewrite);
router.post('/ai/content/seo', can(P.AI_USE), ai.seo);
router.post('/ai/images/prompt', can(P.AI_USE), ai.imagePrompt);
router.post('/ai/images/suggest', can(P.MEDIA_VIEW), ai.suggestImages);
router.post('/ai/images/generate', can(P.AI_USE), ai.generateImage);
router.get('/ai/usage', can(P.REPORTS_VIEW), ai.usage);

// ---- templates ----
router.get('/templates', can(P.PAGE_VIEW), m.listTemplates);
router.get('/templates/blocks', can(P.PAGE_VIEW), m.blocks);
router.get('/templates/:key/preview', can(P.PAGE_VIEW), m.templatePreviewHtml);
router.get('/templates/:key', can(P.PAGE_VIEW), m.getTemplate);
router.delete('/templates/:id', can(P.TEMPLATE_MANAGE), m.deleteTemplate);

// ---- CRM ----
router.get('/crm/status', can([P.CRM_MANAGE, P.PAGE_EDIT]), m.crmStatus);
router.get('/crm/connect', can(P.CRM_MANAGE), m.crmConnect);
router.get('/crm/callback', can(P.CRM_MANAGE), m.crmCallback);
router.post('/crm/disconnect', can(P.CRM_MANAGE), m.crmDisconnect);
router.get('/crm/layouts', can([P.CRM_MANAGE, P.PAGE_EDIT]), m.crmLayouts);
router.get('/crm/fields', can([P.CRM_MANAGE, P.PAGE_EDIT]), m.crmFields);
router.get('/crm/sources', can([P.CRM_MANAGE, P.PAGE_EDIT]), m.crmSources);

// ---- analytics ----
router.get('/analytics/dashboard', can(P.PAGE_VIEW), m.dashboard);
router.get('/analytics/reports', can(P.REPORTS_VIEW), m.reports);

// ---- administration ----
router.get('/admin/setup-check', can(P.SETTINGS_MANAGE), m.setupCheck);
router.get('/admin/users', can(P.SETTINGS_MANAGE), m.users);
router.get('/admin/roles', can(P.PAGE_VIEW), m.roles);
router.put('/admin/roles', can(P.SETTINGS_MANAGE), m.saveRoles);
router.delete('/admin/roles', can(P.SETTINGS_MANAGE), m.resetRoles);
router.get('/admin/captcha', can(P.SETTINGS_MANAGE), m.getCaptcha);
router.put('/admin/captcha', can(P.SETTINGS_MANAGE), m.saveCaptcha);
router.get('/admin/pincodes', can(P.SETTINGS_MANAGE), m.listPincodes);
router.post('/admin/pincodes', can(P.SETTINGS_MANAGE), m.savePincode);
router.put('/admin/pincodes/:id', can(P.SETTINGS_MANAGE), m.savePincode);
router.post('/admin/pincodes/import', can(P.SETTINGS_MANAGE), m.importPincodes);
router.delete('/admin/pincodes/:id', can(P.SETTINGS_MANAGE), m.deletePincode);

module.exports = router;
