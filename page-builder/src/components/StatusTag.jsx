import React from 'react';
import { Tag, Tooltip } from 'antd';
import { STATUS_COLORS } from '../theme';

export default function StatusTag({ page }) {
  const live = page.isLive && page.status !== 'Published';
  return (
    <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
      <Tag color={STATUS_COLORS[page.status] || 'default'} style={{ marginInlineEnd: 0 }}>
        {page.status}
      </Tag>
      {live && (
        <Tooltip title={`Version ${page.liveVersion} is live while the latest changes are in ${page.status.toLowerCase()}`}>
          <Tag color="green" style={{ marginInlineEnd: 0 }}>
            Live v{page.liveVersion}
          </Tag>
        </Tooltip>
      )}
      {page.isLegacy && (
        <Tooltip title="Created in V1. It is converted to V2 on first save.">
          <Tag style={{ marginInlineEnd: 0 }}>V1</Tag>
        </Tooltip>
      )}
    </span>
  );
}
