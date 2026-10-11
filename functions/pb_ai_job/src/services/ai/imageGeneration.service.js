'use strict';

// AI image generation with gallery reuse:
//   prompt -> embedding -> similar image in gallery?  -> reuse it (no cost)
//                                         otherwise  -> Gemini image model
//                                                    -> media bucket + Media row
// Every generated image is saved with its prompt, normalised prompt, tags and
// embedding, so later requests can find and reuse it.

const config = require('../../config');
const gemini = require('./gemini.client');
const aiLog = require('./aiLog.service');
const reuse = require('./imageReuse.service');
const media = require('../media.service');
const { imageGenerationPrompt } = require('./prompts');
const { promptTokens } = require('../../utils/text');
const { badRequest } = require('../../utils/http');

// "1200x900" -> nearest supported aspect ratio
function aspectFromSize(size) {
  const m = String(size || '').match(/^(\d+)x(\d+)$/);
  if (!m) return null;
  const r = Number(m[1]) / Number(m[2]);
  const options = { '1:1': 1, '4:3': 4 / 3, '3:2': 1.5, '16:9': 16 / 9, '21:9': 21 / 9, '3:4': 0.75, '2:3': 2 / 3, '9:16': 9 / 16, '4:5': 0.8, '5:4': 1.25 };
  return Object.keys(options).sort((a, b) => Math.abs(options[a] - r) - Math.abs(options[b] - r))[0];
}

// Search the gallery only (used by the builder before offering "Generate").
async function suggest(capp, prompt) {
  const p = String(prompt || '').trim();
  if (!p) throw badRequest('Describe the image');
  const embedding = await gemini.embed(p);
  return reuse.findSimilar(capp, p, { embedding });
}

async function generate(capp, user, { prompt, aspectRatio, size, pageId, reuseExisting = true, tags, alt }) {
  const p = String(prompt || '').trim();
  if (p.length < 3) throw badRequest('Describe the image you need');
  if (p.length > 2000) throw badRequest('Keep the image description under 2000 characters');
  gemini.assertConfigured();

  const ratio = gemini.ASPECTS.includes(aspectRatio) ? aspectRatio : aspectFromSize(size) || '16:9';
  const embedding = await gemini.embed(p);

  if (reuseExisting) {
    const match = await reuse.findSimilar(capp, p, { embedding });
    if (match.best) {
      await media.markUsed(capp, [match.best.id]);
      await aiLog.record(capp, user, {
        kind: 'image_reuse',
        prompt: p,
        pageId,
        model: 'gallery',
        resultRef: match.best.id,
        latencyMs: 0,
      });
      return { reused: true, image: match.best, alternatives: match.candidates.filter((c) => c.id !== match.best.id) };
    }
  }

  const result = await aiLog.track(capp, user, { kind: 'image_generate', prompt: p, pageId }, async () => {
    const img = await gemini.generateImage({ prompt: imageGenerationPrompt(p), aspectRatio: ratio });
    const saved = await media.saveGenerated(capp, user, {
      buffer: img.buffer,
      mimeType: img.mimeType,
      prompt: p,
      tags: Array.isArray(tags) && tags.length ? tags : promptTokens(p).slice(0, 8),
      alt,
      aspectRatio: ratio,
      model: img.model || config.gemini.imageModel,
      embedding,
    });
    return { ...img, saved, resultRef: saved.id };
  });

  return { reused: false, image: result.saved, alternatives: [] };
}

module.exports = { generate, suggest, aspectFromSize };
