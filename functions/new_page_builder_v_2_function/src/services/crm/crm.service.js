'use strict';

// Zoho CRM metadata and lead synchronisation. Authentication is delegated to
// crmAuth.service, so this file contains business logic only.
//
// Page mapping (Pages.formMapping):
//   { "layoutId": "<id or null>", "fields": { "<CRM api_name>": "<source>" } }
// A source is a form field name, or one of the special tokens below.

const axios = require('axios');
const config = require('../../config');
const db = require('../../utils/db');
const auth = require('./crmAuth.service');
const { badRequest, ApiError } = require('../../utils/http');

const SPECIAL_SOURCES = {
  '@page_name': 'Page name',
  '@page_url': 'Page URL',
  '@channel': 'Channel',
  '@utm_source': 'UTM source',
  '@utm_medium': 'UTM medium',
  '@utm_campaign': 'UTM campaign',
  '@utm_content': 'UTM content',
  '@utm_term': 'UTM term',
  '@lead_id': 'Catalyst lead ID',
  '@created_time': 'Submitted at',
};

async function api(capp, method, path, data, { retry = true, timeout = 15000 } = {}) {
  const token = await auth.getAccessToken(capp);
  if (!token) throw badRequest('Zoho CRM is not connected');
  const base = await auth.apiDomain(capp);
  try {
    const res = await axios({
      method,
      url: `${base}/crm/v7${path}`,
      data,
      timeout,
      headers: { Authorization: `Zoho-oauthtoken ${token}` },
    });
    return res.data;
  } catch (e) {
    const code = e.response && e.response.data && e.response.data.code;
    if (retry && e.response && e.response.status === 401 && /INVALID_TOKEN|AUTHENTICATION_FAILURE/.test(code || 'INVALID_TOKEN')) {
      await auth.getAccessToken(capp, { forceRefresh: true });
      return api(capp, method, path, data, { retry: false, timeout });
    }
    const msg = (e.response && e.response.data && (e.response.data.message || JSON.stringify(e.response.data))) || e.message;
    const err = new ApiError(e.response && e.response.status === 400 ? 400 : 502, `Zoho CRM: ${msg}`);
    err.crm = e.response && e.response.data;
    throw err;
  }
}

async function getLayouts(capp) {
  const data = await api(capp, 'get', `/settings/layouts?module=${config.crm.module}`);
  return (data.layouts || []).map((l) => ({ id: l.id, name: l.name }));
}

async function getFields(capp, layoutId) {
  if (layoutId) {
    const data = await api(capp, 'get', `/settings/layouts/${encodeURIComponent(layoutId)}?module=${config.crm.module}`);
    const layout = (data.layouts || [])[0] || {};
    const fields = [];
    (layout.sections || []).forEach((s) =>
      (s.fields || []).forEach((f) => {
        if (f.view_type && f.view_type.create === false) return;
        fields.push({ apiName: f.api_name, label: f.field_label || f.display_label, type: f.data_type, mandatory: !!f.required || !!f.system_mandatory });
      }),
    );
    return fields;
  }
  const data = await api(capp, 'get', `/settings/fields?module=${config.crm.module}`);
  return (data.fields || [])
    .filter((f) => !f.read_only && f.data_type !== 'ownerlookup' && f.view_type && f.view_type.create !== false)
    .map((f) => ({ apiName: f.api_name, label: f.field_label || f.display_label, type: f.data_type, mandatory: !!f.system_mandatory }));
}

// Field types and lengths of the CRM module, kept for 10 minutes so a burst
// of leads does not refetch them.
const META_TTL = 10 * 60 * 1000;
let metaCache = null;
async function fieldMeta(capp) {
  if (metaCache && metaCache.at > Date.now() - META_TTL) return metaCache.fields;
  const data = await api(capp, 'get', `/settings/fields?module=${config.crm.module}`);
  const fields = {};
  (data.fields || []).forEach((f) => {
    fields[f.api_name] = { type: f.data_type, length: Number(f.length) || 0, label: f.field_label || f.display_label };
  });
  metaCache = { at: Date.now(), fields };
  return fields;
}

const NUMBER_TYPES = ['integer', 'bigint', 'double', 'currency', 'decimal', 'percent'];
const pad = (n) => String(n).padStart(2, '0');

// Convert a form value to what the CRM field accepts. Returns undefined when
// it cannot be converted (the field is then left out, not the whole lead).
// Example: "11-50" for an integer field becomes 11; "₹5,00,000" becomes 500000.
function toCrmValue(value, meta) {
  if (!meta) return value;
  const text = String(value).trim();
  const { type, length } = meta;
  if (NUMBER_TYPES.includes(type)) {
    const m = text.replace(/[,\s₹$]/g, '').match(/-?\d+(\.\d+)?/);
    if (!m) return undefined;
    // Indian amounts: "₹5 lakh", "2 crore", "50k".
    const scale = /crore|\bcr\b/i.test(text) ? 1e7 : /lakh|lac\b/i.test(text) ? 1e5 : /\d\s*k\b|thousand/i.test(text) ? 1e3 : 1;
    const n = Number(m[0]) * (type === 'percent' ? 1 : scale);
    if (!Number.isFinite(n)) return undefined;
    if (type === 'integer' || type === 'bigint') {
      const i = Math.trunc(n);
      if (length && String(Math.abs(i)).length > length) return undefined;
      return i;
    }
    return n;
  }
  if (type === 'boolean') return /^(true|yes|y|1|on|checked|agreed)$/i.test(text);
  if (type === 'date' || type === 'datetime') {
    const d = new Date(text);
    if (Number.isNaN(d.getTime())) return undefined;
    if (type === 'date') return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return d.toISOString().replace(/\.\d{3}Z$/, '+00:00');
  }
  if (type === 'multiselectpicklist') return text.split(/\s*[;,]\s*/).filter(Boolean);
  if (['lookup', 'ownerlookup', 'userlookup', 'multiselectlookup', 'fileupload', 'imageupload', 'profileimage'].includes(type)) return undefined;
  return length ? text.slice(0, length) : text;
}

function resolveSource(source, lead, data) {
  if (!source) return undefined;
  if (source.startsWith('@')) {
    const map = {
      '@page_name': lead.PageName,
      '@page_url': lead.LandingUrl,
      '@channel': lead.Channel,
      '@utm_source': lead.utm_source,
      '@utm_medium': lead.utm_medium,
      '@utm_campaign': lead.utm_campaign,
      '@utm_content': lead.utm_content,
      '@utm_term': lead.utm_term,
      '@lead_id': lead.ROWID,
      '@created_time': lead.CREATEDTIME,
    };
    return map[source];
  }
  const v = data[source];
  return Array.isArray(v) ? v.join(';') : v;
}

function buildRecord(lead, mapping, meta = null, dropped = []) {
  const data = db.parseJson(lead.Lead_data, {}) || {};
  const fields = (mapping && mapping.fields) || {};
  const record = {};
  Object.entries(fields).forEach(([crmField, source]) => {
    const raw = resolveSource(source, lead, data.fields || data);
    if (raw === undefined || raw === null || raw === '') return;
    const v = meta ? toCrmValue(raw, meta[crmField]) : raw;
    if (v === undefined) dropped.push(`${crmField} ("${String(raw).slice(0, 40)}" does not fit ${/^[aeiou]/i.test(meta[crmField].type) ? 'an' : 'a'} ${meta[crmField].type} field)`);
    else record[crmField] = v;
  });
  // Sensible defaults so a lead never fails just because a field is unmapped.
  if (!record.Last_Name) record.Last_Name = lead.Name || lead.Email || lead.Phone || 'Website lead';
  if (!record.Email && lead.Email) record.Email = lead.Email;
  if (!record.Mobile && !record.Phone && lead.Phone) record.Mobile = lead.Phone;
  if (!record.Lead_Source) record.Lead_Source = config.crm.leadSource;
  if (!record.Description) {
    record.Description = `Captured from "${lead.PageName}" via ${lead.Channel || 'Direct'}${lead.utm_campaign ? ` (campaign ${lead.utm_campaign})` : ''}.`;
  }
  if (mapping && mapping.layoutId) record.Layout = { id: mapping.layoutId };
  return record;
}

async function syncLead(capp, leadRow, pageRow) {
  const status = await auth.status(capp);
  if (!status.connected) {
    await db.table(capp, 'Leads').updateRow({ ROWID: leadRow.ROWID, CRMSync: 'Skipped', CRMError: 'CRM not connected' });
    return { status: 'Skipped' };
  }
  const mapping = db.parseJson(pageRow && pageRow.formMapping, null);
  if (!mapping || !mapping.fields || !Object.keys(mapping.fields).length) {
    await db.table(capp, 'Leads').updateRow({ ROWID: leadRow.ROWID, CRMSync: 'Skipped', CRMError: 'No CRM mapping for this page' });
    return { status: 'Skipped' };
  }
  try {
    const meta = await fieldMeta(capp).catch(() => null);
    const dropped = [];
    const record = buildRecord(leadRow, mapping, meta, dropped);
    const send = () =>
      leadRow.CRMId
        ? api(capp, 'put', `/${config.crm.module}/${encodeURIComponent(leadRow.CRMId)}`, { data: [record], trigger: ['workflow'] })
        : api(capp, 'post', `/${config.crm.module}`, { data: [record], trigger: ['workflow'] });
    // A value CRM still rejects (e.g. a restricted picklist) costs only that
    // field: leave it out and send the rest, up to 3 times.
    let item;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      let res;
      try {
        // eslint-disable-next-line no-await-in-loop
        res = await send();
      } catch (e) {
        res = e.crm && Array.isArray(e.crm.data) ? e.crm : null;
        if (!res) throw e;
      }
      item = (res.data || [])[0] || {};
      const bad = item.status !== 'success' && item.code === 'INVALID_DATA' && item.details && item.details.api_name;
      if (!bad || attempt === 3 || bad === 'Last_Name' || !(bad in record)) break;
      dropped.push(`${bad} (CRM: ${item.message || 'invalid data'}${item.details.expected_data_type ? `, expects ${item.details.expected_data_type}` : ''})`);
      delete record[bad];
    }
    if (item.status !== 'success') {
      const why = item.details && item.details.api_name ? ` (${item.details.api_name})` : '';
      throw new Error(`Zoho CRM: ${item.message || 'CRM rejected the record'}${why}`);
    }
    const crmId = (item.details && item.details.id) || leadRow.CRMId;
    const note = dropped.length ? `Synced without: ${dropped.join('; ')}`.slice(0, 1000) : '';
    await db.table(capp, 'Leads').updateRow({ ROWID: leadRow.ROWID, CRMSync: 'Synced', CRMId: String(crmId), CRMError: note });
    return { status: 'Synced', crmId, dropped };
  } catch (e) {
    await db.table(capp, 'Leads').updateRow({ ROWID: leadRow.ROWID, CRMSync: 'Failed', CRMError: String(e.message).slice(0, 1000) });
    return { status: 'Failed', error: e.message };
  }
}

// Best-effort sync during lead capture, bounded so the visitor never waits.
async function syncLeadWithTimeout(capp, leadRow, pageRow) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve({ status: 'Pending' }), config.crm.syncTimeoutMs);
  });
  try {
    return await Promise.race([syncLead(capp, leadRow, pageRow), timeout]);
  } catch (e) {
    return { status: 'Failed', error: e.message };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { SPECIAL_SOURCES, getLayouts, getFields, buildRecord, toCrmValue, syncLead, syncLeadWithTimeout };
