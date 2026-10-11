import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Select, Table, Tag, Empty, App, Statistic, Space } from 'antd';
import { Analytics, Pages, AI } from '../api/client';
import { TABLE_PAGINATION } from '../utils/table';
import { BarTrend, HBars } from '../components/Charts';

export default function Reports() {
  const { message } = App.useApp();
  const [pageId, setPageId] = useState();
  const [months, setMonths] = useState(12);
  const [data, setData] = useState(null);
  const [pages, setPages] = useState([]);
  const [ai, setAi] = useState(null);

  useEffect(() => {
    Pages.list().then(setPages).catch(() => {});
    AI.usage(30).then(setAi).catch(() => {});
  }, []);
  useEffect(() => {
    setData(null);
    Analytics.reports({ pageId, months })
      .then(setData)
      .catch((e) => message.error(e.message));
  }, [pageId, months, message]);

  return (
    <div>
      <div className="pb-page-head">
        <div>
          <h1>Reports</h1>
          <p>Lead volume, channel and campaign performance and page conversion.</p>
        </div>
        <Space wrap>
          <Select allowClear showSearch optionFilterProp="label" placeholder="All pages" style={{ width: 240 }} value={pageId} onChange={setPageId} options={pages.map((p) => ({ value: p.id, label: p.name }))} />
          <Select value={months} onChange={setMonths} style={{ width: 140 }} options={[3, 6, 12, 24].map((m) => ({ value: m, label: `Last ${m} months` }))} />
        </Space>
      </div>
      {!data ? (
        <Card loading />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="Leads per month">
                <BarTrend data={data.monthly} labelKey="month" format={(m) => m} height={160} />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Lead status funnel" style={{ height: '100%' }}>
                <HBars rows={data.funnel} labelKey="status" valueKey="count" color="#0E9F6E" />
              </Card>
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={12}>
              <Card title="Channels: views, leads, conversion">
                <Table
                  size="small"
                  rowKey="channel"
                  pagination={false}
                  dataSource={data.channels}
                  locale={{ emptyText: <Empty description="No data" /> }}
                  columns={[
                    { title: 'Channel', dataIndex: 'channel', render: (c) => <Tag color="blue">{c}</Tag> },
                    { title: 'Views', dataIndex: 'views', sorter: (a, b) => a.views - b.views },
                    { title: 'Leads', dataIndex: 'leads', sorter: (a, b) => a.leads - b.leads },
                    { title: 'Conversion', dataIndex: 'conversion', render: (c) => `${c}%`, sorter: (a, b) => a.conversion - b.conversion },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Campaigns (utm_campaign)">
                {data.campaigns.length ? <HBars rows={data.campaigns.slice(0, 10)} labelKey="campaign" valueKey="leads" color="#7C3AED" /> : <Empty />}
              </Card>
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={16}>
              <Card title="Pages">
                <Table
                  size="small"
                  rowKey="id"
                  dataSource={data.pages}
                  pagination={TABLE_PAGINATION}
                  columns={[
                    { title: 'Page', dataIndex: 'name' },
                    { title: 'Status', dataIndex: 'status', render: (s, p) => <Space size={4}><Tag>{s}</Tag>{p.isLive && <Tag color="green">Live</Tag>}</Space> },
                    { title: 'Owner', dataIndex: 'owner' },
                    { title: 'Views', dataIndex: 'views', sorter: (a, b) => a.views - b.views },
                    { title: 'Leads', dataIndex: 'leads', sorter: (a, b) => a.leads - b.leads, defaultSortOrder: 'descend' },
                    { title: 'Conv.', dataIndex: 'conversion', render: (c) => `${c}%`, sorter: (a, b) => a.conversion - b.conversion },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Devices" style={{ marginBottom: 16 }}>
                {data.devices.length ? <HBars rows={data.devices} labelKey="device" valueKey="leads" color="#F59E0B" /> : <Empty />}
              </Card>
              {ai && (
                <Card title="AI usage, last 30 days">
                  <Statistic title="AI requests" value={ai.total} />
                  <div style={{ marginTop: 12 }}>
                    {ai.byKind.map((k) => (
                      <div key={k.kind} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid #F1F5F9' }}>
                        <span>{k.kind.replace('_', ' ')}</span>
                        <span className="pb-muted">{k.total}{k.failed ? ` · ${k.failed} failed` : ''}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
