import axios from 'axios';

// All API calls go to the Catalyst function. The path is relative to the
// app domain, so it works on the Catalyst-hosted client and in `catalyst serve`.
export const FUNCTION_BASE = process.env.REACT_APP_FUNCTION_BASE || '/server/new_page_builder_v_2_function';
export const API_BASE = `${FUNCTION_BASE}/api`;
export const LOGIN_URL = process.env.REACT_APP_LOGIN_URL || '/__catalyst/auth/login';

const http = axios.create({ baseURL: API_BASE, timeout: 180000, withCredentials: true });

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response && err.response.status;
    const data = (err.response && err.response.data) || {};
    const timedOut = status === 408 || status === 504;
    const fallback = timedOut
      ? 'The request took too long and was stopped by the server. Try again, or select a smaller part of the page.'
      : status
        ? `Request failed (${status})`
        : 'Network error. Check your connection.';
    const e = new Error(data.message || fallback);
    e.status = status;
    e.details = data.details;
    if (status === 401 && !window.location.hash.includes('/signed-out')) {
      window.dispatchEvent(new CustomEvent('pb:unauthorized'));
    }
    return Promise.reject(e);
  },
);

const unwrap = (p) => p.then((r) => r.data.data);
const unwrapFull = (p) => p.then((r) => r.data);

export const api = {
  get: (url, params) => unwrap(http.get(url, { params })),
  post: (url, body) => unwrap(http.post(url, body)),
  put: (url, body) => unwrap(http.put(url, body)),
  patch: (url, body) => unwrap(http.patch(url, body)),
  del: (url) => unwrap(http.delete(url)),
  upload: (url, formData, onProgress) =>
    unwrapFull(
      http.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => onProgress && e.total && onProgress(Math.round((e.loaded / e.total) * 100)),
      }),
    ),
  download: async (url, params, filename) => {
    const res = await http.get(url, { params, responseType: 'blob' });
    const href = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  },
};

// ---- endpoints ----
export const Pages = {
  list: (params) => api.get('/pages', params),
  get: (id) => api.get(`/pages/${id}`),
  create: (body) => api.post('/pages', body),
  update: (id, body) => api.patch(`/pages/${id}`, body),
  remove: (id) => api.del(`/pages/${id}`),
  duplicate: (id, body) => api.post(`/pages/${id}/duplicate`, body || {}),
  document: (id) => api.get(`/pages/${id}/document`),
  save: (id, body) => api.put(`/pages/${id}/document`, body),
  versions: (id) => api.get(`/pages/${id}/versions`),
  restore: (id, n) => api.post(`/pages/${id}/versions/${n}/restore`),
  history: (id) => api.get(`/pages/${id}/history`),
  share: (id) => api.get(`/pages/${id}/share`),
  slugAvailable: (slug, exceptId) => api.get('/pages/slug-available', { slug, exceptId }),
  mapping: (id) => api.get(`/pages/${id}/mapping`),
  saveMapping: (id, body) => api.put(`/pages/${id}/mapping`, body),
  saveAsTemplate: (id, body) => api.post(`/pages/${id}/template`, body),
  previewUrl: (id, version) => `${API_BASE}/pages/${id}/preview${version ? `?version=${version}` : ''}`,
  action: (id, action, body) => api.post(`/pages/${id}/${action}`, body || {}),
  approvals: () => api.get('/approvals'),
};

export const Leads = {
  list: (params) => api.get('/leads', params),
  meta: () => api.get('/leads/meta'),
  get: (id) => api.get(`/leads/${id}`),
  update: (id, body) => api.patch(`/leads/${id}`, body),
  remove: (id) => api.del(`/leads/${id}`),
  retryCrm: (id) => api.post(`/leads/${id}/crm-sync`),
  channels: (params) => api.get('/leads/channels', params),
  exportCsv: (params) => api.download('/leads/export', params, `leads-${new Date().toISOString().slice(0, 10)}.csv`),
};

export const Media = {
  list: (params) => api.get('/media', params),
  stats: () => api.get('/media/stats'),
  upload: (files, { tags, description } = {}, onProgress) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    if (tags) fd.append('tags', tags);
    if (description) fd.append('description', description);
    return api.upload('/media', fd, onProgress);
  },
  update: (id, body) => api.patch(`/media/${id}`, body),
  remove: (id) => api.del(`/media/${id}`),
  markUsed: (ids) => api.post('/media/used', { ids }),
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Runs an AI task. With background jobs enabled on the server (AI_JOBPOOL)
// the task is queued and polled, so it is not cut off by the ~30 s request
// limit; otherwise the result comes back directly.
async function runAiTask(kind, payload, { timeoutMs = 6 * 60 * 1000, onWaiting } = {}) {
  const start = await api.post('/ai/jobs', { kind, payload });
  if (start.status === 'done') return start.result;
  const started = Date.now();
  let delay = 1200;
  while (Date.now() - started < timeoutMs) {
    // eslint-disable-next-line no-await-in-loop
    await sleep(delay);
    delay = Math.min(delay + 300, 3000);
    // eslint-disable-next-line no-await-in-loop
    const job = await api.get(`/ai/jobs/${start.jobId}`);
    if (job.status === 'done') return job.result;
    if (job.status === 'failed') {
      const e = new Error(job.error || 'The AI task failed');
      e.status = job.errorStatus;
      throw e;
    }
    if (onWaiting) onWaiting(job.status, Date.now() - started);
  }
  throw new Error('The AI task is taking unusually long. Please try again.');
}

export const AI = {
  status: () => api.get('/ai/status'),
  run: runAiTask,
  generatePage: (body, opts) => runAiTask('page_generate', body, opts),
  modifyPage: (body, opts) => runAiTask('page_modify', body, opts),
  rewrite: (body) => runAiTask('content_rewrite', body),
  seo: (body) => runAiTask('content_seo', body),
  imagePrompt: (body) => api.post('/ai/images/prompt', body),
  suggestImages: (prompt) => api.post('/ai/images/suggest', { prompt }),
  generateImage: (body, opts) => runAiTask('image_generate', body, opts),
  usage: (days) => api.get('/ai/usage', { days }),
};

export const Templates = {
  list: () => api.get('/templates'),
  blocks: () => api.get('/templates/blocks'),
  get: (key) => api.get(`/templates/${key}`),
  remove: (id) => api.del(`/templates/${id}`),
};

export const CRM = {
  status: () => api.get('/crm/status'),
  connect: () => api.get('/crm/connect'),
  disconnect: () => api.post('/crm/disconnect'),
  layouts: () => api.get('/crm/layouts'),
  fields: (layoutId) => api.get('/crm/fields', { layoutId }),
  sources: () => api.get('/crm/sources'),
};

export const Analytics = {
  dashboard: () => api.get('/analytics/dashboard'),
  reports: (params) => api.get('/analytics/reports', params),
};

export const Admin = {
  setupCheck: () => api.get('/admin/setup-check'),
  users: () => api.get('/admin/users'),
  roles: () => api.get('/admin/roles'),
  saveRoles: (matrix) => api.put('/admin/roles', { matrix }),
  resetRoles: () => api.del('/admin/roles'),
  captcha: () => api.get('/admin/captcha'),
  saveCaptcha: (body) => api.put('/admin/captcha', body),
  pincodes: (search) => api.get('/admin/pincodes', { search }),
  savePincode: (body) => (body.id ? api.put(`/admin/pincodes/${body.id}`, body) : api.post('/admin/pincodes', body)),
  importPincodes: (rows) => api.post('/admin/pincodes/import', { rows }),
  deletePincode: (id) => api.del(`/admin/pincodes/${id}`),
};

export const Me = { get: () => api.get('/me') };
