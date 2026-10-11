'use strict';

// Finds gallery images that already match a new image request, so the
// builder can reuse them instead of paying for another generation.
//
// Matching, best first:
//   1. Semantic: cosine similarity of Gemini embeddings (prompt vs stored
//      Embedding), reuse at >= IMAGE_REUSE_THRESHOLD (default 0.86).
//   2. Lexical fallback when either side has no embedding: Jaccard overlap of
//      normalised prompt tokens + tags, reuse at >= IMAGE_REUSE_JACCARD (0.6).
//   An identical normalised prompt is always a match.

const config = require('../../config');
const db = require('../../utils/db');
const media = require('../media.service');
const { promptTokens, normalizePrompt, jaccard, cosine } = require('../../utils/text');

function scoreRow(row, { normalized, tokens, embedding }) {
  if (row.NormalizedPrompt && row.NormalizedPrompt === normalized) return { score: 1, method: 'exact' };
  const stored = embedding ? db.parseJson(row.Embedding, null) : null;
  if (embedding && Array.isArray(stored) && stored.length === embedding.length) {
    return { score: cosine(embedding, stored), method: 'semantic' };
  }
  const rowTokens = [
    ...new Set([
      ...String(row.NormalizedPrompt || normalizePrompt(row.Prompt || row.File_Name || '')).split(' ').filter(Boolean),
      ...promptTokens(String(row.Tags || '').replace(/,/g, ' ')),
    ]),
  ];
  return { score: jaccard(tokens, rowTokens), method: 'keyword' };
}

const isMatch = ({ score, method }) =>
  method === 'exact' || (method === 'semantic' ? score >= config.gemini.reuseThreshold : score >= config.gemini.reuseJaccardThreshold);

// Returns { best, candidates } where best is a reusable match or null and
// candidates are the closest images (for "use one of these instead").
async function findSimilar(capp, prompt, { embedding = null, limit = 6 } = {}) {
  const normalized = normalizePrompt(prompt);
  const tokens = normalized.split(' ').filter(Boolean);
  if (!tokens.length) return { best: null, candidates: [] };
  const rows = (await media.allRows(capp)).filter((r) => r.File_Url && (r.Prompt || r.Tags || r.NormalizedPrompt));
  const scored = rows
    .map((row) => ({ row, ...scoreRow(row, { normalized, tokens, embedding }) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  const top = scored[0];
  const toItem = (x) => ({ ...media.toDto(x.row), score: Math.round(x.score * 1000) / 1000, method: x.method });
  return {
    best: top && isMatch(top) ? toItem(top) : null,
    candidates: scored
      .filter((x) => (x.method === 'semantic' ? x.score >= 0.7 : x.score >= 0.25))
      .slice(0, limit)
      .map(toItem),
  };
}

module.exports = { findSimilar, isMatch };
