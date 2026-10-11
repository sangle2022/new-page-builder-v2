'use strict';

// Role permissions edited by admins, stored in AppSettings ("roles.matrix").
// Loaded once per minute per function instance; saving refreshes it at once.

const settings = require('./settings.service');
const roles = require('../config/roles');

const KEY = 'roles.matrix';
const TTL_MS = 60 * 1000;
let loadedAt = 0;

async function ensureLoaded(capp, { force = false } = {}) {
  if (!force && Date.now() - loadedAt < TTL_MS) return;
  try {
    roles.setOverrides(await settings.getJson(capp, KEY, null));
    loadedAt = Date.now();
  } catch (e) {
    // Table missing or unreachable: keep the current (default) permissions.
    console.warn('[roles] could not load role permissions', e.message);
  }
}

async function save(capp, matrix) {
  const clean = roles.sanitizeMatrix(matrix);
  await settings.set(capp, KEY, clean);
  roles.setOverrides(clean);
  loadedAt = Date.now();
  return roles.effectiveMatrix();
}

async function reset(capp) {
  await settings.remove(capp, KEY);
  roles.setOverrides(null);
  loadedAt = Date.now();
  return roles.effectiveMatrix();
}

module.exports = { ensureLoaded, save, reset };
