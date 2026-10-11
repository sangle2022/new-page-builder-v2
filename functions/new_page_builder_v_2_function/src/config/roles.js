'use strict';

const config = require('./index');

// Application roles. Catalyst Authentication owns users and role assignment;
// this module only maps a Catalyst role name to one of these and decides what
// each one may do.
const ROLES = ['admin', 'marketing', 'editor', 'viewer'];

const P = {
  PAGE_VIEW: 'page.view',
  PAGE_CREATE: 'page.create',
  PAGE_EDIT: 'page.edit',
  PAGE_EDIT_ANY: 'page.edit_any',
  PAGE_DELETE: 'page.delete',
  PAGE_SUBMIT: 'page.submit',
  PAGE_APPROVE: 'page.approve',
  PAGE_PUBLISH: 'page.publish',
  PAGE_PUBLISH_DIRECT: 'page.publish_direct',
  LEAD_VIEW: 'lead.view',
  LEAD_UPDATE: 'lead.update',
  LEAD_EXPORT: 'lead.export',
  LEAD_DELETE: 'lead.delete',
  MEDIA_VIEW: 'media.view',
  MEDIA_UPLOAD: 'media.upload',
  MEDIA_DELETE: 'media.delete',
  AI_USE: 'ai.use',
  TEMPLATE_MANAGE: 'template.manage',
  CRM_MANAGE: 'crm.manage',
  SETTINGS_MANAGE: 'settings.manage',
  REPORTS_VIEW: 'reports.view',
};

const ALL = Object.values(P);

const MATRIX = {
  admin: ALL,
  marketing: ALL.filter(
    (p) => ![P.SETTINGS_MANAGE, P.CRM_MANAGE, P.PAGE_PUBLISH_DIRECT].includes(p),
  ),
  editor: [
    P.PAGE_VIEW, P.PAGE_CREATE, P.PAGE_EDIT, P.PAGE_SUBMIT, P.PAGE_PUBLISH,
    P.LEAD_VIEW, P.LEAD_UPDATE, P.LEAD_EXPORT,
    P.MEDIA_VIEW, P.MEDIA_UPLOAD, P.AI_USE, P.TEMPLATE_MANAGE, P.REPORTS_VIEW,
  ],
  viewer: [P.PAGE_VIEW, P.LEAD_VIEW, P.MEDIA_VIEW, P.REPORTS_VIEW],
};

// Labels shown in the "who can do what" matrix in the UI.
const PERMISSION_LABELS = {
  [P.PAGE_VIEW]: 'View pages',
  [P.PAGE_CREATE]: 'Create pages',
  [P.PAGE_EDIT]: 'Edit own pages',
  [P.PAGE_EDIT_ANY]: "Edit anyone's pages",
  [P.PAGE_DELETE]: 'Delete pages',
  [P.PAGE_SUBMIT]: 'Send for approval',
  [P.PAGE_APPROVE]: 'Approve or reject pages',
  [P.PAGE_PUBLISH]: 'Publish approved pages',
  [P.PAGE_PUBLISH_DIRECT]: 'Publish without approval',
  [P.LEAD_VIEW]: 'View leads',
  [P.LEAD_UPDATE]: 'Update lead status',
  [P.LEAD_EXPORT]: 'Export leads',
  [P.LEAD_DELETE]: 'Delete leads',
  [P.MEDIA_VIEW]: 'View image gallery',
  [P.MEDIA_UPLOAD]: 'Upload or generate images',
  [P.MEDIA_DELETE]: 'Delete images',
  [P.AI_USE]: 'Use AI',
  [P.TEMPLATE_MANAGE]: 'Save templates',
  [P.CRM_MANAGE]: 'Connect CRM and map fields',
  [P.SETTINGS_MANAGE]: 'Manage settings',
  [P.REPORTS_VIEW]: 'View reports',
};

function resolveAppRole(catalystRoleName) {
  const name = String(catalystRoleName || '').trim();
  if (config.roleMap && config.roleMap[name] && ROLES.includes(config.roleMap[name])) {
    return config.roleMap[name];
  }
  const lower = name.toLowerCase();
  if (lower === 'app administrator' || lower.includes('admin')) return 'admin';
  if (lower.includes('marketing') || lower.includes('approver')) return 'marketing';
  if (lower.includes('viewer') || lower.includes('read')) return 'viewer';
  return 'editor';
}

// Admins can change what the other roles may do (Settings → Team & roles).
// Their changes are stored in AppSettings and loaded by the auth middleware
// (see services/roleSettings.service.js); MATRIX stays the default. The
// admin role is never editable, so nobody can lock themselves out.
const EDITABLE_ROLES = ROLES.filter((r) => r !== 'admin');
let overrides = null;

function sanitizeMatrix(input) {
  const valid = new Set(ALL);
  const out = {};
  EDITABLE_ROLES.forEach((r) => {
    if (Array.isArray(input && input[r])) out[r] = [...new Set(input[r].filter((p) => valid.has(p)))];
  });
  return out;
}

const setOverrides = (matrix) => {
  overrides = matrix ? sanitizeMatrix(matrix) : null;
};

const effectiveMatrix = () => ({ ...MATRIX, ...(overrides || {}), admin: ALL });
const permissionsFor = (role) => effectiveMatrix()[role] || [];
const can = (role, permission) => permissionsFor(role).includes(permission);

module.exports = {
  ROLES,
  EDITABLE_ROLES,
  P,
  MATRIX,
  PERMISSION_LABELS,
  resolveAppRole,
  permissionsFor,
  can,
  setOverrides,
  sanitizeMatrix,
  effectiveMatrix,
};
