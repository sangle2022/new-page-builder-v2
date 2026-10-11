const path = require('path');
const FN = path.join(__dirname, '..');
process.env.APP_SIGNING_SECRET = 'test-secret-test-secret-123456';
process.env.GEMINI_API_KEY = '';
const mock = require('./mockCatalyst');
const USERS = {
  alice: { user_id: 1, email_id: 'alice@x.com', first_name: 'Alice', last_name: 'M', role_details: { role_name: 'Marketing' } },
  bob: { user_id: 2, email_id: 'bob@x.com', first_name: 'Bob', last_name: 'M', role_details: { role_name: 'Marketing' } },
  boss: { user_id: 4, email_id: 'boss@x.com', first_name: 'Boss', last_name: 'A', role_details: { role_name: 'App Administrator' } },
  viewer: { user_id: 5, email_id: 'v@x.com', first_name: 'Vee', last_name: 'V', role_details: { role_name: 'Viewer' } },
  ed: { user_id: 3, email_id: 'ed@x.com', first_name: 'Ed', last_name: 'E', role_details: { role_name: 'Editor' } },
};
const sdkPath = require.resolve('zcatalyst-sdk-node', { paths: [FN] });
require.cache[sdkPath] = { id: sdkPath, filename: sdkPath, loaded: true, exports: { initialize: (req) => mock.makeApp(USERS[req.headers['x-user']] || null) } };
const app = require(path.join(FN, 'src/app'));
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}`;
const call = async (method, url, body, user = 'alice') => {
  const r = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', 'x-user': user }, body: body ? JSON.stringify(body) : undefined });
  const ct = r.headers.get('content-type') || '';
  const data = ct.includes('json') ? await r.json() : await r.text();
  return { status: r.status, data };
};
const assert = (c, m) => {
  if (!c) {
    console.error('FAIL:', m);
    process.exitCode = 1;
  } else console.log('ok -', m);
};

(async () => {
  try {
    let r = await call('GET', '/api/me');
    assert(r.status === 200 && r.data.data.user.role, `me role=${r.data.data && r.data.data.user.role}`);
    r = await call('GET', '/api/me', null, 'nobody');
    assert(r.status === 401, 'unauthenticated -> 401');

    r = await call('GET', '/api/templates');
    assert(r.data.data.templates.length >= 10, 'templates listed: ' + r.data.data.templates.length);
    r = await call('GET', '/api/templates/blocks');
    assert(r.data.data.length > 15, 'blocks: ' + r.data.data.length);

    r = await call('POST', '/api/pages', { mode: 'template', templateKey: 'lead-generation', name: 'Loan offer' }, 'ed');
    assert(r.status === 201, 'create from template ' + r.status + ' ' + JSON.stringify(r.data).slice(0, 200));
    const page = r.data.data;
    r = await call('GET', `/api/pages/${page.id}/document`, null, 'ed');
    const doc = r.data.data;
    assert(doc.html.includes('data-pb-form'), 'document has form');
    assert(doc.page.formConfig.length > 0, 'formConfig derived: ' + doc.page.formConfig.map((f) => f.name + ':' + f.step + (f.otp ? ':otp' : '')).join(','));

    r = await call('PUT', `/api/pages/${page.id}/document`, { project: { pages: [] }, html: doc.html, css: doc.css }, 'ed');
    assert(r.status === 200, 'save draft');

    r = await call('POST', `/api/pages/${page.id}/publish`, {}, 'ed');
    assert(r.status === 409, 'editor cannot publish without approval -> ' + r.status);

    r = await call('POST', `/api/pages/${page.id}/submit`, { note: 'please review' }, 'ed');
    assert(r.data.data && r.data.data.status === 'Pending Approval', 'submitted');
    r = await call('PUT', `/api/pages/${page.id}/document`, { html: doc.html }, 'ed');
    assert(r.status === 409, 'cannot edit while pending');

    r = await call('POST', `/api/pages/${page.id}/reject`, {}, 'alice');
    assert(r.status === 400, 'reject needs comment');
    r = await call('POST', `/api/pages/${page.id}/approve`, { comment: 'looks good' }, 'alice');
    assert(r.data.data && r.data.data.status === 'Approved' && r.data.data.approvedVersion === 1, 'approved v1');

    r = await call('POST', `/api/pages/${page.id}/publish`, {}, 'ed');
    assert(r.data.data && r.data.data.isLive && r.data.data.status === 'Published', 'published by owner');

    r = await fetch(`${base}/p/${page.slug}?ch=whatsapp&utm_campaign=diwali`).then((x) => x.text());
    assert(r.includes('window.__PB') && r.includes('data-pb-form') && r.includes('pb-base'), 'public page rendered');
    r = await fetch(`${base}/api/public/runtime.js`).then((x) => x.text());
    assert(r.includes('initForm'), 'runtime served');
    r = await fetch(`${base}/p/does-not-exist`);
    assert(r.status === 404, 'unknown slug 404');

    await call('POST', `/api/public/pages/${page.id}/view`, { tracking: { ch: 'whatsapp' } }, 'nobody');

    const fc = doc.page.formConfig;
    const otpField = fc.find((f) => f.otp);
    const step1 = fc.filter((f) => f.step === 1);
    const fill = (f) =>
      f.type === 'email' ? 'a@b.com' : f.type === 'tel' ? '9876543210' : f.type === 'pincode' ? '411045' : f.type === 'consent' ? 'yes' : f.options.length ? f.options[0] : f.type === 'number' ? '50000' : 'Test User';
    const fields1 = Object.fromEntries(step1.map((f) => [f.name, fill(f)]));
    const tracking = { ch: 'whatsapp', utm_source: 'whatsapp', utm_campaign: 'diwali', landingUrl: 'x' };

    let otpTokens;
    r = await call('POST', `/api/public/pages/${page.id}/leads`, { fields: fields1, step: 1, partial: true, tracking }, 'nobody');
    if (otpField) {
      assert(r.status === 400 && r.data.details && r.data.details.otp, 'otp required: ' + r.data.message);
      await call('POST', '/api/public/otp/send', { phone: '9876543210' }, 'nobody');
      r = await call('POST', '/api/public/otp/verify', { phone: '9876543210', code: '123456' }, 'nobody');
      otpTokens = { [otpField.name]: r.data.data.otpToken };
      r = await call('POST', `/api/public/pages/${page.id}/leads`, { fields: fields1, step: 1, partial: true, tracking, otpTokens }, 'nobody');
    }
    assert(r.status === 200 && r.data.data.leadToken, 'partial step saved ' + JSON.stringify(r.data).slice(0, 200));
    const { leadToken } = r.data.data;
    const all = Object.fromEntries(fc.map((f) => [f.name, fill(f)]));
    r = await call('POST', `/api/public/pages/${page.id}/leads`, { fields: all, step: 2, partial: false, leadToken, tracking, otpTokens }, 'nobody');
    assert(r.status === 200 && !r.data.data.partial, 'final submit ' + JSON.stringify(r.data).slice(0, 200));

    r = await call('GET', `/api/leads?pageId=${page.id}`);
    const lead = r.data.data.items[0];
    assert(
      r.data.data.items.length === 1 && lead.channel === 'WhatsApp' && lead.utm.campaign === 'diwali' && !lead.isPartial && lead.pageName === 'Loan offer',
      `lead mapped: ${lead && lead.channel} crm=${lead && lead.crmSync}`,
    );
    r = await call('PATCH', `/api/leads/${lead.id}`, { status: 'Contacted', note: 'called' });
    assert(r.data.data.status === 'Contacted' && r.data.data.activity.length >= 3, 'lead status + timeline ' + r.data.data.activity.length);
    r = await call('GET', '/api/leads/export');
    assert(typeof r.data === 'string' && r.data.includes('WhatsApp'), 'csv export');

    r = await call('GET', '/api/analytics/dashboard');
    assert(r.data.data.kpis.leads === 1 && r.data.data.kpis.views === 1, 'dashboard kpis ' + JSON.stringify(r.data.data.kpis));
    r = await call('GET', '/api/pages', null, 'ed');
    const listed = r.data.data.find((p) => p.id === page.id);
    assert(listed.leads === 1 && listed.actions.unpublish && !listed.actions.approve, 'list with actions');

    r = await call('PUT', `/api/pages/${page.id}/document`, { html: doc.html.replace('</form>', '</form><p>NEW TEXT</p>') }, 'ed');
    assert(r.data.data.statusChanged && r.data.data.page.status === 'Draft' && r.data.data.page.isLive, 'edit live -> draft, still live');
    r = await fetch(`${base}/p/${page.slug}`).then((x) => x.text());
    assert(!r.includes('NEW TEXT'), 'live version unchanged');

    r = await call('POST', `/api/pages/${page.id}/duplicate`, {}, 'ed');
    assert(r.status === 201 && r.data.data.slug !== page.slug, 'duplicate');
    r = await call('GET', `/api/pages/${page.id}/share`, null, 'ed');
    assert(r.data.data.channels.length === 8, 'share links');
    r = await call('GET', `/api/pages/${page.id}/preview`, null, 'ed');
    assert(String(r.data).includes('NEW TEXT') && String(r.data).includes('Preview'), 'preview shows draft');

    r = await call('POST', `/api/pages/${page.id}/unpublish`, {}, 'ed');
    assert(r.data.data && !r.data.data.isLive, 'unpublished');
    // marketing publishes their own page without a second approval
    r = await call('POST', '/api/pages', { mode: 'template', templateKey: 'lead-generation', name: 'Alice own page' }, 'alice');
    const own = r.data.data;
    assert(own.actions.publish, 'marketing owner sees Publish on own draft');
    r = await call('POST', `/api/pages/${own.id}/publish`, {}, 'alice');
    assert(r.status === 200 && r.data.data.isLive && r.data.data.status === 'Published', 'marketing publishes own page directly');
    r = await call('POST', '/api/pages', { mode: 'template', templateKey: 'lead-generation', name: 'Ed second page' }, 'ed');
    const edPage = r.data.data;
    assert(!edPage.actions.publish, 'editor page: no direct publish for owner');
    r = await call('POST', `/api/pages/${edPage.id}/publish`, {}, 'alice');
    assert(r.status === 409, 'marketing cannot publish editor page before approval -> ' + r.status);
    r = await call('GET', '/api/admin/setup-check', null, 'ed');
    assert(r.status === 403, 'editor cannot see setup');
    // admin edits role permissions
    r = await call('PUT', '/api/admin/roles', { matrix: { viewer: ['page.view'] } }, 'alice');
    assert(r.status === 403, 'marketing cannot edit role permissions');
    r = await call('GET', '/api/leads/export', null, 'viewer');
    assert(r.status === 403, 'viewer cannot export leads by default');
    r = await call('GET', '/api/admin/roles', null, 'boss');
    const viewerPerms = r.data.data.matrix.viewer.filter((p) => p !== 'lead.view');
    r = await call('PUT', '/api/admin/roles', { matrix: { viewer: viewerPerms, admin: [] } }, 'boss');
    assert(r.status === 200 && r.data.data.matrix.admin.length > 10, 'admin saved matrix; admin role stays full');
    r = await call('GET', '/api/leads', null, 'viewer');
    assert(r.status === 403, 'viewer lost lead access immediately');
    r = await call('GET', '/api/me', null, 'viewer');
    assert(!r.data.data.user.permissions.includes('lead.view'), '/me reflects edited permissions');
    r = await call('DELETE', '/api/admin/roles', null, 'boss');
    r = await call('GET', '/api/leads', null, 'viewer');
    assert(r.status === 200, 'reset restores defaults');
    r = await call('POST', '/api/ai/pages/generate', { prompt: 'a landing page for a dental clinic' });
    assert(r.status === 503, 'AI not configured -> 503: ' + r.data.message);
    r = await call('GET', '/api/public/placeholder.svg?w=400&h=300&t=Hero', null, 'nobody');
    assert(String(r.data).includes('<svg'), 'placeholder svg');
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    server.close();
  }
})();
