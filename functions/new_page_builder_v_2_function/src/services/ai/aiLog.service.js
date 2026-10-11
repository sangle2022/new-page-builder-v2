'use strict';

// Records every AI call in AIGenerations (usage reporting, cost tracking,
// debugging). Logging never breaks the feature that called it.

const db = require('../../utils/db');

async function record(capp, user, { kind, prompt, pageId, model, status = 'success', latencyMs, usage, error, resultRef }) {
  try {
    await db.table(capp, 'AIGenerations').insertRow({
      Kind: kind,
      Prompt: String(prompt || '').slice(0, 4000),
      PageId: pageId ? String(pageId) : '',
      Model: model || '',
      Status: status,
      LatencyMs: Math.round(latencyMs || 0),
      InputTokens: (usage && usage.inputTokens) || 0,
      OutputTokens: (usage && usage.outputTokens) || 0,
      ErrorMessage: error ? String(error).slice(0, 1000) : '',
      ResultRef: resultRef ? String(resultRef).slice(0, 500) : '',
      CreatedByName: user ? user.name : '',
    });
  } catch (e) {
    console.warn('[ai-log] could not record', e.message);
  }
}

// Wrap an AI call: measures latency and logs success or failure.
async function track(capp, user, meta, fn) {
  const started = Date.now();
  try {
    const result = await fn();
    await record(capp, user, {
      ...meta,
      model: result && result.model,
      usage: result && result.usage,
      latencyMs: Date.now() - started,
      resultRef: result && result.resultRef,
    });
    return result;
  } catch (e) {
    await record(capp, user, { ...meta, status: e.status === 422 ? 'blocked' : 'failed', latencyMs: Date.now() - started, error: e.message });
    throw e;
  }
}

async function usageSummary(capp, { days = 30 } = {}) {
  const since = db.catalystDate(new Date(Date.now() - days * 864e5));
  const rows = await db.selectAll(capp, 'AIGenerations', `CREATEDTIME > ${db.q(since)}`, 'ORDER BY CREATEDTIME DESC', 5000);
  const byKind = {};
  rows.forEach((r) => {
    const k = r.Kind || 'other';
    byKind[k] = byKind[k] || { kind: k, total: 0, failed: 0, inputTokens: 0, outputTokens: 0 };
    byKind[k].total += 1;
    if (r.Status !== 'success') byKind[k].failed += 1;
    byKind[k].inputTokens += Number(r.InputTokens || 0);
    byKind[k].outputTokens += Number(r.OutputTokens || 0);
  });
  return {
    days,
    total: rows.length,
    byKind: Object.values(byKind),
    recent: rows.slice(0, 20).map((r) => ({
      kind: r.Kind,
      prompt: String(r.Prompt || '').slice(0, 160),
      status: r.Status,
      by: r.CreatedByName,
      latencyMs: Number(r.LatencyMs || 0),
      time: r.CREATEDTIME,
    })),
  };
}

module.exports = { record, track, usageSummary };
