'use strict';

const db = require('../utils/db');
const storage = require('./storage.service');
const { slugify } = require('../utils/text');
const { badRequest, notFound, conflict, forbidden } = require('../utils/http');
const { can, P } = require('../config/roles');
const { mergeTheme } = require('../shared/pageDocument');
const { fromLegacyStepForm, injectLegacyForm, formHtml, formConfigFromHtml } = require('../shared/formMarkup');

// Form definition comes from the HTML itself (see formConfigFromHtml).
const formConfigOf = (html, fallback) => {
  const fromHtml = formConfigFromHtml(html);
  return fromHtml.length || html ? fromHtml : fallback || [];
};

const T = 'Pages';

const STATUS = {
  DRAFT: 'Draft',
  PENDING: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PUBLISHED: 'Published',
  UNPUBLISHED: 'Unpublished',
};

const DEFAULT_SETTINGS = {
  activeTill: null, // ISO date; page closes after this day
  responseLimit: 0, // 0 = unlimited
  closedMessage: 'This page is no longer accepting responses. Thank you for your interest.',
  dedupe: true, // merge repeat phone/email submissions within 24h
  captcha: false, // require reCAPTCHA (keys in Settings)
  partialCapture: true, // save multi-step leads after each step
  legacyAssets: false, // page uses classic Bootstrap/Tailwind blocks
  animations: true, // scroll-reveal animations on the published page
  theme: null,
  seo: { description: '' },
};

const draftKeys = (id) => ({
  project: `pages/${id}/draft/project.json`,
  render: `pages/${id}/draft/render.json`,
});
const versionKeys = (id, n) => ({
  project: `pages/${id}/v${n}/project.json`,
  render: `pages/${id}/v${n}/render.json`,
});

function settingsOf(row) {
  const s = db.parseJson(row.Settings, {}) || {};
  return { ...DEFAULT_SETTINGS, ...s, seo: { ...DEFAULT_SETTINGS.seo, ...(s.seo || {}) }, theme: mergeTheme(s.theme) };
}

function toDto(row) {
  if (!row) return null;
  const settings = settingsOf(row);
  const views = Number(row.View_Count || 0);
  const leads = Number(row.Lead_Count || 0);
  let status = row.Status || STATUS.DRAFT;
  if (status === 'Deleted') status = STATUS.UNPUBLISHED;
  const isLegacy = !row.ProjectFileID && !!row.FileID;
  if (isLegacy) settings.legacyAssets = true;
  return {
    id: row.ROWID,
    name: row.PageName,
    slug: row.pageSlug,
    title: row.pageTitle,
    description: row.Description || settings.seo.description || '',
    status,
    isLive: db.toBool(row.IsLive) || (!row.IsLive && row.Status === STATUS.PUBLISHED && !row.ProjectFileID),
    createdVia: row.CreatedVia || (row.ProjectFileID ? 'blank' : 'legacy'),
    templateKey: row.TemplateKey || null,
    isLegacy,
    currentVersion: Number(row.CurrentVersion || 0),
    approvedVersion: Number(row.ApprovedVersion || 0),
    liveVersion: Number(row.LiveVersion || 0),
    formConfig: db.parseJson(row.FormConfig, []) || [],
    formMapping: db.parseJson(row.formMapping, null),
    settings,
    themeColor: row.ThemeColor || settings.theme.primary,
    thumbnailUrl: row.ThumbnailUrl || null,
    views,
    leads,
    conversion: views ? Math.round((leads / views) * 1000) / 10 : 0,
    ownerName: row.OwnerName || row.lastModifiedBy || 'Admin',
    ownerEmail: row.OwnerEmail || null,
    lastModifiedBy: row.lastModifiedBy || null,
    createdTime: row.CREATEDTIME,
    modifiedTime: row.MODIFIEDTIME,
    submittedBy: row.SubmittedBy || null,
    submittedTime: row.SubmittedTime || null,
    reviewedBy: row.ReviewedBy || null,
    reviewedTime: row.ReviewedTime || null,
    reviewComment: row.ReviewComment || null,
    publishedBy: row.PublishedBy || null,
    publishedTime: row.PublishedTime || null,
  };
}

const notDeleted = '(IsDeleted IS NULL OR IsDeleted = false)';

async function getRow(capp, id) {
  if (!db.isRowId(id)) throw notFound('Page not found');
  const row = await db.selectOne(capp, T, `ROWID = ${db.q(id)}`);
  if (!row || db.toBool(row.IsDeleted) || row.Status === 'Deleted') throw notFound('Page not found');
  return row;
}

async function list(capp, { status, search, mine, user } = {}) {
  const rows = await db.selectAll(capp, T, notDeleted, 'ORDER BY MODIFIEDTIME DESC');
  let pages = rows.filter((r) => r.Status !== 'Deleted').map(toDto);
  if (status && status !== 'All') {
    pages = status === 'Live' ? pages.filter((p) => p.isLive) : pages.filter((p) => p.status === status);
  }
  if (mine && user) pages = pages.filter((p) => p.ownerEmail === user.email);
  if (search) {
    const s = String(search).toLowerCase();
    pages = pages.filter((p) => `${p.name} ${p.slug} ${p.ownerName}`.toLowerCase().includes(s));
  }
  return pages;
}

async function isSlugAvailable(capp, slug, exceptId) {
  const clean = slugify(slug);
  const row = await db.selectOne(capp, T, `pageSlug = ${db.q(clean)}`);
  return !row || String(row.ROWID) === String(exceptId || '');
}

async function uniqueSlug(capp, base) {
  const root = slugify(base);
  for (let i = 0; i < 50; i += 1) {
    const candidate = i ? `${root}-${i + 1}` : root;
    // eslint-disable-next-line no-await-in-loop
    if (await isSlugAvailable(capp, candidate)) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

function canEdit(user, page) {
  if (can(user.role, P.PAGE_EDIT_ANY)) return true;
  return can(user.role, P.PAGE_EDIT) && (!page.ownerEmail || page.ownerEmail === user.email);
}

function assertCanEdit(user, page) {
  if (!canEdit(user, page)) throw forbidden('Only the page owner or marketing can edit this page');
}

// Pull the first image URL out of the HTML to use as a list thumbnail.
function firstImage(html) {
  const m = String(html || '').match(/<img[^>]+src="([^"]+)"/i);
  return m && !m[1].includes('placeholder.svg') ? m[1] : null;
}

async function writeDraft(capp, id, { project, html, css }) {
  const keys = draftKeys(id);
  await Promise.all([storage.putJson(capp, keys.project, project || {}), storage.putJson(capp, keys.render, { html: html || '', css: css || '' })]);
  return keys;
}

async function create(capp, user, input) {
  const name = String(input.name || '').trim() || 'Untitled page';
  const slug = input.slug ? slugify(input.slug) : await uniqueSlug(capp, name);
  if (!(await isSlugAvailable(capp, slug))) throw conflict('That URL is already used by another page');

  const settings = { ...DEFAULT_SETTINGS, ...(input.settings || {}), theme: mergeTheme(input.theme || (input.settings && input.settings.theme)) };
  const row = await db.table(capp, T).insertRow({
    PageName: name.slice(0, 250),
    pageSlug: slug,
    pageTitle: String(input.title || name).slice(0, 250),
    Description: input.description || '',
    Status: STATUS.DRAFT,
    IsLive: false,
    IsDeleted: false,
    CreatedVia: input.createdVia || 'blank',
    TemplateKey: input.templateKey || null,
    CurrentVersion: 0,
    ApprovedVersion: 0,
    LiveVersion: 0,
    FormConfig: JSON.stringify(formConfigOf(input.html, input.formConfig)),
    Settings: JSON.stringify(settings),
    ThemeColor: settings.theme.primary,
    View_Count: 0,
    Lead_Count: 0,
    OwnerName: user.name,
    OwnerEmail: user.email,
    lastModifiedBy: user.name,
  });

  const keys = await writeDraft(capp, row.ROWID, { project: input.project, html: input.html, css: input.css });
  const updated = await db.table(capp, T).updateRow({
    ROWID: row.ROWID,
    ProjectFileID: keys.project,
    FileID: keys.render,
    ThumbnailUrl: firstImage(input.html),
  });
  return toDto({ ...row, ...updated });
}

async function getDocument(capp, id) {
  const row = await getRow(capp, id);
  const page = toDto(row);
  if (row.ProjectFileID) {
    const [project, render] = await Promise.all([storage.getJson(capp, row.ProjectFileID), storage.getJson(capp, row.FileID)]);
    return { page, project, html: render ? render.html : '', css: render ? render.css : '' };
  }
  // V1 page: only a full HTML document exists. Hand the body and styles to
  // the editor; the first save converts it to a V2 page.
  return { page, project: null, ...(await legacyRender(capp, row)) };
}

// V1 page -> { html (body with the V2 form injected), css, formConfig }.
async function legacyRender(capp, row) {
  const legacy = (row.FileID && (await storage.getText(capp, row.FileID))) || '';
  const css = (legacy.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || []).map((s) => s.replace(/<\/?style[^>]*>/gi, '')).join('\n');
  const bodyMatch = legacy.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  let html = bodyMatch ? bodyMatch[1] : legacy;
  const { fields, captcha } = fromLegacyStepForm(db.parseJson(row.stepformdata, []));
  if (fields.length && !/data-pb-form=/.test(html)) html = injectLegacyForm(html, formHtml(fields, { captcha }));
  return { html, css, formConfig: fields, captcha };
}

// Save the working copy. Editing an approved/published/rejected page moves
// the working copy back to Draft; the live version keeps serving.
async function saveDraft(capp, user, id, input) {
  let row = await getRow(capp, id);
  const page = toDto(row);
  assertCanEdit(user, page);
  if (page.status === STATUS.PENDING && !input.force) {
    throw conflict('This page is waiting for approval. Withdraw it before editing, or ask marketing to review it.');
  }

  // A live V1 page is served from its old HTML. Before the first V2 save
  // replaces that, keep it as an approved, live version so visitors are not
  // affected while the converted draft goes through review.
  if (page.isLegacy && page.isLive && !page.liveVersion) {
    const { versionNo, keys: vKeys } = await snapshot(capp, user, id, { source: 'legacy', note: 'V1 page as it was live before conversion' });
    await db.table(capp, T).updateRow({ ROWID: id, IsLive: true, LiveVersion: versionNo, ApprovedVersion: versionNo, LiveFileID: vKeys.render });
    row = await getRow(capp, id);
  }

  const keys = await writeDraft(capp, id, { project: input.project, html: input.html, css: input.css });
  const settings = { ...page.settings, ...(input.settings || {}) };
  if (input.theme) settings.theme = mergeTheme(input.theme);

  const patch = {
    ROWID: id,
    ProjectFileID: keys.project,
    FileID: keys.render,
    FormConfig: JSON.stringify(formConfigOf(input.html, page.formConfig)),
    Settings: JSON.stringify(settings),
    ThemeColor: settings.theme.primary,
    lastModifiedBy: user.name,
  };
  const thumb = firstImage(input.html);
  if (thumb) patch.ThumbnailUrl = thumb;
  if (input.name) patch.PageName = String(input.name).slice(0, 250);
  if (input.title) patch.pageTitle = String(input.title).slice(0, 250);
  if (!row.CreatedVia) patch.CreatedVia = 'legacy';

  let statusChanged = false;
  if ([STATUS.APPROVED, STATUS.REJECTED, STATUS.PUBLISHED, STATUS.UNPUBLISHED].includes(page.status)) {
    patch.Status = STATUS.DRAFT;
    statusChanged = true;
  }
  const updated = await db.table(capp, T).updateRow(patch);
  return { page: toDto({ ...row, ...updated }), statusChanged, previousStatus: page.status };
}

async function updateMeta(capp, user, id, input) {
  const row = await getRow(capp, id);
  const page = toDto(row);
  assertCanEdit(user, page);
  const patch = { ROWID: id, lastModifiedBy: user.name };
  if (input.name !== undefined) patch.PageName = String(input.name).trim().slice(0, 250) || page.name;
  if (input.title !== undefined) patch.pageTitle = String(input.title).slice(0, 250);
  if (input.description !== undefined) patch.Description = String(input.description);
  if (input.slug !== undefined && slugify(input.slug) !== page.slug) {
    if (page.isLive) throw badRequest('Unpublish the page before changing its URL, so existing links do not break');
    const slug = slugify(input.slug);
    if (!(await isSlugAvailable(capp, slug, id))) throw conflict('That URL is already used by another page');
    patch.pageSlug = slug;
  }
  if (input.settings) {
    const settings = { ...page.settings, ...input.settings };
    if (input.settings.theme) settings.theme = mergeTheme(input.settings.theme);
    patch.Settings = JSON.stringify(settings);
    patch.ThemeColor = settings.theme.primary;
  }
  const updated = await db.table(capp, T).updateRow(patch);
  return toDto({ ...row, ...updated });
}

async function updateMapping(capp, id, mapping) {
  await getRow(capp, id);
  await db.table(capp, T).updateRow({ ROWID: id, formMapping: mapping ? JSON.stringify(mapping) : null });
}

async function softDelete(capp, user, id) {
  const row = await getRow(capp, id);
  const page = toDto(row);
  if (!can(user.role, P.PAGE_DELETE) && !(page.ownerEmail === user.email && !page.isLive && page.status === STATUS.DRAFT)) {
    throw forbidden('You can only delete your own unpublished drafts');
  }
  // Free the slug so it can be reused.
  await db.table(capp, T).updateRow({ ROWID: id, IsDeleted: true, IsLive: false, pageSlug: `${row.pageSlug}--deleted-${Date.now().toString(36)}`.slice(0, 250) });
  return page;
}

async function duplicate(capp, user, id, { name, slug } = {}) {
  const doc = await getDocument(capp, id);
  return create(capp, user, {
    name: name || `${doc.page.name} (copy)`,
    slug: slug || (await uniqueSlug(capp, `${doc.page.slug}-copy`)),
    title: doc.page.title,
    description: doc.page.description,
    createdVia: 'clone',
    templateKey: doc.page.templateKey,
    project: doc.project,
    html: doc.html,
    css: doc.css,
    formConfig: doc.page.formConfig,
    settings: { ...doc.page.settings, activeTill: null },
  });
}

// ---- versions ----
async function snapshot(capp, user, id, { source = 'submit', note = '' } = {}) {
  const row = await getRow(capp, id);
  const n = Number(row.CurrentVersion || 0) + 1;
  const to = versionKeys(id, n);
  if (row.ProjectFileID) {
    await Promise.all([storage.copy(capp, row.ProjectFileID, to.project), storage.copy(capp, row.FileID, to.render)]);
  } else {
    // Legacy page that has never been saved in V2: snapshot its body, with the
    // V1 step form converted, so it is served like any other version.
    const { html, css } = await legacyRender(capp, row);
    await storage.putJson(capp, to.render, { html, css, legacy: true });
    await storage.putJson(capp, to.project, {});
  }
  await db.table(capp, 'PageVersions').insertRow({
    PageId: String(id),
    VersionNo: n,
    ProjectKey: to.project,
    HtmlKey: to.render,
    Source: source,
    Note: note || '',
    CreatedByName: user.name,
  });
  await db.table(capp, T).updateRow({ ROWID: id, CurrentVersion: n });
  return { versionNo: n, keys: to };
}

async function listVersions(capp, id) {
  await getRow(capp, id);
  const rows = await db.select(capp, 'PageVersions', `PageId = ${db.q(id)}`, 'ORDER BY VersionNo DESC LIMIT 100');
  return rows.map((r) => ({
    id: r.ROWID,
    versionNo: Number(r.VersionNo),
    source: r.Source,
    note: r.Note,
    createdBy: r.CreatedByName,
    createdTime: r.CREATEDTIME,
  }));
}

async function getVersion(capp, id, versionNo) {
  const row = await db.selectOne(capp, 'PageVersions', `PageId = ${db.q(id)} AND VersionNo = ${db.num(versionNo)}`);
  if (!row) throw notFound('Version not found');
  return row;
}

async function restoreVersion(capp, user, id, versionNo) {
  const row = await getRow(capp, id);
  assertCanEdit(user, toDto(row));
  const v = await getVersion(capp, id, versionNo);
  const keys = draftKeys(id);
  await Promise.all([storage.copy(capp, v.ProjectKey, keys.project), storage.copy(capp, v.HtmlKey, keys.render)]);
  const patch = { ROWID: id, ProjectFileID: keys.project, FileID: keys.render, lastModifiedBy: user.name };
  if (row.Status !== STATUS.DRAFT && row.Status !== STATUS.PENDING) patch.Status = STATUS.DRAFT;
  await db.table(capp, T).updateRow(patch);
  return getDocument(capp, id);
}

async function getVersionRender(capp, id, versionNo) {
  const v = await getVersion(capp, id, versionNo);
  return storage.getJson(capp, v.HtmlKey);
}

async function incrementCounter(capp, id, column, by = 1) {
  const row = await db.selectOne(capp, T, `ROWID = ${db.q(id)}`);
  if (!row) return;
  await db.table(capp, T).updateRow({ ROWID: id, [column]: Number(row[column] || 0) + by });
}

module.exports = {
  STATUS,
  DEFAULT_SETTINGS,
  toDto,
  getRow,
  list,
  isSlugAvailable,
  uniqueSlug,
  canEdit,
  assertCanEdit,
  create,
  getDocument,
  saveDraft,
  updateMeta,
  updateMapping,
  softDelete,
  duplicate,
  snapshot,
  listVersions,
  restoreVersion,
  getVersionRender,
  incrementCounter,
  versionKeys,
  legacyRender,
};
