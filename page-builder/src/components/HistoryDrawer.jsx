import React, { useEffect, useState } from 'react';
import { Drawer, Timeline, Tabs, List, Button, Tag, App, Empty, Spin } from 'antd';
import dayjs from 'dayjs';
import { Pages } from '../api/client';

const COLORS = { Submitted: 'blue', Approved: 'green', Rejected: 'red', Published: 'green', Unpublished: 'gray', Withdrawn: 'gray', Edited: 'orange', Deleted: 'red' };

// Approval audit trail and saved versions of a page.
export default function HistoryDrawer({ page, onClose, onRestored }) {
  const { message, modal } = App.useApp();
  const [history, setHistory] = useState(null);
  const [versions, setVersions] = useState(null);

  useEffect(() => {
    if (!page) return;
    setHistory(null);
    setVersions(null);
    Pages.history(page.id).then(setHistory).catch((e) => message.error(e.message));
    Pages.versions(page.id).then(setVersions).catch((e) => message.error(e.message));
  }, [page, message]);

  const restore = (v) =>
    modal.confirm({
      title: `Restore version ${v.versionNo}?`,
      content: 'The draft is replaced with this version. The live page is not affected until you publish again.',
      okText: 'Restore',
      onOk: async () => {
        try {
          await Pages.restore(page.id, v.versionNo);
          message.success('Version restored to draft');
          if (onRestored) onRestored();
          onClose();
        } catch (e) {
          message.error(e.message);
        }
      },
    });

  return (
    <Drawer open={!!page} onClose={onClose} width={460} title={page ? `History · ${page.name}` : ''}>
      {page && (
        <Tabs
          items={[
            {
              key: 'audit',
              label: 'Approval trail',
              children: !history ? (
                <Spin />
              ) : history.length ? (
                <Timeline
                  items={history.map((h) => ({
                    color: COLORS[h.action] || 'blue',
                    children: (
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {h.action} {h.versionNo ? <Tag style={{ marginLeft: 4 }}>v{h.versionNo}</Tag> : null}
                        </div>
                        <div className="pb-muted" style={{ fontSize: 12.5 }}>
                          {h.actorName} · {dayjs(h.time).format('DD MMM YYYY, HH:mm')}
                        </div>
                        {h.comment && <div style={{ marginTop: 4, background: '#F8FAFC', padding: '6px 10px', borderRadius: 8 }}>{h.comment}</div>}
                      </div>
                    ),
                  }))}
                />
              ) : (
                <Empty description="No workflow activity yet" />
              ),
            },
            {
              key: 'versions',
              label: 'Versions',
              children: !versions ? (
                <Spin />
              ) : (
                <List
                  dataSource={versions}
                  locale={{ emptyText: 'Versions are created when a page is sent for approval or published.' }}
                  renderItem={(v) => (
                    <List.Item
                      actions={[
                        <Button key="p" size="small" onClick={() => window.open(Pages.previewUrl(page.id, v.versionNo), '_blank', 'noopener')}>Preview</Button>,
                        page.actions && page.actions.edit ? <Button key="r" size="small" onClick={() => restore(v)}>Restore</Button> : null,
                      ].filter(Boolean)}
                    >
                      <List.Item.Meta
                        title={
                          <span>
                            Version {v.versionNo}
                            {page.liveVersion === v.versionNo && <Tag color="green" style={{ marginLeft: 6 }}>Live</Tag>}
                            {page.approvedVersion === v.versionNo && page.liveVersion !== v.versionNo && <Tag color="cyan" style={{ marginLeft: 6 }}>Approved</Tag>}
                          </span>
                        }
                        description={`${v.source} · ${v.createdBy} · ${dayjs(v.createdTime).format('DD MMM, HH:mm')}${v.note ? ` · ${v.note}` : ''}`}
                      />
                    </List.Item>
                  )}
                />
              ),
            },
          ]}
        />
      )}
    </Drawer>
  );
}
