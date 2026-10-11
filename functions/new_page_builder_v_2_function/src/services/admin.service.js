'use strict';

// Administration: setup check (tables, columns, buckets, env), team list,
// role matrix and pincode management.

const config = require('../config');
const db = require('../utils/db');
const gemini = require('./ai/gemini.client');
const crmAuth = require('./crm/crmAuth.service');
const settings = require('./settings.service');
const { ROLES, EDITABLE_ROLES, MATRIX, PERMISSION_LABELS, resolveAppRole, effectiveMatrix } = require('../config/roles');
const { badRequest } = require('../utils/http');

// Columns V2 needs on each table (Catalyst system columns excluded).
const REQUIRED = {
  Pages: [
    'PageName', 'pageSlug', 'pageTitle', 'Description', 'Status', 'IsLive', 'IsDeleted', 'CreatedVia', 'TemplateKey',
    'ProjectFileID', 'FileID', 'ThumbnailUrl', 'CurrentVersion', 'ApprovedVersion', 'LiveVersion', 'LiveFileID',
    'FormConfig', 'formMapping', 'Settings', 'ThemeColor', 'View_Count', 'Lead_Count', 'OwnerName',
    'OwnerEmail', 'lastModifiedBy', 'SubmittedBy', 'SubmittedTime', 'ReviewedBy', 'ReviewedTime',
    'ReviewComment', 'PublishedBy', 'PublishedTime',
  ],
  PageVersions: ['PageId', 'VersionNo', 'ProjectKey', 'HtmlKey', 'Source', 'Note', 'CreatedByName'],
  PageApprovals: ['PageId', 'PageName', 'Action', 'FromStatus', 'ToStatus', 'VersionNo', 'ActorName', 'ActorEmail', 'Comment'],
  Leads: [
    'pageId', 'PageName', 'PageSlug', 'Lead_data', 'Name', 'Email', 'Phone', 'Channel', 'ChannelTag', 'utm_source',
    'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'Referrer', 'LandingUrl', 'DeviceType', 'LeadStatus',
    'IsPartial', 'otpVerified', 'CRMSync', 'CRMId', 'CRMError', 'Notes',
  ],
  Media: [
    'File_Name', 'File_Url', 'ObjectKey', 'Source', 'MimeType', 'SizeBytes', 'Prompt', 'NormalizedPrompt', 'Tags',
    'Embedding', 'AspectRatio', 'Model', 'UsageCount', 'CreatedByName',
  ],
  Templates: ['Name', 'Category', 'Description', 'ThumbnailUrl', 'ProjectKey', 'HtmlKey', 'CreatedByName'],
  AIGenerations: ['Kind', 'Prompt', 'PageId', 'Model', 'Status', 'LatencyMs', 'InputTokens', 'OutputTokens', 'ErrorMessage', 'ResultRef', 'CreatedByName'],
  PageViews: ['PageId', 'Channel', 'ViewDate', 'ViewCount'],
  AppSettings: ['SettingKey', 'SettingValue'],
  Pincodes: ['pincode', 'area_name', 'city', 'state', 'country'],
};

// The only columns that should have "Is Unique" switched on.
const UNIQUE = { Pages: ['pageSlug'], AppSettings: ['SettingKey'] };

async function checkTable(capp, name) {
  try {
    const cols = await capp.datastore().table(name).getAllColumns();
    const have = new Set((cols || []).map((c) => c.column_name));
    const missing = REQUIRED[name].filter((c) => !have.has(c));
    // Wrong flags break inserts: e.g. a unique OwnerEmail allows one page per user.
    const flag = (v) => v === true || v === 'true';
    const shouldBeUnique = UNIQUE[name] || [];
    const wrongUnique = (cols || [])
      .filter((c) => REQUIRED[name].includes(c.column_name) && flag(c.is_unique) && !shouldBeUnique.includes(c.column_name))
      .map((c) => c.column_name);
    const mandatory = (cols || []).filter((c) => REQUIRED[name].includes(c.column_name) && flag(c.is_mandatory)).map((c) => c.column_name);
    return { table: name, exists: true, missing, wrongUnique, mandatory };
  } catch (e) {
    return { table: name, exists: false, missing: REQUIRED[name], error: e.message };
  }
}

async function checkBucket(capp, name) {
  try {
    const b = capp.stratus().bucket(name);
    if (typeof b.headBucket === 'function') {
      const okHead = await b.headBucket();
      return { bucket: name, ok: okHead !== false };
    }
    await b.listPagedObjects({ maxKeys: 1 });
    return { bucket: name, ok: true };
  } catch (e) {
    return { bucket: name, ok: false, error: e.message };
  }
}

async function setupCheck(capp) {
  const tables = await Promise.all(Object.keys(REQUIRED).map((t) => checkTable(capp, t)));
  const buckets = await Promise.all([checkBucket(capp, config.buckets.pages), checkBucket(capp, config.buckets.media)]);
  const crm = await crmAuth.status(capp).catch((e) => ({ configured: crmAuth.isConfigured(), connected: false, error: e.message }));
  const captcha = await settings.getCaptchaKeys(capp).catch(() => null);
  const env = {
    gemini: gemini.isConfigured(),
    signingSecret: config.signingSecret !== 'change-me-in-catalyst-env' && config.signingSecret.length >= 24,
    requireApproval: config.workflow.requireApproval,
    otpProvider: config.otp.provider,
    crmConfigured: crmAuth.isConfigured(),
    metaPixel: !!config.metaPixelId,
  };
  const problems = [];
  tables.forEach((t) => {
    if (!t.exists) problems.push(`Create the ${t.table} table.`);
    else if (t.missing.length) problems.push(`${t.table}: add columns ${t.missing.join(', ')}.`);
    if (t.wrongUnique && t.wrongUnique.length) problems.push(`${t.table}: switch OFF "Is Unique" on ${t.wrongUnique.join(', ')}.`);
    if (t.mandatory && t.mandatory.length) problems.push(`${t.table}: switch OFF "Is Mandatory" on ${t.mandatory.join(', ')}.`);
  });
  buckets.forEach((b) => !b.ok && problems.push(`Create the Stratus bucket "${b.bucket}".`));
  if (!env.gemini) problems.push('Set GEMINI_API_KEY to enable AI features.');
  if (!env.signingSecret) problems.push('Set APP_SIGNING_SECRET to a random value of at least 24 characters.');
  if (config.otp.provider === 'dummy') problems.push(`OTP runs in demo mode (code ${config.otp.dummyCode}). Set OTP_PROVIDER=karix for real SMS.`);
  return {
    ok: !problems.length,
    problems,
    tables,
    buckets,
    env,
    crm,
    captcha: { configured: !!(captcha && captcha.siteKey && captcha.secretKey) },
  };
}

async function listUsers(userApp, capp) {
  try {
    const users = await capp.userManagement().getAllUsers();
    return (users || []).map((u) => {
      const catalystRole = (u.role_details && u.role_details.role_name) || '';
      return {
        id: String(u.user_id),
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email_id,
        email: u.email_id,
        status: u.status,
        catalystRole,
        appRole: resolveAppRole(catalystRole),
        confirmed: u.is_confirmed,
        createdTime: u.created_time,
      };
    });
  } catch (e) {
    console.warn('[admin] could not list users', e.message);
    return [];
  }
}

function roleMatrix() {
  return {
    roles: ROLES,
    permissions: Object.entries(PERMISSION_LABELS).map(([key, label]) => ({ key, label })),
    matrix: effectiveMatrix(),
    defaults: MATRIX,
    editableRoles: EDITABLE_ROLES,
    roleMap: config.roleMap,
    requireApproval: config.workflow.requireApproval,
  };
}

// ---- pincodes ----
async function listPincodes(capp, { search } = {}) {
  const s = String(search || '').replace(/\D/g, '');
  const where = s ? `pincode LIKE ${db.q(`${s}*`)}` : '';
  const rows = await db.select(capp, 'Pincodes', where, 'ORDER BY pincode LIMIT 200');
  return rows.map((r) => ({ id: r.ROWID, pincode: r.pincode, area: r.area_name, city: r.city, state: r.state, country: r.country }));
}

async function upsertPincode(capp, { id, pincode, area, city, state, country }) {
  if (!/^\d{6}$/.test(String(pincode || ''))) throw badRequest('Pincode must be 6 digits');
  const row = { pincode: String(pincode), area_name: area || '', city: city || '', state: state || '', country: country || 'India' };
  const t = db.table(capp, 'Pincodes');
  return db.isRowId(id) ? t.updateRow({ ROWID: id, ...row }) : t.insertRow(row);
}

async function importPincodes(capp, rows) {
  const clean = (Array.isArray(rows) ? rows : [])
    .map((r) => ({
      pincode: String(r.pincode || '').trim(),
      area_name: String(r.area || r.area_name || '').trim(),
      city: String(r.city || '').trim(),
      state: String(r.state || '').trim(),
      country: String(r.country || 'India').trim(),
    }))
    .filter((r) => /^\d{6}$/.test(r.pincode));
  if (!clean.length) throw badRequest('No valid rows found. Columns: pincode, area, city, state, country');
  let inserted = 0;
  for (let i = 0; i < clean.length; i += 200) {
    // eslint-disable-next-line no-await-in-loop
    await db.table(capp, 'Pincodes').insertRows(clean.slice(i, i + 200));
    inserted += Math.min(200, clean.length - i);
  }
  return { inserted, skipped: (rows || []).length - clean.length };
}

async function deletePincode(capp, id) {
  if (!db.isRowId(id)) throw badRequest('Invalid id');
  await db.table(capp, 'Pincodes').deleteRow(id);
  return { id };
}

module.exports = { REQUIRED, setupCheck, listUsers, roleMatrix, listPincodes, upsertPincode, importPincodes, deletePincode };
