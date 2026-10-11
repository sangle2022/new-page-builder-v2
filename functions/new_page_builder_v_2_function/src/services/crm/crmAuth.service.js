'use strict';

// Zoho CRM OAuth for a Server-based Application (api-console.zoho.com).
// Token handling lives here only; business logic asks for getAccessToken().
//
//   1. Admin clicks "Connect" -> authorizeUrl() -> Zoho consent screen
//   2. Zoho redirects to CRM_REDIRECT_URI with ?code&accounts-server&state
//   3. handleCallback() exchanges the code; the refresh token is stored in the
//      AppSettings table (never in code), the access token in Catalyst cache.

const axios = require('axios');
const config = require('../../config');
const settings = require('../settings.service');
const { sign, verify } = require('../../utils/sign');
const { badRequest } = require('../../utils/http');

const K = {
  refresh: 'crm.refresh_token',
  apiDomain: 'crm.api_domain',
  accounts: 'crm.accounts_url',
  connectedBy: 'crm.connected_by',
  connectedAt: 'crm.connected_at',
};
const CACHE_KEY = 'pb_v2_crm_access_token';

const isConfigured = () => !!(config.crm.clientId && config.crm.clientSecret && config.crm.redirectUri);

function authorizeUrl(user) {
  if (!isConfigured()) throw badRequest('CRM is not configured. Set CRM_CLIENT_ID, CRM_CLIENT_SECRET and CRM_REDIRECT_URI.');
  const state = sign({ t: 'crm', uid: user.id }, 15 * 60);
  const params = new URLSearchParams({
    scope: config.crm.scopes,
    client_id: config.crm.clientId,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    redirect_uri: config.crm.redirectUri,
    state,
  });
  return `${config.crm.accountsUrl}/oauth/v2/auth?${params.toString()}`;
}

function cache(capp) {
  return capp.cache().segment();
}

async function cacheToken(capp, token, expiresInSec = 3600) {
  try {
    // Catalyst cache expiry is in hours; tokens live 1h, so keep one hour.
    await cache(capp).put(CACHE_KEY, JSON.stringify({ token, exp: Date.now() + (expiresInSec - 120) * 1000 }), 1);
  } catch (e) {
    console.warn('[crm] could not cache token', e.message);
  }
}

async function handleCallback(capp, user, { code, state, accountsServer }) {
  const payload = verify(state);
  if (!payload || payload.t !== 'crm') throw badRequest('The CRM connection request expired. Please try again.');
  if (!code) throw badRequest('Zoho did not return an authorization code');

  // Zoho multi-DC: the callback tells us which accounts server issued the code.
  const accounts = accountsServer && /^https:\/\/accounts\.zoho\.[a-z.]+$/.test(accountsServer) ? accountsServer : config.crm.accountsUrl;
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.crm.clientId,
    client_secret: config.crm.clientSecret,
    redirect_uri: config.crm.redirectUri,
    code,
  });
  const { data } = await axios.post(`${accounts}/oauth/v2/token`, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15000,
  });
  if (data.error || !data.refresh_token) {
    throw badRequest(`Zoho refused the connection: ${data.error || 'no refresh token returned'}`);
  }
  await settings.set(capp, K.refresh, data.refresh_token);
  await settings.set(capp, K.apiDomain, data.api_domain || 'https://www.zohoapis.com');
  await settings.set(capp, K.accounts, accounts);
  await settings.set(capp, K.connectedBy, user.name);
  await settings.set(capp, K.connectedAt, new Date().toISOString());
  await cacheToken(capp, data.access_token, data.expires_in);
  return true;
}

async function refreshAccessToken(capp) {
  const refresh = await settings.get(capp, K.refresh);
  if (!refresh) return null;
  const accounts = (await settings.get(capp, K.accounts)) || config.crm.accountsUrl;
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: config.crm.clientId,
    client_secret: config.crm.clientSecret,
    refresh_token: refresh,
  });
  const { data } = await axios.post(`${accounts}/oauth/v2/token`, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15000,
  });
  if (!data.access_token) {
    console.error('[crm] refresh failed', data.error);
    return null;
  }
  await cacheToken(capp, data.access_token, data.expires_in);
  return data.access_token;
}

async function getAccessToken(capp, { forceRefresh = false } = {}) {
  if (!forceRefresh) {
    try {
      const raw = await cache(capp).getValue(CACHE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && parsed.token && parsed.exp > Date.now()) return parsed.token;
    } catch {
      // cache miss or unreadable value: refresh below
    }
  }
  return refreshAccessToken(capp);
}

async function apiDomain(capp) {
  return (await settings.get(capp, K.apiDomain)) || 'https://www.zohoapis.com';
}

async function status(capp) {
  const refresh = await settings.get(capp, K.refresh);
  return {
    configured: isConfigured(),
    connected: !!refresh,
    apiDomain: refresh ? await apiDomain(capp) : null,
    connectedBy: refresh ? await settings.get(capp, K.connectedBy) : null,
    connectedAt: refresh ? await settings.get(capp, K.connectedAt) : null,
    redirectUri: config.crm.redirectUri || null,
  };
}

async function disconnect(capp) {
  const refresh = await settings.get(capp, K.refresh);
  const accounts = (await settings.get(capp, K.accounts)) || config.crm.accountsUrl;
  if (refresh) {
    try {
      await axios.post(`${accounts}/oauth/v2/token/revoke?token=${encodeURIComponent(refresh)}`, null, { timeout: 10000 });
    } catch (e) {
      console.warn('[crm] revoke failed', e.message);
    }
  }
  await Promise.all(Object.values(K).map((k) => settings.remove(capp, k)));
  try {
    await cache(capp).delete(CACHE_KEY);
  } catch {
    // nothing cached
  }
}

module.exports = { isConfigured, authorizeUrl, handleCallback, getAccessToken, apiDomain, status, disconnect };
