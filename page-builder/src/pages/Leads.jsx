import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Card, Table, Select, Input, DatePicker, Space, Button, Tag, Drawer, Descriptions, Timeline, Row, Col, Statistic,
  Segmented, Tooltip, Popconfirm, App, Typography, Empty,
} from 'antd';
import { DownloadOutlined, ReloadOutlined, SyncOutlined, LinkOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Leads as LeadsApi, Pages } from '../api/client';
import { TABLE_PAGINATION } from '../utils/table';
import { useAuth, PERM } from '../context/AuthContext';
import { LEAD_STATUS_COLORS, CRM_COLORS } from '../theme';

const { RangePicker } = DatePicker;

function LeadDrawer({ id, onClose, onChanged }) {
  const { can } = useAuth();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLead(null);
    LeadsApi.get(id).then(setLead).catch((e) => message.error(e.message));
  }, [id, message]);

  const update = async (body) => {
    setBusy(true);
    try {
      setLead(await LeadsApi.update(id, body));
      setNote('');
      onChanged();
    } catch (e) {
      message.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const retry = async () => {
    setBusy(true);
    try {
      const l = await LeadsApi.retryCrm(id);
      setLead(l);
      message[l.crmSync === 'Synced' ? 'success' : 'warning'](`CRM sync: ${l.crmSync}${l.crmError ? ` (${l.crmError})` : ''}`);
      onChanged();
    } catch (e) {
      message.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer open={!!id} onClose={onClose} width={520} title={lead ? lead.name || lead.email || lead.phone || 'Lead' : 'Lead'} loading={!lead}>
      {lead && (
        <>
          <Space wrap style={{ marginBottom: 14 }}>
            {can(PERM.LEAD_UPDATE) ? (
              <Select value={lead.status} style={{ width: 150 }} onChange={(status) => update({ status })} disabled={busy} options={['New', 'Contacted', 'Qualified', 'Converted', 'Lost'].map((s) => ({ value: s, label: s }))} />
            ) : (
              <Tag color={LEAD_STATUS_COLORS[lead.status]}>{lead.status}</Tag>
            )}
            {lead.isPartial && <Tag color="orange">Unfinished form</Tag>}
            {lead.otpVerified && <Tag color="green">Mobile verified</Tag>}
            {lead.crmSync && <Tag color={CRM_COLORS[lead.crmSync]}>CRM {lead.crmSync}</Tag>}
            {can(PERM.LEAD_UPDATE) && !lead.isPartial && lead.crmSync !== 'Synced' && (
              <Button size="small" icon={<SyncOutlined />} loading={busy} onClick={retry}>Sync to CRM</Button>
            )}
          </Space>

          <Descriptions column={1} size="small" bordered title="Came from">
            <Descriptions.Item label="Page">
              {lead.page ? (
                <Space>
                  <Typography.Link onClick={() => navigate(`/builder/${lead.page.id}`)}>{lead.pageName}</Typography.Link>
                  {lead.page.deleted ? <Tag>deleted</Tag> : lead.page.isLive ? <Tag color="green">live</Tag> : <Tag>{lead.page.status}</Tag>}
                </Space>
              ) : (
                lead.pageName || '—'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Channel">
              <Tag color="blue">{lead.channel}</Tag> {lead.channelTag && <Tag>{lead.channelTag}</Tag>}
            </Descriptions.Item>
            {['source', 'medium', 'campaign', 'content', 'term'].filter((k) => lead.utm[k]).map((k) => (
              <Descriptions.Item key={k} label={`UTM ${k}`}>{lead.utm[k]}</Descriptions.Item>
            ))}
            {lead.referrer && <Descriptions.Item label="Referrer"><Typography.Text style={{ fontSize: 12 }} ellipsis>{lead.referrer}</Typography.Text></Descriptions.Item>}
            <Descriptions.Item label="Device">{lead.device || '—'}</Descriptions.Item>
            <Descriptions.Item label="Submitted">{dayjs(lead.createdTime).format('DD MMM YYYY, HH:mm')}</Descriptions.Item>
            {lead.crmId && <Descriptions.Item label="CRM ID">{lead.crmId}</Descriptions.Item>}
            {lead.crmError && <Descriptions.Item label="CRM note"><Typography.Text type={lead.crmSync === 'Synced' ? 'warning' : 'danger'} style={{ fontSize: 12 }}>{lead.crmError}</Typography.Text></Descriptions.Item>}
          </Descriptions>

          <Descriptions column={1} size="small" bordered title="Form answers" style={{ marginTop: 18 }}>
            {Object.entries(lead.fields || {}).map(([k, v]) => (
              <Descriptions.Item key={k} label={lead.labels[k] || k}>{Array.isArray(v) ? v.join(', ') : String(v)}</Descriptions.Item>
            ))}
          </Descriptions>

          <Typography.Title level={5} style={{ marginTop: 18 }}>Timeline</Typography.Title>
          <Timeline
            items={(lead.activity || []).slice().reverse().map((a) => ({
              color: a.type === 'status' ? 'blue' : a.type === 'crm' ? 'purple' : 'gray',
              children: (
                <div>
                  <div>{a.text}</div>
                  <div className="pb-muted" style={{ fontSize: 12 }}>{a.by ? `${a.by} · ` : ''}{a.time ? dayjs(a.time).format('DD MMM, HH:mm') : ''}</div>
                </div>
              ),
            }))}
          />
          {can(PERM.LEAD_UPDATE) && (
            <Space.Compact style={{ width: '100%' }}>
              <Input placeholder="Add a note (call outcome, follow-up…)" value={note} onChange={(e) => setNote(e.target.value)} onPressEnter={() => note.trim() && update({ note })} />
              <Button type="primary" disabled={!note.trim()} loading={busy} onClick={() => update({ note })}>Add</Button>
            </Space.Compact>
          )}
        </>
      )}
    </Drawer>
  );
}

export default function Leads() {
  const { can } = useAuth();
  const { message } = App.useApp();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState([]);
  const [meta, setMeta] = useState({ statuses: [], channels: [] });
  const [channels, setChannels] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState(null);
  const [pageNo, setPageNo] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filters = useMemo(
    () => ({
      pageId: params.get('pageId') || undefined,
      channel: params.get('channel') || undefined,
      status: params.get('status') || undefined,
      partial: params.get('partial') || 'false',
      crm: params.get('crm') || undefined,
      search: search || undefined,
      from: range && range[0] ? range[0].format('YYYY-MM-DD') : undefined,
      to: range && range[1] ? range[1].format('YYYY-MM-DD') : undefined,
    }),
    [params, search, range],
  );

  const setFilter = (k, v) => {
    const next = new URLSearchParams(params);
    if (v === undefined || v === null || v === '') next.delete(k);
    else next.set(k, v);
    setParams(next, { replace: true });
    setPageNo(1);
  };

  const load = useCallback(() => {
    setLoading(true);
    LeadsApi.list({ ...filters, page: pageNo, perPage })
      .then(setData)
      .catch((e) => message.error(e.message))
      .finally(() => setLoading(false));
    LeadsApi.channels({ pageId: filters.pageId }).then(setChannels).catch(() => {});
  }, [filters, pageNo, perPage, message]);

  useEffect(load, [load]);
  useEffect(() => {
    Pages.list().then(setPages).catch(() => {});
    LeadsApi.meta().then(setMeta).catch(() => {});
  }, []);

  const columns = [
    {
      title: 'Lead',
      render: (_, l) => (
        <div>
          <Typography.Link onClick={() => setOpenId(l.id)} style={{ fontWeight: 600 }}>{l.name || l.email || l.phone || 'Unnamed'}</Typography.Link>
          <div className="pb-muted" style={{ fontSize: 12 }}>{[l.phone, l.email].filter(Boolean).join(' · ')}</div>
        </div>
      ),
    },
    { title: 'Page', dataIndex: 'pageName', ellipsis: true, render: (n, l) => <Typography.Link onClick={() => setFilter('pageId', l.pageId)}>{n}</Typography.Link> },
    {
      title: 'Channel',
      render: (_, l) => (
        <div>
          <Tag color="blue">{l.channel}</Tag>
          {(l.utm.campaign || l.channelTag) && <div className="pb-muted" style={{ fontSize: 11.5 }}>{[l.utm.campaign, l.channelTag].filter(Boolean).join(' · ')}</div>}
        </div>
      ),
    },
    { title: 'Status', dataIndex: 'status', width: 120, render: (s, l) => <Space size={4}><Tag color={LEAD_STATUS_COLORS[s]}>{s}</Tag>{l.isPartial && <Tag color="orange">Partial</Tag>}</Space> },
    { title: 'CRM', dataIndex: 'crmSync', width: 100, render: (s, l) => (s ? <Tooltip title={l.crmError}><Tag color={CRM_COLORS[s]}>{s}</Tag></Tooltip> : <span className="pb-muted">—</span>) },
    { title: 'Device', dataIndex: 'device', width: 90 },
    { title: 'Received', dataIndex: 'createdTime', width: 150, render: (t) => dayjs(t).format('DD MMM YYYY, HH:mm') },
    can(PERM.LEAD_DELETE) && {
      title: '',
      width: 50,
      render: (_, l) => (
        <Popconfirm
          title="Delete this lead?"
          onConfirm={() =>
            LeadsApi.remove(l.id)
              .then(() => {
                message.success('Deleted');
                load();
              })
              .catch((e) => message.error(e.message))
          }
        >
          <Button size="small" type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ].filter(Boolean);

  const selectedPage = pages.find((p) => p.id === filters.pageId);

  return (
    <div>
      <div className="pb-page-head">
        <div>
          <h1>Leads</h1>
          <p>Every lead shows the page and channel it came from. Click a lead for details, notes and CRM sync.</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load} />
          {can(PERM.LEAD_EXPORT) && (
            <Button icon={<DownloadOutlined />} onClick={() => LeadsApi.exportCsv(filters).catch((e) => message.error(e.message))}>
              Export CSV
            </Button>
          )}
        </Space>
      </div>

      {data && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} md={6}><Card className="pb-kpi"><Statistic title="Leads" value={data.summary.total} /></Card></Col>
          <Col xs={12} md={6}><Card className="pb-kpi"><Statistic title="New" value={data.summary.byStatus.New || 0} /></Card></Col>
          <Col xs={12} md={6}><Card className="pb-kpi"><Statistic title="Converted" value={data.summary.byStatus.Converted || 0} /></Card></Col>
          <Col xs={12} md={6}>
            <Card className="pb-kpi" hoverable onClick={() => setFilter('crm', 'Failed')}>
              <Statistic title="CRM sync failed" value={data.summary.crmFailed} valueStyle={data.summary.crmFailed ? { color: '#DC2626' } : undefined} />
            </Card>
          </Col>
        </Row>
      )}

      {channels.length > 0 && (
        <Card size="small" style={{ marginBottom: 16 }} title={selectedPage ? `Channels for "${selectedPage.name}"` : 'Channels'}>
          <Space wrap>
            {channels.map((c) => (
              <Tag.CheckableTag key={c.channel} checked={filters.channel === c.channel} onChange={(on) => setFilter('channel', on ? c.channel : undefined)} style={{ border: '1px solid #E2E8F0', padding: '4px 10px' }}>
                <b>{c.channel}</b> · {c.leads} leads · {c.views} views · {c.conversion}%
              </Tag.CheckableTag>
            ))}
          </Space>
        </Card>
      )}

      <Card styles={{ body: { padding: 0 } }}>
        <div style={{ padding: 14, display: 'flex', gap: 10, flexWrap: 'wrap', borderBottom: '1px solid #F1F5F9' }}>
          <Input.Search placeholder="Name, phone, email, campaign" allowClear onSearch={(v) => { setSearch(v); setPageNo(1); }} style={{ width: 240 }} />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="All pages"
            style={{ width: 220 }}
            value={filters.pageId}
            onChange={(v) => setFilter('pageId', v)}
            options={pages.map((p) => ({ value: p.id, label: p.name }))}
          />
          <Select allowClear placeholder="Channel" style={{ width: 150 }} value={filters.channel} onChange={(v) => setFilter('channel', v)} options={meta.channels.map((c) => ({ value: c, label: c }))} />
          <Select allowClear placeholder="Status" style={{ width: 130 }} value={filters.status} onChange={(v) => setFilter('status', v)} options={meta.statuses.map((c) => ({ value: c, label: c }))} />
          <Select allowClear placeholder="CRM" style={{ width: 120 }} value={filters.crm} onChange={(v) => setFilter('crm', v)} options={['Synced', 'Failed', 'Pending', 'Skipped'].map((c) => ({ value: c, label: c }))} />
          <RangePicker value={range} onChange={(r) => { setRange(r); setPageNo(1); }} />
          <Segmented
            value={filters.partial}
            onChange={(v) => setFilter('partial', v)}
            options={[{ value: 'false', label: 'Complete' }, { value: 'true', label: 'Unfinished' }, { value: 'all', label: 'All' }]}
          />
          {selectedPage && (
            <Button type="link" icon={<LinkOutlined />} onClick={() => window.open(Pages.previewUrl(selectedPage.id), '_blank', 'noopener')}>
              Preview page
            </Button>
          )}
        </div>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data ? data.items : []}
          scroll={{ x: 1000 }}
          onRow={(l) => ({ onDoubleClick: () => setOpenId(l.id) })}
          locale={{ emptyText: <Empty description="No leads match these filters" /> }}
          pagination={{
            current: pageNo,
            pageSize: perPage,
            total: data ? data.summary.total : 0,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: TABLE_PAGINATION.showTotal,
            onChange: (p, s) => {
              setPageNo(p);
              setPerPage(s);
            },
          }}
        />
      </Card>
      <LeadDrawer id={openId} onClose={() => setOpenId(null)} onChanged={load} />
    </div>
  );
}
