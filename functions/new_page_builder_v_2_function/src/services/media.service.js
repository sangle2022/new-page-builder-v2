'use strict';

// Image gallery: uploaded and AI-generated images in one library (Media
// table + public media bucket). Both kinds are searchable and reusable.

const config = require('../config');
const db = require('../utils/db');
const storage = require('./storage.service');
const gemini = require('./ai/gemini.client');
const { safeObjectName, promptTokens, normalizePrompt, cosine } = require('../utils/text');
const { badRequest, notFound, forbidden } = require('../utils/http');
const { can, P } = require('../config/roles');

const T = 'Media';
const MAX_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'];

const tagsOf = (row) =>
  String(row.Tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

function toDto(row) {
  return {
    id: row.ROWID,
    name: row.File_Name || 'image',
    url: row.File_Url,
    source: row.Source || 'upload',
    mimeType: row.MimeType || '',
    size: Number(row.SizeBytes || 0),
    prompt: row.Prompt || '',
    tags: tagsOf(row),
    aspectRatio: row.AspectRatio || '',
    model: row.Model || '',
    usageCount: Number(row.UsageCount || 0),
    createdBy: row.CreatedByName || '',
    createdTime: row.CREATEDTIME,
  };
}

function datedKey(prefix, name, ext) {
  const d = new Date();
  const base = safeObjectName(name, 'image').replace(/\.[a-z0-9]+$/i, '').slice(0, 60);
  return `${prefix}/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${Date.now().toString(36)}-${base}.${ext}`;
}

const extFor = (mime) => ({ 'image/jpeg': 'jpg', 'image/svg+xml': 'svg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' }[mime] || 'png');

async function allRows(capp) {
  return db.selectAll(capp, T, '', 'ORDER BY CREATEDTIME DESC', 5000);
}

// Keyword score over name, prompt and tags (0..1).
function keywordScore(row, tokens) {
  if (!tokens.length) return 0;
  const hay = new Set(promptTokens(`${row.File_Name || ''} ${row.Prompt || ''} ${(row.Tags || '').replace(/,/g, ' ')}`));
  const hits = tokens.filter((t) => hay.has(t) || [...hay].some((h) => h.startsWith(t))).length;
  return hits / tokens.length;
}

async function list(capp, { search, source, sort = 'recent', limit = 200, semantic = true } = {}) {
  let rows = (await allRows(capp)).filter((r) => r.File_Url);
  if (source && source !== 'all') rows = rows.filter((r) => (r.Source || 'upload') === source);
  const q = String(search || '').trim();
  if (q) {
    const tokens = promptTokens(q);
    let qEmb = null;
    if (semantic && gemini.isConfigured()) qEmb = await gemini.embed(q, 'SEMANTIC_SIMILARITY');
    rows = rows
      .map((r) => {
        const kw = keywordScore(r, tokens);
        const emb = qEmb ? db.parseJson(r.Embedding, null) : null;
        const sem = emb ? cosine(qEmb, emb) : 0;
        // Semantic similarity rises above ~0.6 for related concepts.
        const score = Math.max(kw, sem ? (sem - 0.55) / 0.45 : 0);
        return { r, score };
      })
      .filter((x) => x.score > 0.25)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.r);
  } else if (sort === 'popular') {
    rows.sort((a, b) => Number(b.UsageCount || 0) - Number(a.UsageCount || 0));
  }
  return rows.slice(0, Math.min(500, Number(limit) || 200)).map(toDto);
}

async function getRow(capp, id) {
  if (!db.isRowId(id)) throw notFound('Image not found');
  const row = await db.selectOne(capp, T, `ROWID = ${db.q(id)}`);
  if (!row) throw notFound('Image not found');
  return row;
}

// file: express-fileupload object { name, data, mimetype, size }
async function upload(capp, user, file, { tags = [], description = '' } = {}) {
  if (!file || !file.data) throw badRequest('Choose an image to upload');
  if (!IMAGE_TYPES.includes(file.mimetype)) throw badRequest(`${file.name}: only PNG, JPG, WebP, GIF, SVG or AVIF images can be uploaded`);
  if (file.size > MAX_BYTES || file.data.length > MAX_BYTES) throw badRequest(`${file.name}: images must be under 10 MB`);
  if (file.mimetype === 'image/svg+xml' && /<script|on\w+=/i.test(file.data.toString('utf8'))) {
    throw badRequest(`${file.name}: SVG files with scripts are not allowed`);
  }
  const key = datedKey('media/uploads', file.name, extFor(file.mimetype));
  const url = await storage.putMedia(capp, key, file.data, file.mimetype);
  const nameTokens = promptTokens(file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' '));
  const allTags = [...new Set([...tags.map((t) => String(t).toLowerCase().trim()).filter(Boolean), ...nameTokens])].slice(0, 15);
  const text = `${description} ${allTags.join(' ')}`.trim();
  const embedding = text ? await gemini.embed(text) : null;
  const row = await db.table(capp, T).insertRow({
    File_Name: String(file.name).slice(0, 250),
    File_Url: url,
    ObjectKey: key,
    Source: 'upload',
    MimeType: file.mimetype,
    SizeBytes: file.size || file.data.length,
    Prompt: description || '',
    NormalizedPrompt: normalizePrompt(text),
    Tags: allTags.join(','),
    Embedding: embedding ? JSON.stringify(embedding) : '',
    UsageCount: 0,
    CreatedByName: user.name,
  });
  return toDto(row);
}

async function saveGenerated(capp, user, { buffer, mimeType, prompt, tags, alt, aspectRatio, model, embedding }) {
  const key = datedKey('media/ai', alt || prompt.slice(0, 50), extFor(mimeType));
  const url = await storage.putMedia(capp, key, buffer, mimeType);
  const row = await db.table(capp, T).insertRow({
    File_Name: `${safeObjectName(alt || prompt.slice(0, 50), 'ai-image')}.${extFor(mimeType)}`.slice(0, 250),
    File_Url: url,
    ObjectKey: key,
    Source: 'ai',
    MimeType: mimeType,
    SizeBytes: buffer.length,
    Prompt: prompt.slice(0, 4000),
    NormalizedPrompt: normalizePrompt(prompt),
    Tags: (tags && tags.length ? tags : promptTokens(prompt).slice(0, 8)).join(','),
    Embedding: embedding ? JSON.stringify(embedding) : '',
    AspectRatio: aspectRatio || '',
    Model: model || config.gemini.imageModel,
    UsageCount: 1,
    CreatedByName: user.name,
  });
  return toDto(row);
}

async function update(capp, user, id, { name, tags }) {
  await getRow(capp, id);
  const patch = { ROWID: id };
  if (name) patch.File_Name = String(name).slice(0, 250);
  if (Array.isArray(tags)) patch.Tags = tags.map((t) => String(t).toLowerCase().trim()).filter(Boolean).slice(0, 20).join(',');
  const row = await db.table(capp, T).updateRow(patch);
  return toDto({ ...(await getRow(capp, id)), ...row });
}

async function remove(capp, user, id) {
  const row = await getRow(capp, id);
  const own = row.CreatedByName && row.CreatedByName === user.name;
  if (!can(user.role, P.MEDIA_DELETE) && !own) throw forbidden('You can only delete images you added');
  if (row.ObjectKey) await storage.removeQuietly(capp, row.ObjectKey, config.buckets.media);
  await db.table(capp, T).deleteRow(row.ROWID);
  return { id, usageCount: Number(row.UsageCount || 0) };
}

async function markUsed(capp, ids = []) {
  const unique = [...new Set(ids.filter(db.isRowId))].slice(0, 50);
  await Promise.all(
    unique.map(async (id) => {
      const row = await db.selectOne(capp, T, `ROWID = ${db.q(id)}`);
      if (row) await db.table(capp, T).updateRow({ ROWID: id, UsageCount: Number(row.UsageCount || 0) + 1 });
    }),
  );
  return { updated: unique.length };
}

async function stats(capp) {
  const rows = await allRows(capp);
  return {
    total: rows.length,
    ai: rows.filter((r) => r.Source === 'ai').length,
    uploads: rows.filter((r) => r.Source !== 'ai').length,
    reuses: rows.reduce((n, r) => n + Math.max(0, Number(r.UsageCount || 0) - 1), 0),
  };
}

module.exports = { toDto, list, getRow, upload, saveGenerated, update, remove, markUsed, stats, allRows };
