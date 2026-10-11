'use strict';

const escapeHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const escapeAttr = escapeHtml;

function slugify(value, max = 60) {
  return (
    String(value || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, max) || 'page'
  );
}

// Object keys must stay URL safe: Stratus encodes keys differently across
// APIs, so spaces and other characters make objects unreadable (see V1).
function safeObjectName(name, fallback = 'file') {
  const cleaned = String(name || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9._-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^[.-]+/, '');
  return cleaned.length ? cleaned.slice(0, 120) : fallback;
}

const STOP_WORDS = new Set(
  (
    'a an the of for and or with in on at to from by is are be this that these those image photo picture ' +
    'generate create make show me please some very high quality hd 4k realistic photorealistic style'
  ).split(' '),
);

function stem(t) {
  if (t.length > 4 && t.endsWith('ies')) return `${t.slice(0, -3)}y`;
  if (t.length > 3 && t.endsWith('s') && !t.endsWith('ss')) return t.slice(0, -1);
  return t;
}

// Lowercase, strip punctuation, drop filler words, light plural stemming,
// de-duplicate and sort. Two prompts asking for the same thing normalize to
// the same token list.
function promptTokens(prompt) {
  const tokens = String(prompt || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
    .map(stem);
  return [...new Set(tokens)].sort();
}

const normalizePrompt = (prompt) => promptTokens(prompt).join(' ');

function jaccard(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter += 1;
  return inter / (A.size + B.size - inter);
}

function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || !a.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

const truncate = (s, n) => (String(s || '').length > n ? `${String(s).slice(0, n)}…` : String(s || ''));

module.exports = { escapeHtml, escapeAttr, slugify, safeObjectName, promptTokens, normalizePrompt, jaccard, cosine, truncate };
