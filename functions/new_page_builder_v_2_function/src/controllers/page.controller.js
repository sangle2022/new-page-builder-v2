'use strict';

const pages = require('../services/page.service');
const workflow = require('../services/workflow.service');
const templates = require('../services/template.service');
const publicPage = require('../services/publicPage.service');
const pageGeneration = require('../services/ai/pageGeneration.service');
const { sendHtml } = require('./public.controller');
const { can, P } = require('../config/roles');
const { ok, created, asyncHandler, badRequest, forbidden } = require('../utils/http');

// Attach what the current user may do with a page, so the UI can show only
// the actions that will succeed.
function withActions(user, page) {
  if (!page) return page;
  const editable = pages.canEdit(user, page);
  const S = pages.STATUS;
  const pending = page.status === S.PENDING;
  const reviewer = can(user.role, P.PAGE_APPROVE) && (user.role === 'admin' || page.submittedBy !== user.name || page.ownerEmail !== user.email);
  const publishable = workflow.canPublish(user, page);
  const approvedReady = page.status === S.APPROVED || (page.status === S.UNPUBLISHED && page.approvedVersion > 0);
  const direct = workflow.canPublishDirect(user, page);
  return {
    ...page,
    actions: {
      edit: editable && !pending,
      aiEdit: editable && !pending && can(user.role, P.AI_USE),
      duplicate: can(user.role, P.PAGE_CREATE),
      submit: editable && can(user.role, P.PAGE_SUBMIT) && [S.DRAFT, S.REJECTED, S.UNPUBLISHED].includes(page.status),
      withdraw: pending && (editable || can(user.role, P.PAGE_APPROVE)),
      approve: pending && reviewer,
      reject: pending && reviewer,
      // Marketing may publish their own page even while it waits for review.
      publish: publishable && (!pending || direct) && (approvedReady || direct) && !(page.isLive && page.status === S.PUBLISHED),
      unpublish: publishable && page.isLive,
      delete: can(user.role, P.PAGE_DELETE) || (page.ownerEmail === user.email && !page.isLive && page.status === S.DRAFT),
      viewLeads: can(user.role, P.LEAD_VIEW),
      saveTemplate: can(user.role, P.TEMPLATE_MANAGE),
      mapCrm: can(user.role, P.CRM_MANAGE) || editable,
    },
  };
}

// Lead count per channel for every page, from one Leads scan.
async function channelsByPage(capp) {
  const db = require('../utils/db');
  const rows = await db.selectAll(capp, 'Leads', '(IsPartial IS NULL OR IsPartial = false)', 'ORDER BY CREATEDTIME DESC', 20000).catch(() => []);
  const out = {};
  rows.forEach((r) => {
    const byPage = (out[r.pageId] = out[r.pageId] || {});
    const ch = r.Channel || 'Direct';
    byPage[ch] = (byPage[ch] || 0) + 1;
  });
  return out;
}

const list = asyncHandler(async (req, res) => {
  const [items, channels] = await Promise.all([
    pages.list(req.capp, { ...req.query, mine: req.query.mine === 'true', user: req.user }),
    channelsByPage(req.capp),
  ]);
  ok(
    res,
    items.map((p) => {
      const ch = channels[p.id] || {};
      const top = Object.entries(ch).sort((a, b) => b[1] - a[1]);
      return { ...withActions(req.user, p), channels: ch, topChannel: top.length ? top[0][0] : null };
    }),
  );
});

const get = asyncHandler(async (req, res) => ok(res, withActions(req.user, pages.toDto(await pages.getRow(req.capp, req.params.id)))));

const slugAvailable = asyncHandler(async (req, res) => {
  const available = await pages.isSlugAvailable(req.capp, req.query.slug || '', req.query.exceptId);
  ok(res, { available, suggestion: available ? null : await pages.uniqueSlug(req.capp, req.query.slug || 'page') });
});

// mode: blank | template | ai
const create = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const mode = b.mode || 'blank';
  let input = { name: b.name, slug: b.slug, title: b.title, description: b.description, settings: b.settings, theme: b.theme };

  if (mode === 'template' && String(b.templateKey || '').startsWith('classic-')) {
    // Classic (V1) templates ship with the client; their HTML comes in the
    // request. They use Bootstrap/Tailwind, so the page loads those styles.
    if (!b.html) throw badRequest('Template content is missing');
    input = {
      ...input,
      createdVia: 'template',
      templateKey: String(b.templateKey).slice(0, 100),
      html: b.html,
      css: b.css || '',
      settings: { ...(b.settings || {}), legacyAssets: true },
    };
  } else if (mode === 'template') {
    if (!b.templateKey) throw badRequest('Choose a template');
    const t = await templates.load(req.capp, b.templateKey);
    input = { ...input, name: b.name || t.name, createdVia: 'template', templateKey: t.templateKey, html: t.html, css: t.css, project: t.project, theme: b.theme || t.theme };
  } else if (mode === 'ai') {
    if (!can(req.user.role, P.AI_USE)) throw forbidden('You do not have access to AI features');
    let gen = b.generated;
    if (!gen || !gen.html) gen = await pageGeneration.generate(req.capp, req.user, b.ai || {});
    input = {
      ...input,
      name: b.name || gen.name,
      slug: b.slug || gen.slug,
      title: b.title || gen.title,
      description: b.description || gen.description,
      createdVia: 'ai',
      html: gen.html,
      css: gen.css,
      theme: gen.theme,
      settings: { ...(b.settings || {}), seo: { description: gen.description || '' } },
    };
  } else {
    input = { ...input, createdVia: 'blank', html: b.html || '', css: b.css || '' };
  }
  if (input.slug && !(await pages.isSlugAvailable(req.capp, input.slug))) input.slug = await pages.uniqueSlug(req.capp, input.slug);
  const page = await pages.create(req.capp, req.user, input);
  created(res, withActions(req.user, page));
});

const getDocument = asyncHandler(async (req, res) => {
  const doc = await pages.getDocument(req.capp, req.params.id);
  ok(res, { ...doc, page: withActions(req.user, doc.page) });
});

const saveDocument = asyncHandler(async (req, res) => {
  const result = await pages.saveDraft(req.capp, req.user, req.params.id, req.body || {});
  if (result.statusChanged) {
    await workflow.log(req.capp, req.user, result.page, 'Edited', result.previousStatus, result.page.status, result.page.currentVersion, 'Changes saved; page returned to draft');
  }
  ok(res, { ...result, page: withActions(req.user, result.page) });
});

const updateMeta = asyncHandler(async (req, res) => ok(res, withActions(req.user, await pages.updateMeta(req.capp, req.user, req.params.id, req.body || {}))));

const remove = asyncHandler(async (req, res) => {
  const page = await pages.softDelete(req.capp, req.user, req.params.id);
  await workflow.log(req.capp, req.user, page, 'Deleted', page.status, 'Deleted', page.currentVersion);
  ok(res, { id: req.params.id });
});

const duplicate = asyncHandler(async (req, res) => {
  if (!can(req.user.role, P.PAGE_CREATE)) throw forbidden();
  created(res, withActions(req.user, await pages.duplicate(req.capp, req.user, req.params.id, req.body || {})));
});

const versions = asyncHandler(async (req, res) => ok(res, await pages.listVersions(req.capp, req.params.id)));
const restoreVersion = asyncHandler(async (req, res) => ok(res, await pages.restoreVersion(req.capp, req.user, req.params.id, req.params.n)));
const history = asyncHandler(async (req, res) => ok(res, await workflow.history(req.capp, req.params.id)));

const preview = asyncHandler(async (req, res) => {
  sendHtml(res, await publicPage.renderPreview(req.capp, req.params.id, { version: req.query.version }));
});

const transition = (fn) =>
  asyncHandler(async (req, res) => ok(res, withActions(req.user, await workflow[fn](req.capp, req.user, req.params.id, req.body || {}))));

const getMapping = asyncHandler(async (req, res) => ok(res, pages.toDto(await pages.getRow(req.capp, req.params.id)).formMapping));
const saveMapping = asyncHandler(async (req, res) => {
  const page = pages.toDto(await pages.getRow(req.capp, req.params.id));
  if (!pages.canEdit(req.user, page) && !can(req.user.role, P.CRM_MANAGE)) throw forbidden();
  const m = req.body || {};
  const fields = {};
  Object.entries(m.fields || {}).forEach(([crmField, source]) => {
    if (/^[A-Za-z0-9_]+$/.test(crmField) && source) fields[crmField] = String(source).slice(0, 100);
  });
  await pages.updateMapping(req.capp, req.params.id, { layoutId: m.layoutId || null, fields });
  ok(res, { layoutId: m.layoutId || null, fields });
});

// Shareable links: one per channel with ch + UTM, used by the share dialog
// and QR codes, so every lead is attributed to the channel it came from.
const share = asyncHandler(async (req, res) => {
  const page = pages.toDto(await pages.getRow(req.capp, req.params.id));
  const url = publicPage.publicUrl(req, page.slug);
  const camp = encodeURIComponent(page.slug);
  const mk = (ch, source, medium) => `${url}?ch=${ch}&utm_source=${source}&utm_medium=${medium}&utm_campaign=${camp}`;
  ok(res, {
    url,
    isLive: page.isLive,
    channels: [
      { channel: 'Facebook', url: mk('facebook', 'facebook', 'social') },
      { channel: 'Instagram', url: mk('instagram', 'instagram', 'social') },
      { channel: 'LinkedIn', url: mk('linkedin', 'linkedin', 'social') },
      { channel: 'WhatsApp', url: mk('whatsapp', 'whatsapp', 'social') },
      { channel: 'Email', url: mk('email', 'newsletter', 'email') },
      { channel: 'Google Ads', url: mk('google_ads', 'google', 'cpc') },
      { channel: 'SMS', url: mk('sms', 'sms', 'sms') },
      { channel: 'QR Code', url: mk('qr', 'qr', 'offline') },
    ],
    embed: `<iframe src="${url}?ch=embed" style="width:100%;min-height:900px;border:0" loading="lazy" title="${page.name.replace(/"/g, '')}"></iframe>`,
  });
});

const saveAsTemplate = asyncHandler(async (req, res) => created(res, await templates.saveFromPage(req.capp, req.user, req.params.id, req.body || {})));

const approvals = asyncHandler(async (req, res) => {
  const all = await pages.list(req.capp, {});
  ok(res, {
    pending: all.filter((p) => p.status === pages.STATUS.PENDING).map((p) => withActions(req.user, p)),
    approved: all.filter((p) => p.status === pages.STATUS.APPROVED).map((p) => withActions(req.user, p)),
    rejected: all.filter((p) => p.status === pages.STATUS.REJECTED).map((p) => withActions(req.user, p)),
    activity: await workflow.recentActivity(req.capp, 40),
  });
});

module.exports = {
  withActions,
  list,
  get,
  slugAvailable,
  create,
  getDocument,
  saveDocument,
  updateMeta,
  remove,
  duplicate,
  versions,
  restoreVersion,
  history,
  preview,
  submit: transition('submit'),
  withdraw: transition('withdraw'),
  approve: transition('approve'),
  reject: transition('reject'),
  publish: transition('publish'),
  unpublish: transition('unpublish'),
  getMapping,
  saveMapping,
  share,
  saveAsTemplate,
  approvals,
};
