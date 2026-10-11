// V1 compatibility: a page created by the old builder (HTML only + stepformdata).
const path = require('path');
const FN = path.join(__dirname, '..');
process.env.APP_SIGNING_SECRET = 'test-secret-test-secret-123456';
const mock = require('./mockCatalyst');
const USER = { user_id: 1, email_id: 'alice@x.com', first_name: 'Alice', last_name: 'M', role_details: { role_name: 'App Administrator' } };
const sdkPath = require.resolve('zcatalyst-sdk-node', { paths: [FN] });
require.cache[sdkPath] = { id: sdkPath, filename: sdkPath, loaded: true, exports: { initialize: (req) => mock.makeApp(req.headers['x-anon'] ? null : USER) } };
const app = require(path.join(FN, 'src/app'));
const assert = (c, m) => {
  if (!c) {
    console.error('FAIL:', m);
    process.exitCode = 1;
  } else console.log('ok -', m);
};

(async () => {
  const capp = mock.makeApp(USER);
  // V1 row: Status Published, no IsLive/ProjectFileID, HTML in FileID.
  const v1html = '<!DOCTYPE html><html><head><style>.hero{color:red}</style></head><body><div class="container hero"><h1>Old V1 page</h1><div class="col dynamic-form"></div></div></body></html>';
  await capp.stratus().bucket('pb-v2-pages').putObject('legacy/old.html', Buffer.from(v1html));
  const row = await capp.datastore().table('Pages').insertRow({
    PageName: 'Old campaign',
    pageSlug: 'old-campaign',
    pageTitle: 'Old campaign',
    Status: 'Published',
    FileID: 'legacy/old.html',
    stepformdata: JSON.stringify([
      { name: 'Name', type: 'text', required: 'yes', step: 1, otpValidation: 'no' },
      { name: 'Phone', type: 'phone', required: 'yes', step: 1 },
      { name: 'Loan type', type: 'dropdown', options: ['Home', 'Car'], step: 2 },
      { name: 'captcha', type: 'captcha' },
    ]),
  });

  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    let html = await fetch(`${base}/p/old-campaign`).then((r) => r.text());
    assert(html.includes('Old V1 page') && html.includes('data-pb-form') && html.includes('bootstrap.min.css'), 'V1 page served live with injected V2 form + classic CSS');
    assert(/dynamic-form"><form/.test(html), 'form placed in the V1 .dynamic-form placeholder');

    const r = await fetch(`${base}/api/public/pages/${row.ROWID}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { name: 'Ravi', phone: '9876543210', loan_type: 'Home' }, tracking: { ch: 'qr', tag: 'pune' } }),
    }).then((x) => x.json());
    assert(r.success, 'lead accepted on V1 page: ' + JSON.stringify(r).slice(0, 120));

    const doc = await fetch(`${base}/api/pages/${row.ROWID}/document`).then((x) => x.json());
    assert(doc.data.page.isLegacy && doc.data.html.includes('data-pb-form') && doc.data.css.includes('.hero'), 'V1 page opens in builder with form + styles');

    const saved = await fetch(`${base}/api/pages/${row.ROWID}/document`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: { pages: [{}] }, html: doc.data.html, css: doc.data.css }),
    }).then((x) => x.json());
    assert(saved.data.page.status === 'Draft' && saved.data.page.isLive && !saved.data.page.isLegacy, 'first save converts to V2; live V1 keeps serving');
    html = await fetch(`${base}/p/old-campaign`).then((x) => x.text());
    assert(html.includes('Old V1 page'), 'still live after conversion');

    const list = await fetch(`${base}/api/pages`).then((x) => x.json());
    const p = list.data.find((x) => x.id === row.ROWID);
    assert(p.channels['QR Code'] === 1, 'page list shows channel breakdown: ' + JSON.stringify(p.channels));
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    server.close();
  }
})();
