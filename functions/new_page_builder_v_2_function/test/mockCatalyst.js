// In-memory mock of the zcatalyst-sdk-node APIs used by the function, for tests.
const tables = {};
const objects = {};
let seq = 100000000;
const now = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
const tbl = (n) => (tables[n] = tables[n] || []);

function whereToFn(where) {
  if (!where) return () => true;
  let js = where
    .replace(/(\w+) IS NULL/g, "(r.$1===undefined||r.$1===null||r.$1==='')")
    .replace(/(\w+) LIKE '([^']*)'/g, (m, c, v) => `String(r.${c}).startsWith('${v.replace('*', '')}')`)
    .replace(/(\w+) = (true|false)\b/g, (m, c, v) => `(String(r.${c})==='${v}')`)
    .replace(/(\w+) = '([^']*)'/g, (m, c, v) => `(String(r.${c})===${JSON.stringify(v)})`)
    .replace(/(\w+) = (-?\d+)/g, (m, c, v) => `(Number(r.${c})===${v})`)
    .replace(/(\w+) > '([^']*)'/g, (m, c, v) => `(String(r.${c})>${JSON.stringify(v)})`)
    .replace(/\bAND\b/g, '&&')
    .replace(/\bOR\b/g, '||');
  // eslint-disable-next-line no-new-func
  return new Function('r', `return ${js};`);
}

function exec(sql) {
  const m = sql.match(/^SELECT (.+?) FROM (\w+)(?: WHERE (.+?))?(?: ORDER BY (\w+) (ASC|DESC))?(?: LIMIT (\d+)(?: OFFSET (\d+))?)?$/);
  if (!m) throw new Error('mock zcql cannot parse: ' + sql);
  const [, cols, t, where, order, dir, limit, offset] = m;
  let rows = tbl(t).filter(whereToFn(where));
  if (order) rows = rows.slice().sort((a, b) => (String(a[order]) > String(b[order]) ? 1 : -1) * (dir === 'DESC' ? -1 : 1));
  if (cols.startsWith('COUNT')) return [{ [t]: { 'COUNT(ROWID)': rows.length } }];
  const o = Number(offset || 0);
  rows = rows.slice(o, limit ? o + Number(limit) : undefined);
  return rows.map((r) => ({ [t]: { ...r } }));
}

function table(name) {
  return {
    insertRow: async (row) => {
      const r = { ...row, ROWID: String(seq++), CREATEDTIME: now(), MODIFIEDTIME: now() };
      tbl(name).push(r);
      return { ...r };
    },
    insertRows: async (rows) => Promise.all(rows.map((r) => table(name).insertRow(r))),
    updateRow: async (row) => {
      const r = tbl(name).find((x) => x.ROWID === String(row.ROWID));
      if (!r) throw new Error('no row ' + row.ROWID);
      Object.assign(r, row, { MODIFIEDTIME: now() });
      return { ...r };
    },
    deleteRow: async (id) => {
      tables[name] = tbl(name).filter((x) => x.ROWID !== String(id));
      return true;
    },
    getAllColumns: async () => Object.keys(tbl(name)[0] || {}).map((c) => ({ column_name: c })),
  };
}

const { Readable } = require('stream');
function bucket(b) {
  return {
    putObject: async (k, buf) => { objects[`${b}/${k}`] = Buffer.from(buf); return true; },
    getObject: async (k) => { const v = objects[`${b}/${k}`]; if (!v) throw new Error('NoSuchKey'); return Readable.from([v]); },
    copyObject: async (f, t) => { objects[`${b}/${t}`] = objects[`${b}/${f}`]; return true; },
    deleteObject: async (k) => { delete objects[`${b}/${k}`]; return true; },
    deletePath: async () => true,
    object: (k) => ({ getDetails: async () => ({ object_url: `/stratus/${b}/${k}` }) }),
  };
}

const cacheStore = {};
function makeApp(user) {
  return {
    zcql: () => ({ executeZCQLQuery: async (sql) => exec(sql) }),
    datastore: () => ({ table }),
    stratus: () => ({ bucket }),
    cache: () => ({ segment: () => ({ put: async (k, v) => (cacheStore[k] = v), getValue: async (k) => cacheStore[k], delete: async (k) => delete cacheStore[k] }) }),
    userManagement: () => ({ getCurrentUser: async () => user, getAllUsers: async () => [user] }),
  };
}

module.exports = { tables, objects, makeApp };
