'use strict';

const db = require('../utils/db');

// Key/value settings in the AppSettings table: CRM connection, reCAPTCHA keys.

const T = 'AppSettings';

async function get(capp, key, fallback = null) {
  const row = await db.selectOne(capp, T, `SettingKey = ${db.q(key)}`);
  return row ? row.SettingValue : fallback;
}

async function getJson(capp, key, fallback = null) {
  return db.parseJson(await get(capp, key), fallback);
}

async function set(capp, key, value) {
  const stored = typeof value === 'string' ? value : JSON.stringify(value);
  const row = await db.selectOne(capp, T, `SettingKey = ${db.q(key)}`);
  const table = db.table(capp, T);
  if (row) return table.updateRow({ ROWID: row.ROWID, SettingValue: stored });
  return table.insertRow({ SettingKey: key, SettingValue: stored });
}

async function remove(capp, key) {
  const row = await db.selectOne(capp, T, `SettingKey = ${db.q(key)}`);
  if (row) await db.table(capp, T).deleteRow(row.ROWID);
}

// ---- reCAPTCHA keys (AppSettings) ----
const CAPTCHA = { site: 'captcha.site_key', secret: 'captcha.secret_key' };

async function getCaptchaKeys(capp) {
  const [siteKey, secretKey] = await Promise.all([get(capp, CAPTCHA.site, ''), get(capp, CAPTCHA.secret, '')]);
  return siteKey || secretKey ? { siteKey, secretKey } : null;
}

async function setCaptchaKeys(capp, { siteKey, secretKey }) {
  await set(capp, CAPTCHA.site, siteKey || '');
  // Keep the stored secret when the client leaves it blank (it never sees it).
  if (secretKey) await set(capp, CAPTCHA.secret, secretKey);
}

module.exports = { get, getJson, set, remove, getCaptchaKeys, setCaptchaKeys };
