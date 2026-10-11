import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Me, LOGIN_URL } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null, app: null, error: null });

  const load = useCallback(async () => {
    try {
      const data = await Me.get();
      setState({ loading: false, user: data.user, app: data.app, labels: data.permissionLabels, error: null });
    } catch (e) {
      if (e.status === 401) {
        window.location.href = LOGIN_URL;
        return;
      }
      setState({ loading: false, user: null, app: null, error: e.message });
    }
  }, []);

  useEffect(() => {
    load();
    const onUnauthorized = () => {
      window.location.href = LOGIN_URL;
    };
    window.addEventListener('pb:unauthorized', onUnauthorized);
    return () => window.removeEventListener('pb:unauthorized', onUnauthorized);
  }, [load]);

  const value = useMemo(() => {
    const perms = new Set((state.user && state.user.permissions) || []);
    const can = (p) => (Array.isArray(p) ? p.some((x) => perms.has(x)) : perms.has(p));
    return { ...state, can, reload: load };
  }, [state, load]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export const PERM = {
  PAGE_VIEW: 'page.view',
  PAGE_CREATE: 'page.create',
  PAGE_EDIT: 'page.edit',
  PAGE_DELETE: 'page.delete',
  PAGE_SUBMIT: 'page.submit',
  PAGE_APPROVE: 'page.approve',
  PAGE_PUBLISH: 'page.publish',
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
