'use strict';

// Long-running AI work without the ~30 s Advanced I/O limit.
//
// With AI_JOBPOOL set, an AI request is saved to Stratus and handed to the
// `pb_ai_job` job function through Catalyst Job Scheduling (job functions may
// run for minutes). The browser polls GET /api/ai/jobs/:id for the result.
// Without AI_JOBPOOL the work runs inline, as before.
//
//   ai-jobs/<id>.json  { id, kind, status: queued|running|done|failed, user, payload, result, error }

const crypto = require('crypto');
const config = require('../../config');
const storage = require('../storage.service');
const pageGeneration = require('./pageGeneration.service');
const pageModification = require('./pageModification.service');
const content = require('./contentGeneration.service');
const images = require('./imageGeneration.service');
const { badRequest, notFound } = require('../../utils/http');

const KINDS = {
  page_generate: (capp, user, p) => pageGeneration.generate(capp, user, p),
  page_modify: (capp, user, p) => pageModification.modify(capp, user, p),
  image_generate: (capp, user, p) => images.generate(capp, user, p),
  content_seo: (capp, user, p) => content.seo(capp, user, p),
  content_rewrite: (capp, user, p) => content.rewrite(capp, user, p),
};

const key = (id) => `ai-jobs/${id}.json`;
const isJobId = (id) => /^[a-f0-9]{24}$/.test(String(id || ''));
const jobsEnabled = () => !!config.aiJobs.pool;

async function start(capp, user, kind, payload = {}) {
  if (!KINDS[kind]) throw badRequest('Unknown AI task');
  if (!jobsEnabled()) {
    return { status: 'done', result: await KINDS[kind](capp, user, payload) };
  }
  const id = crypto.randomBytes(12).toString('hex');
  const job = {
    id,
    kind,
    status: 'queued',
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    payload,
    createdAt: new Date().toISOString(),
  };
  await storage.putJson(capp, key(id), job);
  try {
    await capp.jobScheduling().job().submitJob({
      job_name: `pb_ai_${id}`,
      jobpool_name: config.aiJobs.pool,
      target_type: 'Function',
      target_name: config.aiJobs.functionName,
      params: { jobId: id },
    });
  } catch (e) {
    // Job pool missing or misconfigured: do the work inline instead of failing.
    console.error('[ai-jobs] submit failed, running inline:', e.message);
    await storage.removeQuietly(capp, key(id));
    return { status: 'done', result: await KINDS[kind](capp, user, payload) };
  }
  return { status: 'queued', jobId: id };
}

async function get(capp, user, id) {
  if (!isJobId(id)) throw notFound('AI task not found');
  const job = await storage.getJson(capp, key(id)).catch(() => null);
  if (!job || job.user.id !== user.id) throw notFound('AI task not found');
  return { jobId: id, kind: job.kind, status: job.status, result: job.result || null, error: job.error || null, errorStatus: job.errorStatus || null };
}

// Called by the pb_ai_job job function.
async function run(capp, id) {
  if (!isJobId(id)) throw new Error(`invalid job id ${id}`);
  const job = await storage.getJson(capp, key(id));
  if (!job) throw new Error(`job ${id} not found`);
  if (job.status === 'done' || job.status === 'failed') return job;
  await storage.putJson(capp, key(id), { ...job, status: 'running', startedAt: new Date().toISOString() });
  try {
    const result = await KINDS[job.kind](capp, job.user, job.payload || {});
    // The payload (often a whole page) is no longer needed.
    const done = { ...job, payload: undefined, status: 'done', result, finishedAt: new Date().toISOString() };
    await storage.putJson(capp, key(id), done);
    return done;
  } catch (e) {
    const failed = { ...job, payload: undefined, status: 'failed', error: e.message, errorStatus: e.status || 500, finishedAt: new Date().toISOString() };
    await storage.putJson(capp, key(id), failed);
    return failed;
  }
}

module.exports = { start, get, run, jobsEnabled, KINDS };
