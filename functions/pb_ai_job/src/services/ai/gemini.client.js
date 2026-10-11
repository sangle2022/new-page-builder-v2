'use strict';

// Minimal Gemini REST client (Generative Language API). The only module that
// talks to Google; the AI services above it deal with prompts and results.
// The API key comes from the GEMINI_API_KEY environment variable.

const axios = require('axios');
const config = require('../../config');
const { ApiError } = require('../../utils/http');

const g = config.gemini;

const isConfigured = () => !!g.apiKey;

function assertConfigured() {
  if (!isConfigured()) throw new ApiError(503, 'AI is not configured. Set GEMINI_API_KEY in the function environment variables.');
}

async function call(model, method, body, timeout = g.timeoutMs) {
  assertConfigured();
  try {
    const { data } = await axios.post(`${g.baseUrl}/models/${encodeURIComponent(model)}:${method}`, body, {
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': g.apiKey },
      timeout,
      maxBodyLength: 50 * 1024 * 1024,
      maxContentLength: 50 * 1024 * 1024,
    });
    return data;
  } catch (e) {
    const status = e.response && e.response.status;
    const msg = (e.response && e.response.data && e.response.data.error && e.response.data.error.message) || e.message;
    if (status === 429) throw new ApiError(429, 'The AI service is busy (rate limit). Please try again in a minute.');
    if (e.code === 'ECONNABORTED') throw new ApiError(504, 'The AI service took too long to respond. Try a shorter request.');
    throw new ApiError(502, `AI request failed: ${msg}`);
  }
}

function usageOf(data) {
  const u = (data && data.usageMetadata) || {};
  return { inputTokens: u.promptTokenCount || 0, outputTokens: u.candidatesTokenCount || 0 };
}

function textOf(data) {
  const cand = data && data.candidates && data.candidates[0];
  if (!cand) {
    const reason = data && data.promptFeedback && data.promptFeedback.blockReason;
    throw new ApiError(422, reason ? `The request was blocked by AI safety filters (${reason}). Please rephrase.` : 'The AI returned no answer');
  }
  if (cand.finishReason === 'SAFETY') throw new ApiError(422, 'The AI declined this request for safety reasons. Please rephrase.');
  return ((cand.content && cand.content.parts) || []).map((p) => p.text || '').join('');
}

function parseJsonLoose(text) {
  try {
    return JSON.parse(text);
  } catch {
    const m = String(text).match(/```(?:json)?\s*([\s\S]*?)```/) || String(text).match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (m) {
      try {
        return JSON.parse(m[1]);
      } catch {
        // fall through
      }
    }
    throw new ApiError(502, 'The AI returned an unreadable answer. Please try again.');
  }
}

// Gemini 2.5 "thinking" adds many seconds per request. Catalyst ends a
// function call after about 30 s (the 408 users saw), so thinking is off by
// default for Flash models; set GEMINI_THINKING_BUDGET to re-enable it.
// Pro models cannot disable thinking, so they are left alone.
function thinking(model) {
  if (g.thinkingBudget < 0) return {};
  // Gemini 3+ uses a thinking level instead of a token budget.
  if (/gemini-([3-9]|\d\d)/i.test(model)) return { thinkingConfig: { thinkingLevel: 'low' } };
  if (/flash/i.test(model)) return { thinkingConfig: { thinkingBudget: g.thinkingBudget } };
  return {};
}

// Structured output: the model must answer with JSON matching `schema`
// (OpenAPI-style schema, see services/ai/schemas.js).
async function generateJson({ system, prompt, schema, temperature = 0.7, model = g.textModel, timeout, maxOutputTokens = g.maxOutputTokens }) {
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      // A cap stops a model that starts repeating itself inside the JSON
      // from running until the request times out.
      maxOutputTokens,
      responseMimeType: 'application/json',
      ...(schema ? { responseSchema: schema } : {}),
      ...thinking(model),
    },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  const data = await call(model, 'generateContent', body, timeout);
  return { data: parseJsonLoose(textOf(data)), usage: usageOf(data), model };
}

async function generateText({ system, prompt, temperature = 0.8, model = g.textModel }) {
  const body = { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature, ...thinking(model) } };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  const data = await call(model, 'generateContent', body);
  return { text: textOf(data).trim(), usage: usageOf(data), model };
}

const ASPECTS = ['1:1', '3:2', '2:3', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];

// Returns { buffer, mimeType }.
async function generateImage({ prompt, aspectRatio = '16:9', model = g.imageModel }) {
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: { aspectRatio: ASPECTS.includes(aspectRatio) ? aspectRatio : '16:9' },
    },
  };
  const data = await call(model, 'generateContent', body, g.imageTimeoutMs);
  const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
  const img = parts.find((p) => p.inlineData || p.inline_data);
  if (!img) {
    const text = parts.map((p) => p.text || '').join(' ').trim();
    throw new ApiError(422, text ? `No image was produced: ${text.slice(0, 200)}` : 'No image was produced. Try describing the scene differently.');
  }
  const inline = img.inlineData || img.inline_data;
  return { buffer: Buffer.from(inline.data, 'base64'), mimeType: inline.mimeType || inline.mime_type || 'image/png', usage: usageOf(data), model };
}

// Text embedding for semantic image reuse/search. Returns null on failure so
// callers can fall back to keyword matching.
async function embed(text, taskType = 'SEMANTIC_SIMILARITY') {
  if (!isConfigured() || !text) return null;
  try {
    const data = await call(
      g.embedModel,
      'embedContent',
      { content: { parts: [{ text: String(text).slice(0, 2000) }] }, taskType, outputDimensionality: g.embedDimensions },
      20000,
    );
    const values = data && data.embedding && data.embedding.values;
    return Array.isArray(values) ? values.map((v) => Math.round(v * 10000) / 10000) : null;
  } catch (e) {
    console.warn('[gemini] embedding failed', e.message);
    return null;
  }
}

module.exports = { isConfigured, assertConfigured, generateJson, generateText, generateImage, embed, ASPECTS };
