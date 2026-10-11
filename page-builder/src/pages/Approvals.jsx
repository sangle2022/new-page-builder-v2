import React, { useCallback, useEffect, useState } from 'react';
import { Card, Tabs, List, Button, Space, Tag, Empty, Timeline, Row, Col, Typography, App, Badge } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Pages } from '../api/client';
import { useAuth, PERM } from '../context/AuthContext';
import usePageActions from '../components/usePageActions';
import StatusTag from '../components/StatusTag';

// Marketing approval queue: review pending pages, see decisions and the
// workflow activity log.
export default function Approvals() {
  const { can, user } = useAuth();
  const { message } = App.useApp();
  const [data, setData] = useState(null);

  const load = useCallback(() => {
    Pages.approvals()
      .then(setData)
      .catch((e) => message.error(e.message));
  }, [message]);
  useEffect(load, [load]);
  const { handlers, elements } = usePageActions(load);

  const item = (p) => (
    <List.Item
      actions={[
        <Button key="p" icon={<EyeOutlined />} onClick={() => handlers.preview(p)}>Preview</Button>,
        p.actions.approve && <Button key="a" type="primary" icon={<CheckOutlined />} onClick={() => handlers.approve(p)}>Approve</Button>,
        p.actions.reject && <Button key="r" danger icon={<CloseOutlined />} onClick={() => handlers.reject(p)}>Reject</Button>,
        p.actions.publish && <Button key="pub" type="primary" onClick={() => handlers.publish(p)}>Publish</Button>,
        p.actions.edit && p.status === 'Rejected' && <Button key="e" onClick={() => handlers.edit(p)}>Fix &amp; resubmit</Button>,
        p.actions.withdraw && !p.actions.approve && <Button key="w" onClick={() => handlers.withdraw(p)}>Withdraw</Button>,
      ].filter(Boolean)}
    >
      <List.Item.Meta
        title={
          <Space wrap>
            <Typography.Link onClick={() => handlers.history(p)} style={{ fontWeight: 600 }}>{p.name}</Typography.Link>
            <StatusTag page={p} />
            <Tag>v{p.currentVersion}</Tag>
          </Space>
        }
        description={
          <div>
            {p.status === 'Pending Approval' && (
              <div>Submitted by <b>{p.submittedBy}</b> {p.submittedTime && `· ${dayjs(p.submittedTime).format('DD MMM, HH:mm')}`}</div>
            )}
            {p.status !== 'Pending Approval' && p.reviewedBy && (
              <div>{p.status} by <b>{p.reviewedBy}</b> {p.reviewedTime && `· ${dayjs(p.reviewedTime).format('DD MMM, HH:mm')}`}</div>
            )}
            {p.reviewComment && <Typography.Paragraph style={{ margin: '6px 0 0', background: '#F8FAFC', padding: '6px 10px', borderRadius: 8 }}>“{p.reviewComment}”</Typography.Paragraph>}
            {p.status === 'Pending Approval' && !p.actions.approve && can(PERM.PAGE_APPROVE) && p.ownerEmail === user.email && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>Another marketing team member must review your own page.</Typography.Text>
            )}
          </div>
        }
      />
    </List.Item>
  );

  if (!data) return <Card loading />;
  return (
    <div>
      <div className="pb-page-head">
        <div>
          <h1>Approvals</h1>
          <p>Pages are reviewed by the marketing team before they go live. Editing an approved page sends it back to draft.</p>
        </div>
      </div>
      <Row gutter={16}>
        <Col xs={24} xl={16}>
          <Card styles={{ body: { paddingTop: 4 } }}>
            <Tabs
              items={[
                { key: 'pending', label: <Badge count={data.pending.length} offset={[12, 0]} size="small">Waiting for review</Badge>, children: <List dataSource={data.pending} renderItem={item} locale={{ emptyText: <Empty description="Nothing waiting for review" /> }} /> },
                { key: 'approved', label: `Approved, not live (${data.approved.length})`, children: <List dataSource={data.approved} renderItem={item} locale={{ emptyText: <Empty description="No approved pages waiting to go live" /> }} /> },
                { key: 'rejected', label: `Rejected (${data.rejected.length})`, children: <List dataSource={data.rejected} renderItem={item} locale={{ emptyText: <Empty description="No rejected pages" /> }} /> },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="Workflow activity" styles={{ body: { maxHeight: 640, overflow: 'auto' } }}>
            {data.activity.length ? (
              <Timeline
                items={data.activity.map((a) => ({
                  color: { Approved: 'green', Rejected: 'red', Published: 'green', Submitted: 'blue' }[a.action] || 'gray',
                  children: (
                    <div style={{ fontSize: 13 }}>
                      <b>{a.actorName}</b> {a.action.toLowerCase()} <b>{a.pageName}</b>
                      <div className="pb-muted" style={{ fontSize: 12 }}>{dayjs(a.time).format('DD MMM YYYY, HH:mm')}</div>
                      {a.comment && <div className="pb-muted">“{a.comment}”</div>}
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty description="No activity yet" />
            )}
          </Card>
        </Col>
      </Row>
      {elements}
    </div>
  );
}
