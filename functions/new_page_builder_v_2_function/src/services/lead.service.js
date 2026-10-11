'use strict';

// Lead capture (public) and lead management (admin).
//
// Every lead stores the page it came from (pageId, PageName, PageSlug), the
// resolved acquisition channel, UTM parameters, device and landing URL, so
// marketing can answer "which page and which channel produced this lead".
//
// Lead_data JSON: { fields: {name: value}, labels: {name: label}, steps: [n], meta: {...} }
// Notes JSON:     [{ type: 'note'|'status'|'crm', text, by, time }]  (activity timeline)

const db = require('../utils/db');
const pages = require('./page.service');
const crm = require('./crm/crm.service');
const verification = require('./verification.service');
const { resolveChannel, deviceFromUserAgent, CHANNELS } = require('../utils/channel');
const { sign, verify } = require('../utils/sign');
const { badRequest, notFound, conflict } = require('../utils/http');

const T = 'Leads';
const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'];
const MAX_FIELDS = 60;
const MAX_VALUE = 2000;

// ---------- helpers ----------
const clip = (v, n = 250) => (v === undefined || v === null ? '' : String(v).slice(0, n));

function today() {
  return db.catalystDate().slice(0, 10);
}

// Why a live page may refuse new responses (date, cap). null = open.
function closedReason(page) {
  const s = page.settings || {};
  if (s.activeTill) {
    const till = String(s.activeTill).slice(0, 10);
    if (till && today() > till) return 'expired';
  }
  if (Number(s.responseLimit) > 0 && page.leads >= Number(s.responseLimit)) return 'limit';
  return null;
}

function pickContact(fields, formConfig) {
  const byType = (type) => formConfig.filter((f) => f.type === type).map((f) => f.name);
  const firstValue = (names) => names.map((n) => fields[n]).find((v) => v && String(v).trim());
  const nameKeys = Object.keys(fields).filter((k) => /(^|_)(full_?name|name|first_name|your_name)$/.test(k));
  const first = fields.first_name || '';
  const last = fields.last_name || '';
  return {
    Name: clip(firstValue(nameKeys.filter((k) => k !== 'first_name' && k !== 'last_name')) || `${first} ${last}`.trim()),
    Email: clip(firstValue([...byType('email'), ...Object.keys(fields).filter((k) => /email/.test(k))])).toLowerCase(),
    Phone: clip(
      firstValue([...byType('tel'), ...Object.keys(fields).filter((k) => /(phone|mobile|contact_?number|whatsapp)/.test(k))]),
      30,
    ),
  };
}

// Keep only the fields the page's form defines (V1 stored whatever arrived).
// Pages without a FormConfig (legacy V1 pages) accept simple scalar values.
function sanitizeFields(input, formConfig) {
  const out = {};
  const labels = {};
  const src = input && typeof input === 'object' ? input : {};
  if (formConfig.length) {
    formConfig.forEach((f) => {
      let v = src[f.name];
      if (v === undefined) return;
      if (Array.isArray(v)) v = v.map((x) => clip(x, 200)).slice(0, 50);
      else v = clip(v, MAX_VALUE).trim();
      out[f.name] = v;
      labels[f.name] = f.label;
    });
  } else {
    Object.keys(src)
      .slice(0, MAX_FIELDS)
      .forEach((k) => {
        const key = String(k).replace(/[^\w.-]/g, '').slice(0, 60);
        const v = src[k];
        if (!key || (typeof v === 'object' && !Array.isArray(v))) return;
        out[key] = Array.isArray(v) ? v.map((x) => clip(x, 200)).slice(0, 50) : clip(v, MAX_VALUE).trim();
      });
  }
  return { fields: out, labels };
}

function validateRequired(fields, formConfig, steps) {
  const missing = formConfig.filter((f) => {
    if (!f.required || f.type === 'hidden') return false;
    if (steps && !steps.includes(Number(f.step) || 1)) return false;
    const v = fields[f.name];
    return v === undefined || v === '' || (Array.isArray(v) && !v.length);
  });
  if (missing.length) throw badRequest(`Please fill in: ${missing.map((f) => f.label).join(', ')}`, { fields: missing.map((f) => f.name) });

  formConfig.forEach((f) => {
    const v = fields[f.name];
    if (!v || Array.isArray(v)) return;
    if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw badRequest(`${f.label}: enter a valid email address`, { fields: [f.name] });
    if (f.type === 'tel' && String(v).replace(/\D/g, '').length < 7) throw badRequest(`${f.label}: enter a valid phone number`, { fields: [f.name] });
    if (f.type === 'pincode' && !/^\d{6}$/.test(v)) throw badRequest(`${f.label}: enter a 6 digit pincode`, { fields: [f.name] });
    if ((f.type === 'select' || f.type === 'radio') && f.options && f.options.length && !f.options.includes(v)) {
      throw badRequest(`${f.label}: choose one of the options`, { fields: [f.name] });
    }
  });
}

function addActivity(row, entry) {
  const list = db.parseJson(row && row.Notes, []);
  const arr = Array.isArray(list) ? list : row && row.Notes ? [{ type: 'note', text: String(row.Notes), by: '', time: row.CREATEDTIME }] : [];
  arr.push({ ...entry, time: new Date().toISOString() });
  return JSON.stringify(arr.slice(-200));
}

function toDto(row) {
  const data = db.parseJson(row.Lead_data, {}) || {};
  const fields = data.fields || (typeof data === 'object' ? data : {});
  return {
    id: row.ROWID,
    pageId: row.pageId,
    pageName: row.PageName || '',
    pageSlug: row.PageSlug || '',
    name: row.Name || fields.name || fields.full_name || '',
    email: row.Email || fields.email || '',
    phone: row.Phone || fields.phone || fields.mobile || '',
    channel: row.Channel || 'Direct',
    channelTag: row.ChannelTag || '',
    utm: {
      source: row.utm_source || '',
      medium: row.utm_medium || '',
      campaign: row.utm_campaign || '',
      content: row.utm_content || '',
      term: row.utm_term || '',
    },
    referrer: row.Referrer || '',
    landingUrl: row.LandingUrl || '',
    device: row.DeviceType || '',
    status: row.LeadStatus || 'New',
    isPartial: db.toBool(row.IsPartial),
    otpVerified: db.toBool(row.otpVerified),
    crmSync: row.CRMSync || '',
    crmId: row.CRMId || '',
    crmError: row.CRMError || '',
    fields,
    labels: data.labels || {},
    createdTime: row.CREATEDTIME,
    modifiedTime: row.MODIFIEDTIME,
  };
}

// ---------- public: capture ----------
//
// body: { fields, step?, steps?, partial?, leadToken?, captchaToken?, otpTokens?: {field: token},
//         tracking: { ch, tag, utm_source, ..., referrer, landingUrl, embedded } }
async function capture(capp, pageId, body, { ip, userAgent } = {}) {
  const row = await pages.getRow(capp, pageId).catch(() => null);
  if (!row) throw notFound('This page is not available');
  const page = pages.toDto(row);
  if (!page.isLive) throw notFound('This page is not available');

  const formConfig = page.formConfig || [];
  const partial = body.partial === true && page.settings.partialCapture !== false;
  const continuation = body.leadToken ? verify(body.leadToken) : null;
  if (body.leadToken && (!continuation || continuation.t !== 'lead' || String(continuation.pageId) !== String(pageId))) {
    throw badRequest('Your session expired. Please submit the form again.');
  }
  if (!continuation) {
    const reason = closedReason(page);
    if (reason) throw conflict(page.settings.closedMessage, { closed: reason });
  }

  const { fields, labels } = sanitizeFields(body.fields, formConfig);
  if (!Object.keys(fields).length) throw badRequest('The form is empty');

  // Which steps this submission covers. Partial posts validate their step;
  // the final post validates everything submitted so far.
  const stepsCovered = partial && body.step ? [Number(body.step)] : null;
  validateRequired(fields, formConfig, stepsCovered);

  // Captcha: the first request from a visitor proves they are human.
  if (!continuation && page.settings.captcha) {
    const okCaptcha = await verification.verifyCaptcha(capp, body.captchaToken, ip);
    if (!okCaptcha) throw badRequest('Please complete the captcha', { captcha: true });
  }

  // OTP: every OTP-protected phone field that has a value needs a valid proof.
  let otpVerified = false;
  for (const f of formConfig.filter((x) => x.type === 'tel' && x.otp)) {
    if (!fields[f.name]) continue;
    const token = body.otpTokens && body.otpTokens[f.name];
    if (!verification.isOtpTokenValid(token, fields[f.name])) {
      throw badRequest(`Please verify ${f.label} with the OTP`, { fields: [f.name], otp: true });
    }
    otpVerified = true;
  }

  const contact = pickContact(fields, formConfig);
  const t = body.tracking || {};
  const channel = resolveChannel({
    ch: t.ch,
    utm_source: t.utm_source,
    utm_medium: t.utm_medium,
    referrer: t.referrer,
    embedded: t.embedded,
  });
  const table = db.table(capp, T);

  // Find the row to update: an in-progress partial lead, or (dedupe) the same
  // person on the same page within 24 hours.
  let existing = null;
  if (continuation) {
    existing = await db.selectOne(capp, T, `ROWID = ${db.q(continuation.id)} AND pageId = ${db.q(pageId)}`);
  } else if (page.settings.dedupe && (contact.Phone || contact.Email)) {
    const since = db.catalystDate(new Date(Date.now() - 24 * 3600 * 1000));
    const who = [contact.Phone && `Phone = ${db.q(contact.Phone)}`, contact.Email && `Email = ${db.q(contact.Email)}`].filter(Boolean).join(' OR ');
    existing = await db.selectOne(capp, T, `pageId = ${db.q(pageId)} AND (${who}) AND CREATEDTIME > ${db.q(since)}`);
  }

  const prevData = existing ? db.parseJson(existing.Lead_data, {}) || {} : {};
  const prevFields = prevData.fields || {};
  const mergedFields = { ...prevFields, ...fields };
  const stepsDone = [...new Set([...(prevData.steps || []), ...(body.step ? [Number(body.step)] : [])])].sort();
  const leadData = {
    fields: mergedFields,
    labels: { ...(prevData.labels || {}), ...labels },
    steps: stepsDone,
    meta: { ...(prevData.meta || {}), lastSubmit: new Date().toISOString(), submissions: Number((prevData.meta || {}).submissions || 0) + 1 },
  };
  const mergedContact = pickContact(mergedFields, formConfig);

  const common = {
    Lead_data: JSON.stringify(leadData),
    Name: mergedContact.Name,
    Email: mergedContact.Email,
    Phone: mergedContact.Phone,
    IsPartial: partial,
  };
  if (otpVerified) common.otpVerified = true;

  let saved;
  let isNewComplete = false;
  if (existing) {
    const wasPartial = db.toBool(existing.IsPartial);
    const patch = { ROWID: existing.ROWID, ...common };
    if (!partial && wasPartial) isNewComplete = true;
    if (!partial && !wasPartial) patch.Notes = addActivity(existing, { type: 'note', text: 'Submitted the form again', by: 'Visitor' });
    // A finished lead never goes back to partial.
    if (!wasPartial) patch.IsPartial = false;
    saved = { ...existing, ...(await table.updateRow(patch)) };
  } else {
    saved = await table.insertRow({
      pageId: String(pageId),
      PageName: clip(page.name),
      PageSlug: clip(page.slug),
      ...common,
      Channel: channel,
      ChannelTag: clip(t.tag, 100),
      utm_source: clip(t.utm_source, 200),
      utm_medium: clip(t.utm_medium, 200),
      utm_campaign: clip(t.utm_campaign, 200),
      utm_content: clip(t.utm_content, 200),
      utm_term: clip(t.utm_term, 200),
      Referrer: clip(t.referrer, 1000),
      LandingUrl: clip(t.landingUrl, 1000),
      DeviceType: deviceFromUserAgent(userAgent),
      LeadStatus: 'New',
      CRMSync: partial ? '' : 'Pending',
      Notes: JSON.stringify([{ type: 'status', text: partial ? 'Started the form' : 'Lead captured', by: 'Visitor', time: new Date().toISOString() }]),
    });
    isNewComplete = !partial;
  }

  if (isNewComplete) {
    await pages.incrementCounter(capp, pageId, 'Lead_Count', 1).catch((e) => console.warn('[lead] counter', e.message));
  }

  let crmResult = null;
  if (!partial) crmResult = await crm.syncLeadWithTimeout(capp, saved, row);

  return {
    leadId: saved.ROWID,
    partial,
    leadToken: partial ? sign({ t: 'lead', id: saved.ROWID, pageId: String(pageId) }, 24 * 3600) : null,
    crm: crmResult ? crmResult.status : null,
  };
}

// ---------- public: view tracking ----------
async function trackView(capp, pageId, tracking = {}) {
  const row = await pages.getRow(capp, pageId).catch(() => null);
  if (!row || !pages.toDto(row).isLive) return;
  const channel = resolveChannel(tracking);
  await pages.incrementCounter(capp, pageId, 'View_Count', 1);
  const day = today();
  try {
    const existing = await db.selectOne(capp, 'PageViews', `PageId = ${db.q(pageId)} AND Channel = ${db.q(channel)} AND ViewDate = ${db.q(day)}`);
    if (existing) {
      await db.table(capp, 'PageViews').updateRow({ ROWID: existing.ROWID, ViewCount: Number(existing.ViewCount || 0) + 1 });
    } else {
      await db.table(capp, 'PageViews').insertRow({ PageId: String(pageId), Channel: channel, ViewDate: day, ViewCount: 1 });
    }
  } catch (e) {
    console.warn('[views] could not record channel view', e.message);
  }
}

// ---------- admin ----------
function whereFor({ pageId, channel, status, partial } = {}) {
  const parts = [];
  if (pageId) parts.push(`pageId = ${db.q(pageId)}`);
  if (channel) parts.push(`Channel = ${db.q(channel)}`);
  if (status) parts.push(`LeadStatus = ${db.q(status)}`);
  if (partial === 'true' || partial === true) parts.push('IsPartial = true');
  if (partial === 'false' || partial === false) parts.push('(IsPartial IS NULL OR IsPartial = false)');
  return parts.join(' AND ');
}

async function listAll(capp, filters = {}) {
  const rows = await db.selectAll(capp, T, whereFor(filters), 'ORDER BY CREATEDTIME DESC', 10000);
  let leads = rows.map(toDto);
  if (filters.from) leads = leads.filter((l) => String(l.createdTime).slice(0, 10) >= String(filters.from).slice(0, 10));
  if (filters.to) leads = leads.filter((l) => String(l.createdTime).slice(0, 10) <= String(filters.to).slice(0, 10));
  if (filters.campaign) leads = leads.filter((l) => l.utm.campaign === filters.campaign);
  if (filters.crm) leads = leads.filter((l) => (l.crmSync || 'None') === filters.crm);
  if (filters.search) {
    const s = String(filters.search).toLowerCase();
    leads = leads.filter((l) => `${l.name} ${l.email} ${l.phone} ${l.pageName} ${l.utm.campaign}`.toLowerCase().includes(s));
  }
  return leads;
}

async function list(capp, filters = {}) {
  const all = await listAll(capp, filters);
  const perPage = Math.min(200, Math.max(1, Number(filters.perPage) || 25));
  const pageNo = Math.max(1, Number(filters.page) || 1);
  const summary = {
    total: all.length,
    partial: all.filter((l) => l.isPartial).length,
    byStatus: LEAD_STATUSES.reduce((acc, s) => ({ ...acc, [s]: all.filter((l) => l.status === s).length }), {}),
    crmFailed: all.filter((l) => l.crmSync === 'Failed').length,
  };
  return { items: all.slice((pageNo - 1) * perPage, pageNo * perPage), page: pageNo, perPage, summary };
}

async function getRow(capp, id) {
  if (!db.isRowId(id)) throw notFound('Lead not found');
  const row = await db.selectOne(capp, T, `ROWID = ${db.q(id)}`);
  if (!row) throw notFound('Lead not found');
  return row;
}

async function get(capp, id) {
  const row = await getRow(capp, id);
  const lead = toDto(row);
  const activity = db.parseJson(row.Notes, null);
  lead.activity = Array.isArray(activity) ? activity : row.Notes ? [{ type: 'note', text: row.Notes, time: row.CREATEDTIME }] : [];
  let page = null;
  if (db.isRowId(row.pageId)) {
    const p = await db.selectOne(capp, 'Pages', `ROWID = ${db.q(row.pageId)}`);
    if (p) page = { id: p.ROWID, name: p.PageName, slug: p.pageSlug, status: p.Status, isLive: db.toBool(p.IsLive), deleted: db.toBool(p.IsDeleted) };
  }
  lead.page = page;
  return lead;
}

async function update(capp, user, id, { status, note }) {
  const row = await getRow(capp, id);
  const patch = { ROWID: id };
  let current = row;
  if (status !== undefined) {
    if (!LEAD_STATUSES.includes(status)) throw badRequest('Unknown lead status');
    if (status !== (row.LeadStatus || 'New')) {
      patch.LeadStatus = status;
      patch.Notes = addActivity(current, { type: 'status', text: `Status changed to ${status}`, by: user.name });
      current = { ...current, Notes: patch.Notes };
    }
  }
  if (note && String(note).trim()) {
    patch.Notes = addActivity(current, { type: 'note', text: String(note).trim().slice(0, 2000), by: user.name });
  }
  if (Object.keys(patch).length > 1) await db.table(capp, T).updateRow(patch);
  return get(capp, id);
}

async function remove(capp, user, id) {
  const row = await getRow(capp, id);
  await db.table(capp, T).deleteRow(row.ROWID);
  if (db.isRowId(row.pageId) && !db.toBool(row.IsPartial)) {
    await pages.incrementCounter(capp, row.pageId, 'Lead_Count', -1).catch(() => {});
  }
  return { id };
}

async function retryCrm(capp, user, id) {
  const row = await getRow(capp, id);
  if (db.toBool(row.IsPartial)) throw badRequest('This lead has not finished the form yet');
  const pageRow = db.isRowId(row.pageId) ? await db.selectOne(capp, 'Pages', `ROWID = ${db.q(row.pageId)}`) : null;
  const result = await crm.syncLead(capp, row, pageRow);
  const fresh = await getRow(capp, id);
  await db.table(capp, T).updateRow({
    ROWID: id,
    Notes: addActivity(fresh, { type: 'crm', text: `CRM sync ${result.status}${result.error ? `: ${result.error}` : ''}`, by: user.name }),
  });
  return get(capp, id);
}

function csvCell(v) {
  const s = Array.isArray(v) ? v.join('; ') : String(v === undefined || v === null ? '' : v);
  // Neutralise spreadsheet formulas (CSV injection).
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

async function exportCsv(capp, filters = {}) {
  const leads = await listAll(capp, filters);
  const fieldKeys = [];
  leads.forEach((l) => Object.keys(l.fields || {}).forEach((k) => !fieldKeys.includes(k) && fieldKeys.push(k)));
  const header = [
    'Lead ID', 'Created', 'Name', 'Email', 'Phone', 'Page', 'Page URL slug', 'Channel', 'Channel tag',
    'UTM source', 'UTM medium', 'UTM campaign', 'UTM content', 'UTM term', 'Device', 'Status', 'Partial',
    'OTP verified', 'CRM sync', 'CRM ID', ...fieldKeys,
  ];
  const lines = [header.map(csvCell).join(',')];
  leads.forEach((l) => {
    lines.push(
      [
        l.id, l.createdTime, l.name, l.email, l.phone, l.pageName, l.pageSlug, l.channel, l.channelTag,
        l.utm.source, l.utm.medium, l.utm.campaign, l.utm.content, l.utm.term, l.device, l.status,
        l.isPartial ? 'Yes' : 'No', l.otpVerified ? 'Yes' : 'No', l.crmSync, l.crmId,
        ...fieldKeys.map((k) => l.fields[k]),
      ]
        .map(csvCell)
        .join(','),
    );
  });
  return `﻿${lines.join('\r\n')}`;
}

async function channelStats(capp, { pageId } = {}) {
  const leads = await listAll(capp, { pageId, partial: 'false' });
  const viewRows = await db.selectAll(capp, 'PageViews', pageId ? `PageId = ${db.q(pageId)}` : '', 'ORDER BY CREATEDTIME DESC', 20000);
  const views = {};
  viewRows.forEach((v) => {
    views[v.Channel] = (views[v.Channel] || 0) + Number(v.ViewCount || 0);
  });
  const names = new Set([...Object.keys(views), ...leads.map((l) => l.channel)]);
  return [...names]
    .map((channel) => {
      const n = leads.filter((l) => l.channel === channel).length;
      const v = views[channel] || 0;
      return { channel, leads: n, views: v, conversion: v ? Math.round((n / v) * 1000) / 10 : 0 };
    })
    .sort((a, b) => b.leads - a.leads || b.views - a.views);
}

module.exports = {
  LEAD_STATUSES,
  CHANNELS,
  closedReason,
  capture,
  trackView,
  listAll,
  list,
  get,
  update,
  remove,
  retryCrm,
  exportCsv,
  channelStats,
  toDto,
};
