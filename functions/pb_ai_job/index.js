'use strict';

// Catalyst Job function: runs AI tasks queued by new_page_builder_v_2_function
// (services/ai/aiJobs.service.js) without the ~30 s request limit.
//
// ./src holds the AI-related modules of the main function (same paths and
// names, see ./src/README.md). When you change one of them in the main
// function, make the same change here.

// A job can run for minutes: allow Gemini more time than a web request, and
// let page generation use GEMINI_ADVANCED_MODEL (e.g. a Pro model).
process.env.GEMINI_TIMEOUT_MS = process.env.GEMINI_JOB_TIMEOUT_MS || '240000';
process.env.GEMINI_IMAGE_TIMEOUT_MS = process.env.GEMINI_JOB_TIMEOUT_MS || '240000';
process.env.PB_JOB_RUNTIME = '1';

const catalyst = require('zcatalyst-sdk-node');
const aiJobs = require('./src/services/ai/aiJobs.service');

/**
 * @param {import("./types/job").JobRequest} jobRequest
 * @param {import("./types/job").Context} context
 */
module.exports = async (jobRequest, context) => {
  const jobId = jobRequest.getJobParam('jobId');
  try {
    const capp = catalyst.initialize(context, { scope: 'admin' });
    const job = await aiJobs.run(capp, jobId);
    console.log(`[pb_ai_job] ${jobId} ${job.kind} -> ${job.status}`);
    context.closeWithSuccess();
  } catch (e) {
    console.error(`[pb_ai_job] ${jobId} crashed`, e);
    context.closeWithFailure();
  }
};
