'use strict';

// AI page modification: natural-language instruction -> a list of targeted
// operations. The builder applies them to the live editor (each one is a
// normal, undoable editor change), so only the targeted components change
// and the page stays fully editable.
//
// Operation format (validated and normalised here):
//   { op: 'update_element', target, html }
//   { op: 'insert_section', html, position: before|after|start|end, reference }
//   { op: 'remove_element', target }
//   { op: 'move_section', target, position: before|after, reference }
//   { op: 'update_theme', theme }
//   { op: 'set_style', target, css }
//   { op: 'update_settings', settings: { title, description } }

const config = require('../../config');
const gemini = require('./gemini.client');
const aiLog = require('./aiLog.service');
const prompts = require('./prompts');
const { cleanTheme } = require('./pageGeneration.service');
const { renderSection, newId, placeholderUrl } = require('../../shared/sectionLibrary');
const { sanitizeHtml, textOf } = require('../../utils/html');
const { formConfigFromHtml, fieldHtml, normalizeField } = require('../../shared/formMarkup');
const { badRequest } = require('../../utils/http');

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

// Outer HTML of the element with data-pb-id="<id>", found by balancing tags.
function extractElement(html, id) {
  const src = String(html || '');
  const safeId = String(id).replace(/[^\w-]/g, '');
  const startRe = new RegExp(`<([a-zA-Z][\\w-]*)\\b[^>]*\\bdata-pb-id="${safeId}"[^>]*>`, 'i');
  const m = startRe.exec(src);
  if (!m) return null;
  const tag = m[1].toLowerCase();
  if (VOID.has(tag) || m[0].endsWith('/>')) return m[0];
  const tagRe = new RegExp(`<(/?)${tag}\\b[^>]*?(/?)>`, 'gi');
  tagRe.lastIndex = m.index + m[0].length;
  let depth = 1;
  let t;
  // eslint-disable-next-line no-cond-assign
  while ((t = tagRe.exec(src))) {
    if (t[1]) depth -= 1;
    else if (!t[2]) depth += 1;
    if (depth === 0) return src.slice(m.index, t.index + t[0].length);
  }
  return src.slice(m.index);
}

// "1. hero [s1a2b3c4] "Sky residences with a view""
function outline(html) {
  const out = [];
  const re = /<(section|header|footer|div|nav|main|article|aside)\b[^>]*\bdata-pb-section="([\w-]+)"[^>]*\bdata-pb-id="([\w-]+)"[^>]*>|<(section|header|footer|div|nav|main|article|aside)\b[^>]*\bdata-pb-id="([\w-]+)"[^>]*\bdata-pb-section="([\w-]+)"[^>]*>/gi;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(html))) {
    const type = m[2] || m[6];
    const id = m[3] || m[5];
    const el = extractElement(html, id) || '';
    const heading = (el.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i) || [])[1];
    out.push(`${out.length + 1}. ${type} [${id}]${heading ? ` "${textOf(heading, 80)}"` : ''}`);
  }
  return out.length ? out.join('\n') : '(no tagged sections; the page was built manually)';
}

function cleanCss(css) {
  let s = String(css || '');
  // A background-color alone is hidden by gradient section backgrounds.
  if (/background-color\s*:/i.test(s) && !/background(-image)?\s*:/i.test(s.replace(/background-color/gi, ''))) {
    s = s.replace(/background-color\s*:/gi, 'background:');
  }
  return s
    .replace(/[<>{}]/g, '')
    .replace(/expression\s*\(|javascript:|@import/gi, '')
    .slice(0, 2000);
}

function fixImages(html) {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    if (!/src="(PLACEHOLDER|)"/i.test(tag) && /\ssrc="/i.test(tag)) return tag;
    const alt = (tag.match(/\salt="([^"]*)"/i) || [])[1] || 'Image';
    const withSrc = /\ssrc="/i.test(tag) ? tag.replace(/\ssrc="[^"]*"/i, ` src="${placeholderUrl(alt)}"`) : tag.replace(/<img/i, `<img src="${placeholderUrl(alt)}"`);
    return /data-pb-image-prompt=/i.test(withSrc) ? withSrc : withSrc.replace(/<img/i, `<img data-pb-image-prompt="${alt}"`);
  });
}

class UrlShortener {
  constructor() {
    this.map = new Map();
  }

  shrink(html) {
    return String(html).replace(/(https?:\/\/|\/server\/|data:)[^"'\s)]{40,}/g, (url) => {
      const token = `PBURL${this.map.size + 1}`;
      this.map.set(token, url);
      return token;
    });
  }

  restore(html) {
    return String(html).replace(/PBURL\d+/g, (t) => this.map.get(t) || t);
  }
}

// Make sure the replacement keeps the target's identity so later edits can
// still find it.
function keepIdentity(newHtml, target, original) {
  if (new RegExp(`data-pb-id="${target}"`).test(newHtml)) return newHtml;
  const section = original && (original.match(/data-pb-section="([\w-]+)"/) || [])[1];
  const extra = ` data-pb-id="${target}"${section && !/data-pb-section=/.test(newHtml) ? ` data-pb-section="${section}"` : ''}`;
  return newHtml.replace(/^(\s*<[a-zA-Z][\w-]*)/, `$1${extra}`);
}

const SAFE_ATTRS = ['href', 'target', 'title', 'alt', 'rel'];

const stripEmpty = (obj) => Object.fromEntries(Object.entries(obj || {}).filter(([, v]) => v !== undefined && v !== null && v !== ''));

// Full CSS rules from the AI (hover effects, keyframes, gradients…). Only
// styling survives: no imports, scripts, behaviours or remote fonts/urls
// other than images over https.
function cleanRules(css) {
  let s = String(css || '').slice(0, 20000);
  s = s.replace(/<\/?[a-z][^>]*>/gi, '');
  s = s.replace(/@import[^;]*;?/gi, '').replace(/@charset[^;]*;?/gi, '');
  s = s.replace(/expression\s*\(|behavior\s*:|-moz-binding|javascript:|vbscript:/gi, '');
  s = s.replace(/url\(\s*(['"]?)(?!https:\/\/|data:image\/)[^)]*\)+/gi, 'none');
  const open = (s.match(/\{/g) || []).length;
  const close = (s.match(/\}/g) || []).length;
  return open && open === close ? s.trim() : '';
}

// "body { background:#0B0B0F; color:#F1F5F9 }" -> theme { background, text }
function bodyRuleToTheme(css) {
  let theme = null;
  const rest = css.replace(/(^|\})\s*(?:html\s*,\s*)?body\s*\{([^}]*)\}/gi, (m, lead, decls) => {
    const get = (prop) => (decls.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;!]+)`, 'i')) || [])[1];
    const t = cleanTheme({ background: get('background-color') || get('background'), text: get('color') });
    if (!Object.keys(t).length) return m;
    theme = { ...(theme || {}), ...t };
    return lead;
  });
  return { theme, rest: rest.trim() };
}

function normalizeOps(ops, html) {
  const classic = !/class="[^"]*\bpb-section\b/.test(html);
  const exists = (id) => !!id && new RegExp(`data-pb-id="${String(id).replace(/[^\w-]/g, '')}"`).test(html);
  const fields = formConfigFromHtml(html);
  const out = [];
  (Array.isArray(ops) ? ops : []).forEach((o) => {
    if (!o || !o.op) return;
    switch (o.op) {
      case 'update_element': {
        if (!exists(o.target) || !o.html) return;
        const clean = fixImages(sanitizeHtml(o.html));
        if (!clean) return;
        out.push({ op: o.op, target: o.target, html: keepIdentity(clean, o.target, extractElement(html, o.target)), note: o.note || '' });
        break;
      }
      case 'insert_section': {
        if (!o.section || !o.section.type) return;
        const sectionHtml = renderSection({ ...o.section, pbId: newId() });
        const position = ['before', 'after', 'start', 'end'].includes(o.position) ? o.position : 'end';
        const reference = exists(o.reference) ? o.reference : null;
        out.push({ op: o.op, html: sectionHtml, position: reference ? position : position === 'start' ? 'start' : 'end', reference, note: o.note || '' });
        break;
      }
      case 'remove_element':
        if (exists(o.target)) out.push({ op: o.op, target: o.target, note: o.note || '' });
        break;
      case 'move_section':
        if (exists(o.target) && exists(o.reference) && o.target !== o.reference) {
          out.push({ op: o.op, target: o.target, position: o.position === 'before' ? 'before' : 'after', reference: o.reference, note: o.note || '' });
        }
        break;
      case 'update_theme': {
        const theme = cleanTheme(o.theme || {});
        if (Object.keys(theme).length) out.push({ op: o.op, theme, note: o.note || '' });
        break;
      }
      case 'set_style':
        if (exists(o.target) && o.css) out.push({ op: o.op, target: o.target, css: cleanCss(o.css), note: o.note || '' });
        break;
      case 'add_css': {
        let css = cleanRules(o.css);
        // On design-system pages a page-wide colour belongs in the theme
        // (it recolours sections, cards and forms); a body{} rule would only
        // change the page behind them.
        if (css && !classic) {
          const { theme, rest } = bodyRuleToTheme(css);
          if (theme) out.push({ op: 'update_theme', theme, note: 'page colours' });
          css = rest;
        }
        if (css) out.push({ op: o.op, css, note: o.note || '' });
        break;
      }
      case 'add_class':
      case 'remove_class': {
        // Models send either ["a","b"] or "a b".
        const list = Array.isArray(o.classes) ? o.classes : String(o.classes || '').split(/[\s,]+/);
        const classes = list.map(String).filter((c) => /^[A-Za-z][\w-]{0,60}$/.test(c)).slice(0, 12);
        if (exists(o.target) && classes.length) out.push({ op: o.op, target: o.target, classes, note: o.note || '' });
        break;
      }
      case 'set_attribute': {
        if (!exists(o.target) || !o.attributes) return;
        const attrs = {};
        Object.entries(o.attributes).forEach(([k, v]) => {
          if (!SAFE_ATTRS.includes(k) || v === undefined || v === null) return;
          const val = String(v).slice(0, 500);
          if (/^\s*(javascript|vbscript|data):/i.test(val)) return;
          if (k === 'target' && !['_blank', '_self'].includes(val)) return;
          attrs[k] = val;
        });
        if (attrs.target === '_blank') attrs.rel = 'noopener';
        if (Object.keys(attrs).length) out.push({ op: o.op, target: o.target, attributes: attrs, note: o.note || '' });
        break;
      }
      case 'add_field': {
        if (!o.field || !o.field.label) return;
        const field = normalizeField(o.field);
        const taken = new Set(fields.map((f) => f.name));
        while (taken.has(field.name)) field.name = `${field.name}_2`;
        out.push({
          op: o.op,
          html: fieldHtml(field),
          name: field.name,
          step: Number(o.field.step) || null,
          after: fields.some((f) => f.name === o.fieldName) ? o.fieldName : null,
          target: exists(o.target) ? o.target : null,
          note: o.note || '',
        });
        break;
      }
      case 'update_field': {
        const current = fields.find((f) => f.name === o.fieldName);
        if (!current || !o.field) return;
        // Keep the key (CRM mapping and lead data depend on it) unless asked.
        const merged = normalizeField({ ...current, ...stripEmpty(o.field), name: o.field.name || current.name });
        out.push({ op: o.op, name: current.name, html: fieldHtml(merged), note: o.note || '' });
        break;
      }
      case 'remove_field':
        if (fields.some((f) => f.name === o.fieldName)) out.push({ op: o.op, name: o.fieldName, note: o.note || '' });
        break;
      case 'update_form': {
        const f = o.form || {};
        const form = {};
        ['submitLabel', 'successMessage', 'title', 'subtitle'].forEach((k) => {
          if (f[k]) form[k] = String(f[k]).slice(0, 300);
        });
        if (f.redirectUrl && /^https?:\/\//i.test(f.redirectUrl)) form.redirectUrl = String(f.redirectUrl).slice(0, 500);
        if (Object.keys(form).length) out.push({ op: o.op, form, target: exists(o.target) ? o.target : null, note: o.note || '' });
        break;
      }
      case 'set_image': {
        // Picture for the target: replace an <img>, add one inside a
        // container, or use it as the background. The builder generates it.
        const prompt = String(o.prompt || o.imagePrompt || '').trim().slice(0, 1500);
        if (!exists(o.target) || prompt.length < 3) return;
        const placement = ['inside', 'background', 'replace'].includes(o.placement) ? o.placement : null;
        out.push({ op: o.op, target: o.target, prompt, alt: String(o.alt || '').slice(0, 200), placement, note: o.note || '' });
        break;
      }
      case 'update_settings':
        if (o.settings && (o.settings.title || o.settings.description)) {
          out.push({
            op: o.op,
            settings: { title: String(o.settings.title || '').slice(0, 120), description: String(o.settings.description || '').slice(0, 300) },
            note: o.note || '',
          });
        }
        break;
      default:
    }
  });
  return out;
}

// "create the image of gym training and attach to selected section" -> "gym training"
function imagePromptFrom(text) {
  const t = String(text).trim();
  const m = t.match(/\b(?:of|showing|with|for|to)\s+(?:an?\s+|the\s+)?(.+?)(?:\s+(?:and|to|in|into|on)\s+(?:attach|add|put|use|place|set|the|this|that|selected|it)\b.*)?$/i);
  const subject = (m ? m[1] : t.replace(/\b(please|create|generate|add|attach|make|an?|the|image|photo|picture|here|selected|section|div)\b/gi, ' '))
    .replace(/\s+/g, ' ')
    .trim();
  return (subject.length >= 3 ? subject : t).slice(0, 300);
}

// Requests about the whole page's design, as opposed to a single change.
const WHOLE_PAGE_DESIGN =
  /\b(overall|whole|entire|full page|complete page|all sections|everything|redesign|revamp|premium|luxur|attractive|modern|impressive|beautiful|stunning|professional|elegant|polish|look and feel|make the page|improve the page|page feel|page look)/i;

function useAdvancedModel(instruction, selected) {
  if (process.env.PB_JOB_RUNTIME !== '1' || !config.gemini.advancedModel) return false;
  // "make this section more premium" with a section selected is still a
  // single-element change unless the request clearly says page/overall.
  const pageWords = /\b(page|overall|whole|entire|everything|all sections|site|website)\b/i.test(instruction);
  return WHOLE_PAGE_DESIGN.test(instruction) && (!selected || pageWords);
}

async function modify(capp, user, { pageId, instruction, html, css, selectedId }) {
  const text = String(instruction || '').trim();
  if (text.length < 3) throw badRequest('Tell the AI what to change');
  const page = String(html || '');
  if (page.length > 600000) throw badRequest('This page is too large for AI editing. Select a section and try again.');

  // Long URLs (images, data URIs) cost tokens and time; send short tokens
  // and put the real URLs back into the answer.
  const urls = new UrlShortener();
  let selected = null;
  if (selectedId) {
    const el = extractElement(page, selectedId);
    if (el) selected = { id: selectedId, html: urls.shrink(el.slice(0, 60000)) };
  }

  // The whole page is sent when the request is about the page, or when the
  // work runs as a background job (no time limit). Otherwise only the
  // selection plus an outline, which keeps a web request fast.
  const pageWide = /\b(page|overall|whole|entire|everything|all sections|site|website|theme|modern|impressive|animat)/i.test(text);
  const sendPage = !selected || pageWide || config.aiJobs.pool;
  const fields = formConfigFromHtml(page).map((f) => `${f.name} (${f.type}${f.required ? ', required' : ''}${f.otp ? ', otp' : ''}, step ${f.step}): "${f.label}"`);

  // Whole-page design changes ("make the page more premium", "redesign",
  // "add animations everywhere") use the advanced (Pro) model; normal edits
  // use the fast model. Pro is slow, so only inside the background job.
  const advanced = useAdvancedModel(text, selected);
  // Classic (Bootstrap/Tailwind) pages do not use the pb- design system, so
  // theme variables have no effect there.
  const classic = !/class="[^"]*\bpb-section\b/.test(page);
  const result = await aiLog.track(capp, user, { kind: 'page_modify', prompt: text, pageId }, () =>
    gemini.generateJson({
      system: prompts.MODIFY_SYSTEM,
      prompt: prompts.modifyPrompt({ instruction: text, outline: outline(page), html: sendPage ? urls.shrink(page) : null, selected, fields, classic, css: classic ? String(css || '').slice(0, 8000) : null }),
      // JSON mode, format in the prompt: with the strict schema Gemini put
      // values in the wrong fields (a colour in "theme" instead of "css") or
      // looped. normalizeOps validates every operation anyway.
      temperature: 0.5,
      ...(advanced ? { model: config.gemini.advancedModel, maxOutputTokens: config.gemini.advancedMaxOutputTokens } : {}),
    }),
  );

  const rawOps = ((result.data && result.data.operations) || []).map((o) =>
    o ? { ...o, ...(o.html ? { html: urls.restore(o.html) } : {}), ...(o.css ? { css: urls.restore(o.css) } : {}) } : o,
  );
  const operations = normalizeOps(rawOps, page);
  // Asked for a picture on the selection but the model forgot to produce one:
  // add it, so "create an image of … here" always results in an image.
  const wantsImage =
    /\b(image|images|photo|photos|picture|pic|illustration|visual)\b/i.test(text) &&
    /\b(add|create|generate|attach|change|replace|put|insert|set|make|use|show)\b/i.test(text);
  const hasImageOp = operations.some((o) => o.op === 'set_image' || (o.html && /data-pb-image-prompt=/.test(o.html)));
  if (wantsImage && !hasImageOp && selected) {
    operations.push({ op: 'set_image', target: selectedId, prompt: imagePromptFrom(text), alt: '', placement: null, note: 'image from your request' });
  }
  const skipped = Math.max(0, rawOps.filter(Boolean).length - operations.length);
  const summary = String((result.data && result.data.summary) || '').slice(0, 1000);
  if (!operations.length) {
    return {
      summary: rawOps.length
        ? "I couldn't apply that change to this page. Try selecting the element you want to change, or describe it differently."
        : summary || 'I could not find anything to change for that request. Try selecting the element and being more specific.',
      operations: [],
      skipped,
    };
  }
  return { summary, operations, skipped };
}

module.exports = { modify, extractElement, outline, normalizeOps };
