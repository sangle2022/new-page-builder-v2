'use strict';

// Thin helpers around the Catalyst Datastore / ZCQL.
//
// ZCQL has no parameter binding, so every value interpolated into a query
// MUST go through q() (strings) or num() (numbers). V1 interpolated raw
// request values, which allowed injection. ZCQL's quote escaping is not
// documented reliably, so q() drops quote and backslash characters instead
// of trying to escape them. Values we filter on (ids, slugs, emails, enums)
// never legitimately contain them.

function q(value) {
  if (value === null || value === undefined) return 'null';
  return `'${String(value).replace(/['\\]/g, '').slice(0, 500)}'`;
}

function num(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`Invalid numeric value: ${value}`);
  return String(Math.trunc(n));
}

// Catalyst ROWIDs are long digit strings; validate before use.
const isRowId = (v) => /^\d{5,25}$/.test(String(v || ''));

async function query(capp, sql) {
  const rows = await capp.zcql().executeZCQLQuery(sql);
  return rows || [];
}

// SELECT * FROM <table> ... returns plain row objects.
async function select(capp, tableName, where = '', tail = '') {
  const sql = `SELECT * FROM ${tableName}${where ? ` WHERE ${where}` : ''}${tail ? ` ${tail}` : ''}`;
  const rows = await query(capp, sql);
  return rows.map((r) => r[tableName]);
}

async function selectOne(capp, tableName, where) {
  const rows = await select(capp, tableName, where, 'LIMIT 1');
  return rows[0] || null;
}

async function count(capp, tableName, where = '') {
  const rows = await query(capp, `SELECT COUNT(ROWID) FROM ${tableName}${where ? ` WHERE ${where}` : ''}`);
  const first = rows[0] && rows[0][tableName];
  return first ? Number(first['COUNT(ROWID)'] || 0) : 0;
}

// Fetch every row matching a condition by paging. ZCQL caps one SELECT at
// 300 rows.
async function selectAll(capp, tableName, where = '', order = 'ORDER BY CREATEDTIME DESC', max = 5000) {
  const out = [];
  const size = 300;
  for (let offset = 0; offset < max; offset += size) {
    const rows = await select(capp, tableName, where, `${order} LIMIT ${size} OFFSET ${offset}`);
    out.push(...rows);
    if (rows.length < size) break;
  }
  return out;
}

const table = (capp, name) => capp.datastore().table(name);

// Catalyst datetime columns expect "YYYY-MM-DD HH:mm:ss".
function catalystDate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function parseJson(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

const toBool = (v) => v === true || v === 'true' || v === 1 || v === '1';

module.exports = { q, num, isRowId, query, select, selectOne, selectAll, count, table, catalystDate, parseJson, toBool };
