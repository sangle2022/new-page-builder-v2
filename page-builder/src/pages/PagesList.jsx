import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Table, Card, Input, Segmented, Space, Button, Dropdown, Tag, Row, Col, Tooltip, Typography, Empty, Switch, App } from 'antd';
import { EllipsisOutlined, AppstoreOutlined, BarsOutlined, EditOutlined, EyeOutlined, LinkOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { TABLE_PAGINATION } from '../utils/table';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Pages, FUNCTION_BASE } from '../api/client';
import { useAuth, PERM } from '../context/AuthContext';
import StatusTag from '../components/StatusTag';
import usePageActions from '../components/usePageActions';

dayjs.extend(relativeTime);

const FILTERS = ['All', 'Draft', 'Pending Approval', 'Approved', 'Rejected', 'Published', 'Unpublished', 'Live'];
const publicUrl = (slug) => `${window.location.origin}${FUNCTION_BASE}/p/${slug}`;

const CHANNEL_HINT = { ai: 'AI', template: 'Template', blank: 'Blank', clone: 'Copy', legacy: 'V1' };

export default function PagesList() {
  const { can, user } = useAuth();
  const { message } = App.useApp();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [mine, setMine] = useState(false);
  const [view, setView] = useState(() => {
    try {
      return localStorage.getItem('pb_pages_view') || 'list';
    } catch {
      return 'list';
    }
  });

  const load = useCallback(() => {
    setLoading(true);
    Pages.list()
      .then(setPages)
      .catch((e) => message.error(e.message))
      .finally(() => setLoading(false));
  }, [message]);

  useEffect(() => {
    load();
    window.addEventListener('pb:pages-changed', load);
    return () => window.removeEventListener('pb:pages-changed', load);
  }, [load]);

  const { menuItems, onMenu, handlers, elements } = usePageActions(load);

  const counts = useMemo(() => {
    const c = { All: pages.length, Live: pages.filter((p) => p.isLive).length };
    pages.forEach((p) => {
      c[p.status] = (c[p.status] || 0) + 1;
    });
    return c;
  }, [pages]);

  const visible = useMemo(() => {
    let list = pages;
    if (filter === 'Live') list = list.filter((p) => p.isLive);
    else if (filter !== 'All') list = list.filter((p) => p.status === filter);
    if (mine) list = list.filter((p) => p.ownerEmail === user.email);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((p) => `${p.name} ${p.slug} ${p.ownerName}`.toLowerCase().includes(s));
    }
    return list;
  }, [pages, filter, search, mine, user.email]);

  const setViewMode = (v) => {
    setView(v);
    try {
      localStorage.setItem('pb_pages_view', v);
    } catch {
      /* ignore */
    }
  };

  const approvalText = (p) => {
    if (p.status === 'Pending Approval') return <Tag color="gold">Waiting · {p.submittedBy}</Tag>;
    if (p.status === 'Rejected') return <Tooltip title={p.reviewComment}><Tag color="red">Rejected · {p.reviewedBy}</Tag></Tooltip>;
    if (p.approvedVersion > 0) return <Tooltip title={p.reviewComment || ''}><Tag color="cyan">v{p.approvedVersion} approved{p.reviewedBy ? ` · ${p.reviewedBy}` : ''}</Tag></Tooltip>;
    return <span className="pb-muted">Not submitted</span>;
  };

  const columns = [
    {
      title: 'Page',
      dataIndex: 'name',
      fixed: 'left',
      width: 260,
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name, p) => (
        <div>
          <Typography.Link onClick={() => (p.actions.edit ? handlers.edit(p) : handlers.preview(p))} style={{ fontWeight: 600 }}>{name}</Typography.Link>
          <div className="pb-muted" style={{ fontSize: 12 }}>
            /{p.slug} · <Tag bordered={false} style={{ fontSize: 11, marginInlineEnd: 0 }}>{CHANNEL_HINT[p.createdVia] || p.createdVia}</Tag>
          </div>
        </div>
      ),
    },
    { title: 'Status', dataIndex: 'status', width: 170, render: (s, p) => <StatusTag page={p} /> },
    { title: 'Approval', width: 200, render: (_, p) => approvalText(p) },
    {
      title: 'Published',
      width: 150,
      render: (_, p) =>
        p.isLive ? (
          <div>
            <Tag color="green">Live v{p.liveVersion}</Tag>
            <div className="pb-muted" style={{ fontSize: 11.5 }}>{p.publishedBy}{p.publishedTime ? ` · ${dayjs(p.publishedTime).format('DD MMM')}` : ''}</div>
          </div>
        ) : (
          <span className="pb-muted">No</span>
        ),
    },
    {
      title: 'URL',
      width: 90,
      render: (_, p) =>
        p.isLive ? (
          <Space size={2}>
            <Tooltip title="Open live page"><Button size="small" type="text" icon={<LinkOutlined />} onClick={() => window.open(publicUrl(p.slug), '_blank', 'noopener')} /></Tooltip>
            <Tooltip title="Share links & QR"><Button size="small" type="text" onClick={() => handlers.share(p)}>QR</Button></Tooltip>
          </Space>
        ) : (
          <span className="pb-muted">—</span>
        ),
    },
    {
      title: 'Leads',
      dataIndex: 'leads',
      width: 100,
      sorter: (a, b) => a.leads - b.leads,
      render: (n, p) => (p.actions.viewLeads ? <Typography.Link onClick={() => handlers.viewLeads(p)}><b>{n}</b></Typography.Link> : n),
    },
    {
      title: 'Channel',
      width: 140,
      render: (_, p) => {
        const entries = Object.entries(p.channels || {}).sort((a, b) => b[1] - a[1]);
        if (!entries.length) return <span className="pb-muted">—</span>;
        return (
          <Tooltip title={entries.map(([c, n]) => `${c}: ${n}`).join(' · ')}>
            <Tag color="blue" style={{ marginInlineEnd: 0 }}>{entries[0][0]}</Tag>
            {entries.length > 1 && <span className="pb-muted" style={{ fontSize: 12 }}> +{entries.length - 1}</span>}
          </Tooltip>
        );
      },
    },
    { title: 'Views', dataIndex: 'views', width: 100, sorter: (a, b) => a.views - b.views },
    { title: 'Conv.', dataIndex: 'conversion', width: 100, render: (c) => `${c}%`, sorter: (a, b) => a.conversion - b.conversion },
    { title: 'Created by', dataIndex: 'ownerName', width: 140, ellipsis: true },
    {
      title: 'Last modified',
      dataIndex: 'modifiedTime',
      width: 170,
      defaultSortOrder: 'descend',
      sorter: (a, b) => String(a.modifiedTime).localeCompare(String(b.modifiedTime)),
      render: (t, p) => (
        <Tooltip title={dayjs(t).format('DD MMM YYYY HH:mm')}>
          <div>{dayjs(t).fromNow()}</div>
          {p.lastModifiedBy && <div className="pb-muted" style={{ fontSize: 11.5 }}>{p.lastModifiedBy}</div>}
        </Tooltip>
      ),
    },
    {
      title: '',
      fixed: 'right',
      width: 110,
      render: (_, p) => (
        <Space size={2}>
          {p.actions.edit ? (
            <Tooltip title="Edit"><Button size="small" type="text" icon={<EditOutlined />} onClick={() => handlers.edit(p)} /></Tooltip>
          ) : (
            <Tooltip title="Preview"><Button size="small" type="text" icon={<EyeOutlined />} onClick={() => handlers.preview(p)} /></Tooltip>
          )}
          <Dropdown menu={{ items: menuItems(p), onClick: onMenu(p) }} trigger={['click']}>
            <Button size="small" type="text" icon={<EllipsisOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="pb-page-head">
        <div>
          <h1>All pages</h1>
          <p>Create, review, publish and track your landing pages.</p>
        </div>
        <Space wrap>
          <Input.Search placeholder="Search pages" allowClear onChange={(e) => setSearch(e.target.value)} style={{ width: 240 }} />
          <Tooltip title="Only pages I created"><Space size={6}><Switch size="small" checked={mine} onChange={setMine} /> Mine</Space></Tooltip>
          <Segmented value={view} onChange={setViewMode} options={[{ value: 'list', icon: <BarsOutlined /> }, { value: 'grid', icon: <AppstoreOutlined /> }]} />
          <Button icon={<ReloadOutlined />} onClick={load} />
        </Space>
      </div>

      <div style={{ overflowX: 'auto', marginBottom: 14 }}>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={FILTERS.map((f) => ({ value: f, label: `${f}${counts[f] ? ` (${counts[f]})` : ''}` }))}
        />
      </div>

      {view === 'list' ? (
        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            loading={loading}
            dataSource={visible}
            columns={columns}
            scroll={{ x: 1500 }}
            pagination={TABLE_PAGINATION}
            locale={{ emptyText: <Empty description="No pages here yet" /> }}
          />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {visible.map((p) => (
            <Col xs={24} sm={12} lg={8} xxl={6} key={p.id}>
              <Card
                className="pb-page-card"
                hoverable
                cover={
                  <div onClick={() => (p.actions.edit ? handlers.edit(p) : handlers.preview(p))}>
                    {p.thumbnailUrl ? <img src={p.thumbnailUrl} alt="" /> : <div className="pb-thumb-fallback" style={{ color: p.themeColor }}>{p.name.slice(0, 1).toUpperCase()}</div>}
                    <div className="pb-card-badges"><StatusTag page={p} /></div>
                  </div>
                }
                actions={[
                  <span key="l" onClick={() => p.actions.viewLeads && handlers.viewLeads(p)}><b>{p.leads}</b> leads</span>,
                  <span key="v"><b>{p.views}</b> views</span>,
                  <Dropdown key="m" menu={{ items: menuItems(p), onClick: onMenu(p) }} trigger={['click']}>
                    <EllipsisOutlined />
                  </Dropdown>,
                ]}
              >
                <Card.Meta
                  title={p.name}
                  description={
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {p.ownerName} · {dayjs(p.modifiedTime).fromNow()}
                    </Typography.Text>
                  }
                />
              </Card>
            </Col>
          ))}
          {!loading && !visible.length && (
            <Col span={24}>
              <Empty description="No pages here yet">
                {can(PERM.PAGE_CREATE) && <Button type="primary" onClick={() => window.dispatchEvent(new CustomEvent('pb:create-page'))}>Create a page</Button>}
              </Empty>
            </Col>
          )}
        </Row>
      )}
      {elements}
    </div>
  );
}
