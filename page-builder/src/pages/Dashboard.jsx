import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Statistic, List, Tag, Alert, Empty, Skeleton, Button, Space, Typography, App } from 'antd';
import { FileTextOutlined, TeamOutlined, EyeOutlined, AuditOutlined, ThunderboltOutlined, AppstoreOutlined, FileAddOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Analytics } from '../api/client';
import { useAuth, PERM } from '../context/AuthContext';
import { BarTrend, HBars } from '../components/Charts';
import CreatePageModal from '../components/CreatePageModal';

dayjs.extend(relativeTime);

const LEVEL = { error: 'error', warning: 'warning', info: 'info' };

export default function Dashboard() {
  const { user, can, app } = useAuth();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [create, setCreate] = useState(null);

  useEffect(() => {
    Analytics.dashboard()
      .then(setData)
      .catch((e) => message.error(e.message));
  }, [message]);

  // tone: blue | indigo | mint | amber (Fristine palette)
  const kpi = (title, value, icon, suffix, onClick, tone = 'blue') => (
    <Card hoverable={!!onClick} onClick={onClick} className={`pb-kpi k-tone-${tone}`}>
      <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Statistic title={title} value={value} suffix={suffix} />
        <div className="k-icon-tile">{icon}</div>
      </Space>
    </Card>
  );

  const actions = [
    { mode: 'ai', icon: <ThunderboltOutlined />, title: 'Generate with AI', text: 'Describe it, get a complete page', disabled: !app.aiEnabled || !can(PERM.AI_USE) },
    { mode: 'template', icon: <AppstoreOutlined />, title: 'Start from a template', text: '30 ready-made layouts' },
    { mode: 'blank', icon: <FileAddOutlined />, title: 'Blank page', text: 'Build it block by block' },
  ];

  return (
    <div>
      <section className="k-hero">
        <div className="k-hero__copy">
          <span className="k-pill"><span className="k-dot" /> Kite · AI landing pages</span>
          <h1>Welcome back, {user.firstName || user.name}</h1>
          <p>Build, approve and publish landing pages, and see every lead by page and channel.</p>
        </div>
        {can(PERM.PAGE_CREATE) && (
          <div className="k-hero__actions">
            {actions.map((c) => (
              <button
                type="button"
                key={c.mode}
                className={`k-action k-action--${c.mode}`}
                disabled={c.disabled}
                onClick={() => !c.disabled && setCreate(c.mode)}
              >
                <span className="k-action__icon">{c.icon}</span>
                <span>
                  <span className="k-action__title">{c.title}</span>
                  <span className="k-action__text">{c.disabled ? 'AI is not available' : c.text}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {!data ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={12} lg={6}>{kpi('Live pages', `${data.kpis.livePages}`, <FileTextOutlined />, `/ ${data.kpis.pages}`, () => navigate('/pages'), 'blue')}</Col>
            <Col xs={12} lg={6}>{kpi('Leads this month', data.kpis.leadsThisMonth, <TeamOutlined />, data.kpis.leadsToday ? <span style={{ fontSize: 13, color: '#16A34A' }}>+{data.kpis.leadsToday} today</span> : null, can(PERM.LEAD_VIEW) ? () => navigate('/leads') : null, 'mint')}</Col>
            <Col xs={12} lg={6}>{kpi('Conversion', data.kpis.conversion, <EyeOutlined />, `% of ${data.kpis.views} views`, null, 'indigo')}</Col>
            <Col xs={12} lg={6}>{kpi('Waiting for approval', data.kpis.pendingApproval, <AuditOutlined />, null, () => navigate('/approvals'), 'amber')}</Col>
          </Row>

          {data.alerts.length > 0 && (
            <Card title="Needs attention" style={{ marginTop: 16 }} styles={{ body: { display: 'grid', gap: 8 } }}>
              {data.alerts.slice(0, 6).map((a, i) => (
                <Alert
                  key={i}
                  type={LEVEL[a.level]}
                  showIcon
                  message={a.text}
                  action={a.pageId ? <Button size="small" onClick={() => navigate(`/builder/${a.pageId}`)}>Open</Button> : a.text.includes('CRM') ? <Button size="small" onClick={() => navigate('/leads?crm=Failed')}>View</Button> : null}
                />
              ))}
            </Card>
          )}

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={16}>
              <Card title="Leads, last 30 days" extra={<span className="pb-muted">{data.kpis.leads} total · {data.kpis.partialLeads} unfinished</span>}>
                <BarTrend data={data.trend} />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Leads by channel" style={{ height: '100%' }}>
                {data.channels.length ? (
                  <HBars rows={data.channels.slice(0, 7)} labelKey="channel" valueKey="leads" extra={(r) => `${r.conversion}% conv.`} />
                ) : (
                  <Empty description="No leads yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={12}>
              <Card title="Top pages" extra={<Typography.Link onClick={() => navigate('/pages')}>All pages</Typography.Link>}>
                <List
                  dataSource={data.topPages}
                  locale={{ emptyText: 'No pages yet' }}
                  renderItem={(p) => (
                    <List.Item actions={[<span key="l"><b>{p.leads}</b> leads</span>, <span key="c" className="pb-muted">{p.conversion}%</span>]}>
                      <List.Item.Meta
                        title={<Typography.Link onClick={() => navigate(`/builder/${p.id}`)}>{p.name}</Typography.Link>}
                        description={<span>{p.isLive ? <Tag color="green">Live</Tag> : <Tag>Offline</Tag>} {p.views} views</span>}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Recent activity">
                <List
                  dataSource={[
                    ...data.recentLeads.map((l) => ({ key: `l${l.id}`, time: l.createdTime, text: <span><b>{l.name || 'New lead'}</b> from {l.pageName} <Tag>{l.channel}</Tag></span>, kind: 'lead' })),
                    ...data.activity.map((a) => ({ key: `a${a.id}`, time: a.time, text: <span><b>{a.actorName}</b> {a.action.toLowerCase()} <Typography.Link onClick={() => navigate(`/builder/${a.pageId}`)}>{a.pageName}</Typography.Link>{a.comment ? <Typography.Text type="secondary"> · "{a.comment}"</Typography.Text> : null}</span>, kind: 'workflow' })),
                  ]
                    .sort((a, b) => String(b.time).localeCompare(String(a.time)))
                    .slice(0, 10)}
                  locale={{ emptyText: 'Nothing yet' }}
                  renderItem={(i) => (
                    <List.Item>
                      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                        <div style={{ width: 8, height: 8, borderRadius: 99, marginTop: 7, background: i.kind === 'lead' ? '#16A34A' : '#004AAD', flex: '0 0 8px' }} />
                        <div style={{ flex: 1 }}>{i.text}</div>
                        <span className="pb-muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{dayjs(i.time).fromNow()}</span>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}
      <CreatePageModal open={!!create} initialMode={create} onClose={() => setCreate(null)} />
    </div>
  );
}
