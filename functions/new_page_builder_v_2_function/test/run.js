// Runs the test suites against an in-memory mock of Catalyst (Data Store,
// ZCQL, Stratus, Cache, users) and a stubbed Gemini client. No cloud access
// or credentials needed:  npm test
//
//   api.test.js     page lifecycle, approval workflow, publishing, lead
//                   capture (multi-step, OTP, channel/UTM), leads, dashboard
//   ai.test.js      AI page generation, targeted modification, image reuse
//   legacy.test.js  V1 pages: serving, form conversion, first-save upgrade

const { spawnSync } = require('child_process');
const path = require('path');

let failed = 0;
['api.test.js', 'ai.test.js', 'legacy.test.js'].forEach((file) => {
  console.log(`\n# ${file}`);
  const r = spawnSync(process.execPath, [path.join(__dirname, file)], { stdio: 'inherit', env: { ...process.env, GEMINI_API_KEY: '' } });
  if (r.status !== 0) failed += 1;
});
console.log(failed ? `\n${failed} suite(s) failed` : '\nall suites passed');
process.exit(failed ? 1 : 0);
