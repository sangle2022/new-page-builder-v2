'use strict';

const fs = require('fs');
const path = require('path');

// Load a local .env during development (catalyst serve). Deployed functions
// get their values from Catalyst environment variables instead. Values that
// are already set in process.env always win.
(function loadDotEnv() {
  const file = path.join(__dirname, '..', '..', '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m || line.trim().startsWith('#')) continue;
    const value = m[2].replace(/^["']|["']$/g, '');
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
})();

const env = (key, fallback = '') => {
  const v = process.env[key];
  return v === undefined || v === '' ? fallback : v;
};
const bool = (key, fallback) => {
  const v = env(key, '');
  if (v === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
};

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

const functionName = env('FUNCTION_NAME', 'new_page_builder_v_2_function');

module.exports = {
  functionName,
  // Absolute path prefix under which this function is reachable from the
  // web client domain. Used to build URLs embedded in published HTML.
  functionBase: `/server/${functionName}`,

  // Where the React client is hosted (Catalyst web client hosting serves it
  // under /app). Classic V1 blocks load Bootstrap/Tailwind from here.
  // Accepts "/app", "/app/" or "/app/index.html".
  clientBase: env('CLIENT_BASE', '/app').replace(/\/index\.html$/i, '').replace(/\/+$/, '') || '/app',

  buckets: {
    pages: env('PAGES_BUCKET', 'pb-v2-pages'),
    media: env('MEDIA_BUCKET', 'pb-v2-media'),
  },

  workflow: {
    requireApproval: bool('REQUIRE_APPROVAL', true),
  },

  roleMap: parseJson(env('ROLE_MAP'), null),

  signingSecret: env('APP_SIGNING_SECRET', 'change-me-in-catalyst-env'),

  gemini: {
    apiKey: env('GEMINI_API_KEY'),
    baseUrl: env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),
    // Fast model: AI edits, rewrites, SEO, and page generation when no
    // background job is running.
    textModel: env('GEMINI_TEXT_MODEL', 'gemini-2.5-flash'),
    // Higher-quality (slower) model for full page generation. Used only inside
    // the pb_ai_job background job, where the 30 s limit does not apply.
    advancedModel: env('GEMINI_ADVANCED_MODEL', ''),
    imageModel: env('GEMINI_IMAGE_MODEL', 'gemini-3.1-flash-image'),
    embedModel: env('GEMINI_EMBED_MODEL', 'gemini-embedding-001'),
    embedDimensions: Number(env('GEMINI_EMBED_DIMENSIONS', '256')),
    // Stay under Catalyst's ~30 s request limit so users get a clear message
    // instead of a gateway 408.
    timeoutMs: Number(env('GEMINI_TIMEOUT_MS', '25000')),
    imageTimeoutMs: Number(env('GEMINI_IMAGE_TIMEOUT_MS', '27000')),
    // 0 = no "thinking" on Flash models (much faster); -1 = model default
    thinkingBudget: Number(env('GEMINI_THINKING_BUDGET', '0')),
    maxOutputTokens: Number(env('GEMINI_MAX_OUTPUT_TOKENS', '16384')),
    // Pro models always "think", and thinking counts toward the output limit.
    advancedMaxOutputTokens: Number(env('GEMINI_ADVANCED_MAX_OUTPUT_TOKENS', '32768')),
    // Cosine similarity at or above which an existing gallery image is reused.
    reuseThreshold: Number(env('IMAGE_REUSE_THRESHOLD', '0.86')),
    // Same, for the token-overlap fallback when no embeddings are available.
    reuseJaccardThreshold: Number(env('IMAGE_REUSE_JACCARD', '0.6')),
  },

  // Background AI jobs (Catalyst Job Scheduling). Set AI_JOBPOOL to the name
  // of a Function job pool to run AI work in the pb_ai_job job function,
  // which is not bound by the ~30 s request limit. Empty = run inline.
  aiJobs: {
    pool: env('AI_JOBPOOL'),
    functionName: env('AI_JOB_FUNCTION', 'pb_ai_job'),
  },

  crm: {
    clientId: env('CRM_CLIENT_ID'),
    clientSecret: env('CRM_CLIENT_SECRET'),
    redirectUri: env('CRM_REDIRECT_URI'),
    accountsUrl: env('CRM_ACCOUNTS_URL', 'https://accounts.zoho.com'),
    scopes: env('CRM_SCOPES', 'ZohoCRM.modules.ALL,ZohoCRM.settings.ALL'),
    module: env('CRM_MODULE', 'Leads'),
    leadSource: env('CRM_LEAD_SOURCE', 'Landing Pages'),
    syncTimeoutMs: Number(env('CRM_SYNC_TIMEOUT_MS', '6000')),
  },

  otp: {
    provider: env('OTP_PROVIDER', 'dummy'),
    dummyCode: env('OTP_DUMMY_CODE', '123456'),
    karix: {
      accessKey: env('KARIX_ACCESS_KEY'),
      departmentId: env('KARIX_DEPARTMENT_ID'),
      ipAddress: env('KARIX_IP_ADDRESS'),
      baseUrl: env('KARIX_BASE_URL', 'https://auth.instaalerts.zone/otpauthapi'),
      countryCode: env('KARIX_COUNTRY_CODE', '91'),
    },
  },

  metaPixelId: env('META_PIXEL_ID'),
};
