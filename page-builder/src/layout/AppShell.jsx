import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Tag, Button, Badge, Grid } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  AuditOutlined,
  TeamOutlined,
  PictureOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useAuth, PERM } from '../context/AuthContext';
import { Pages } from '../api/client';
import CreatePageModal from '../components/CreatePageModal';
import { APP_NAME } from '../theme';

// Kite logo mark (from the Kite reference design).
export function KiteMark({ size = 30 }) {
  return (
    <span className="k-logo__mark" style={{ width: size, height: size, flexBasis: size }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2 4 12l8 10 8-10z" />
        <path d="M12 2v20" />
      </svg>
    </span>
  );
}

const { Sider, Header, Content } = Layout;

export default function AppShell() {
  const { user, can, app } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = Grid.useBreakpoint();
  const [collapsed, setCollapsed] = useState(false);
  const [pending, setPending] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (!can(PERM.PAGE_APPROVE)) return;
    Pages.approvals()
      .then((d) => setPending(d.pending.length))
      .catch(() => {});
  }, [location.pathname, can]);

  useEffect(() => {
    const open = () => setCreateOpen(true);
    window.addEventListener('pb:create-page', open);
    return () => window.removeEventListener('pb:create-page', open);
  }, []);

  const items = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    can(PERM.PAGE_VIEW) && { key: '/pages', icon: <FileTextOutlined />, label: 'All pages' },
    can(PERM.PAGE_VIEW) && {
      key: '/approvals',
      icon: <AuditOutlined />,
      label: (
        <span>
          Approvals {pending > 0 && <Badge count={pending} size="small" style={{ marginLeft: 6, boxShadow: 'none' }} />}
        </span>
      ),
    },
    can(PERM.LEAD_VIEW) && { key: '/leads', icon: <TeamOutlined />, label: 'Leads' },
    can(PERM.MEDIA_VIEW) && { key: '/gallery', icon: <PictureOutlined />, label: 'Image gallery' },
    can(PERM.PAGE_VIEW) && { key: '/templates', icon: <AppstoreOutlined />, label: 'Templates' },
    can(PERM.REPORTS_VIEW) && { key: '/reports', icon: <BarChartOutlined />, label: 'Reports' },
    { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
  ].filter(Boolean);

  const selected = items.map((i) => i.key).filter((k) => k !== '/' && location.pathname.startsWith(k))[0] || '/';
  const isMobile = !screens.md;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={248}
        collapsible
        collapsed={collapsed || isMobile}
        trigger={null}
        collapsedWidth={isMobile ? 0 : 72}
        style={{ position: 'sticky', top: 0, height: '100vh' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="k-logo" style={collapsed || isMobile ? { justifyContent: 'center', padding: 0 } : undefined}>
            <KiteMark />
            {!(collapsed || isMobile) && (
              <>
                <span className="k-logo__name">{APP_NAME}</span>
              </>
            )}
          </div>
          {!(collapsed || isMobile) && <div className="k-nav-label">Workspace</div>}
          <Menu theme="dark" mode="inline" selectedKeys={[selected]} items={items} onClick={(e) => navigate(e.key)} style={{ borderInlineEnd: 0, marginTop: collapsed ? 12 : 0 }} />
        </div>
      </Sider>
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
          <div style={{ flex: 1 }} />
          {!app.aiEnabled && <Tag color="orange">AI not configured</Tag>}
          {can(PERM.PAGE_CREATE) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              New page
            </Button>
          )}
          <Dropdown
            menu={{
              items: [
                { key: 'role', label: `Role: ${user.role}${user.catalystRole ? ` (${user.catalystRole})` : ''}`, disabled: true },
                { type: 'divider' },
                { key: 'logout', icon: <LogoutOutlined />, label: 'Sign out' },
              ],
              onClick: ({ key }) => {
                if (key === 'logout') window.location.href = '/__catalyst/auth/logout';
              },
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar style={{ background: 'var(--k-brand)', fontWeight: 600 }}>{(user.firstName || user.email || '?')[0].toUpperCase()}</Avatar>
              {screens.md && (
                <div style={{ lineHeight: 1.15 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{user.name}</div>
                  <div style={{ fontSize: 11.5, color: '#64748B', textTransform: 'capitalize' }}>{user.role}</div>
                </div>
              )}
            </div>
          </Dropdown>
        </Header>
        <Content style={{ padding: isMobile ? 14 : '28px 32px', maxWidth: 1440, width: '100%', margin: '0 auto' }}>
          <Outlet />
        </Content>
      </Layout>
      <CreatePageModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </Layout>
  );
}
