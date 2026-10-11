'use strict';

// Copy helpers: rewrite selected text, SEO metadata from page content, and
// turning a short image idea into a good image prompt.

const gemini = require('./gemini.client');
const aiLog = require('./aiLog.service');
const prompts = require('./prompts');
const schemas = require('./schemas');
const { textOf } = require('../../utils/html');
const { slugify } = require('../../utils/text');
const { badRequest } = require('../../utils/http');

async function rewrite(capp, user, { text, instruction, context, pageId }) {
  const t = String(text || '').trim();
  if (!t) throw badRequest('Select some text to rewrite');
  if (t.length > 5000) throw badRequest('Select less text (max 5000 characters)');
  const result = await aiLog.track(capp, user, { kind: 'content_rewrite', prompt: `${instruction || ''}: ${t}`, pageId }, () =>
    gemini.generateJson({
      system: prompts.REWRITE_SYSTEM,
      prompt: prompts.rewritePrompt({ text: t, instruction, context }),
      schema: schemas.REWRITE,
      temperature: 0.9,
    }),
  );
  const options = ((result.data && result.data.options) || []).map((o) => String(o).trim()).filter(Boolean).slice(0, 3);
  if (!options.length) throw badRequest('The AI could not rewrite this text. Try a different instruction.');
  return { options };
}

async function seo(capp, user, { html, name, pageId }) {
  const content = textOf(html, 12000);
  if (content.length < 40) throw badRequest('Add some content to the page first');
  const result = await aiLog.track(capp, user, { kind: 'content_seo', prompt: name || 'SEO', pageId }, () =>
    gemini.generateJson({
      system: prompts.SEO_SYSTEM,
      prompt: `Page name: ${name || ''}\nPage content:\n${content}`,
      schema: schemas.SEO,
      temperature: 0.5,
    }),
  );
  const d = result.data || {};
  return {
    title: String(d.title || '').slice(0, 70),
    description: String(d.description || '').slice(0, 170),
    slug: slugify(d.slug || name || ''),
    keywords: Array.isArray(d.keywords) ? d.keywords.slice(0, 10) : [],
    ogImagePrompt: d.ogImagePrompt || '',
  };
}

// Short idea ("doctor with patient") -> detailed prompt + tags + alt text.
async function enhanceImagePrompt(capp, user, { idea, context }) {
  const t = String(idea || '').trim();
  if (!t) throw badRequest('Describe the image');
  const result = await aiLog.track(capp, user, { kind: 'image_prompt', prompt: t }, () =>
    gemini.generateJson({
      system: prompts.IMAGE_PROMPT_SYSTEM,
      prompt: `${context ? `Landing page context: ${context}\n` : ''}Image idea: ${t}`,
      schema: schemas.IMAGE_PROMPT,
      temperature: 0.8,
    }),
  );
  const d = result.data || {};
  return {
    prompt: String(d.prompt || t).slice(0, 1500),
    tags: (Array.isArray(d.tags) ? d.tags : []).map((x) => String(x).toLowerCase().trim()).filter(Boolean).slice(0, 10),
    alt: String(d.alt || t).slice(0, 200),
  };
}

module.exports = { rewrite, seo, enhanceImagePrompt };
