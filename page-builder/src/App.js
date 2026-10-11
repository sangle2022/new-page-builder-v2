import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { useAuth, PERM } from './context/AuthContext';
import AppShell from './layout/AppShell';
import VersionBanner from './components/VersionBanner';
import Dashboard from './pages/Dashboard';
import PagesList from './pages/PagesList';

const Builder = lazy(() => import('./builder/Builder'));
const Approvals = lazy(() => import('./pages/Approvals'));
const Leads = lazy(() => import('./pages/Leads'));
const Gallery = lazy(() => import('./pages/Gallery'));
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));

const Loading = () => (
  <div style={{ height: '60vh', display: 'grid', placeItems: 'center' }}>
    <Spin size="large" />
  </div>
);

function Guard({ perm, children }) {
  const { can } = useAuth();
  if (perm && !can(perm)) {
    return <Result status="403" title="No access" subTitle="Your role does not include this area. Ask an admin if you need it." />;
  }
  return children;
}

export default function App() {
  const { loading, user, error, reload } = useAuth();
  if (loading) return <Loading />;
  if (!user) {
    return (
      <Result
        status="warning"
        title="Could not load your account"
        subTitle={error || 'Please sign in again.'}
        extra={<Button type="primary" onClick={reload}>Try again</Button>}
      />
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <VersionBanner />
      <Routes>
        <Route path="/builder/:id" element={<Guard perm={PERM.PAGE_VIEW}><Builder /></Guard>} />
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="/pages" element={<Guard perm={PERM.PAGE_VIEW}><PagesList /></Guard>} />
          <Route path="/approvals" element={<Guard perm={PERM.PAGE_VIEW}><Approvals /></Guard>} />
          <Route path="/leads" element={<Guard perm={PERM.LEAD_VIEW}><Leads /></Guard>} />
          <Route path="/gallery" element={<Guard perm={PERM.MEDIA_VIEW}><Gallery /></Guard>} />
          <Route path="/templates" element={<Guard perm={PERM.PAGE_VIEW}><TemplatesPage /></Guard>} />
          <Route path="/reports" element={<Guard perm={PERM.REPORTS_VIEW}><Reports /></Guard>} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
