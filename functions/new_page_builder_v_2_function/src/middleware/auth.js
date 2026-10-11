'use strict';

const catalyst = require('zcatalyst-sdk-node');
const { resolveAppRole, permissionsFor, can } = require('../config/roles');
const { unauthorized, forbidden } = require('../utils/http');
const roleSettings = require('../services/roleSettings.service');

// Every request gets an admin-scoped Catalyst app on req.capp and a
// user-scoped one on req.userApp. Admin scope is used for data access only
// after the app-level permission check below has passed (or on public routes
// that validate their own input), because the role model lives in this app
// rather than in Catalyst table permissions.
function attachCatalyst(req, res, next) {
  try {
    req.capp = catalyst.initialize(req, { scope: 'admin' });
    req.userApp = catalyst.initialize(req);
  } catch (e) {
    return next(e);
  }
  return next();
}

async function loadUser(req) {
  if (req.user !== undefined) return req.user;
  let u = null;
  try {
    u = await req.userApp.userManagement().getCurrentUser();
  } catch {
    u = null;
  }
  if (!u || !u.user_id) {
    req.user = null;
    return null;
  }
  await roleSettings.ensureLoaded(req.capp);
  const catalystRole = (u.role_details && u.role_details.role_name) || '';
  const role = resolveAppRole(catalystRole);
  req.user = {
    id: String(u.user_id),
    email: u.email_id,
    firstName: u.first_name || '',
    lastName: u.last_name || '',
    name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email_id,
    orgId: u.org_id,
    catalystRole,
    role,
    permissions: permissionsFor(role),
  };
  return req.user;
}

const requireAuth = async (req, res, next) => {
  try {
    if (!(await loadUser(req))) throw unauthorized();
    return next();
  } catch (e) {
    return next(e);
  }
};

// requirePermission('page.publish') or requirePermission(['a', 'b']) (any of)
const requirePermission = (perm) => async (req, res, next) => {
  try {
    const user = await loadUser(req);
    if (!user) throw unauthorized();
    const perms = Array.isArray(perm) ? perm : [perm];
    if (!perms.some((p) => can(user.role, p))) throw forbidden();
    return next();
  } catch (e) {
    return next(e);
  }
};

module.exports = { attachCatalyst, requireAuth, requirePermission, loadUser };
