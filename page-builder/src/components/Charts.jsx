import React from 'react';
import { Tooltip } from 'antd';

// Lightweight CSS charts (no chart library needed).

export function BarTrend({ data, valueKey = 'leads', labelKey = 'date', height = 140, color = '#004AAD', format = (l) => l.slice(5) }) {
  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
        {data.map((d) => (
          <Tooltip key={d[labelKey]} title={`${d[labelKey]}: ${d[valueKey]}`}>
            <div
              style={{
                flex: 1,
                minWidth: 3,
                height: `${Math.max(2, (d[valueKey] / max) * 100)}%`,
                background: d[valueKey] ? color : '#E2E8F0',
                borderRadius: '4px 4px 0 0',
                transition: 'height .3s',
              }}
            />
          </Tooltip>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
        <span>{data[0] && format(data[0][labelKey])}</span>
        <span>{data.length > 2 && format(data[Math.floor(data.length / 2)][labelKey])}</span>
        <span>{data.length && format(data[data.length - 1][labelKey])}</span>
      </div>
    </div>
  );
}

export function HBars({ rows, labelKey, valueKey, extra, color = '#004AAD' }) {
  const max = Math.max(1, ...rows.map((r) => r[valueKey]));
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {rows.map((r) => (
        <div key={r[labelKey]}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span style={{ fontWeight: 500 }}>{r[labelKey]}</span>
            <span className="pb-muted">{r[valueKey]}{extra ? ` · ${extra(r)}` : ''}</span>
          </div>
          <div style={{ height: 8, borderRadius: 99, background: '#EEF2F7', overflow: 'hidden' }}>
            <div style={{ width: `${(r[valueKey] / max) * 100}%`, height: '100%', background: color, borderRadius: 99 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
