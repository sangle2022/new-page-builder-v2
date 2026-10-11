import React, { useEffect, useRef, useState } from 'react';
import { Tag } from 'antd';
import { API_BASE } from '../api/client';
import { classicPreviewDoc } from '../builder/classic/catalog';

// The page is rendered at desktop width and scaled down to fit the card.
const PAGE_WIDTH = 1600;

// Live, scaled-down preview of a template (saved image, classic HTML, or the
// server-rendered preview). Iframes load lazily as cards scroll into view.
export default function TemplateThumb({ tpl, height = 150, showCategory = true }) {
  const box = useRef(null);
  const [scale, setScale] = useState(0.25);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w) setScale(w / PAGE_WIDTH);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (tpl.thumbnailUrl) {
    return <img src={tpl.thumbnailUrl} alt="" style={{ display: 'block', width: '100%', height, objectFit: 'cover' }} />;
  }
  const frame = {
    width: PAGE_WIDTH,
    height: Math.ceil(height / scale),
    border: 0,
    transform: `scale(${scale})`,
    transformOrigin: '0 0',
    pointerEvents: 'none',
  };
  return (
    <div ref={box} style={{ height, overflow: 'hidden', position: 'relative', background: '#F1F5F9' }}>
      {tpl.kind === 'classic' ? (
        <iframe title={tpl.name} srcDoc={classicPreviewDoc(tpl.html)} loading="lazy" tabIndex={-1} style={frame} />
      ) : (
        <iframe title={tpl.name} src={`${API_BASE}/templates/${encodeURIComponent(tpl.key)}/preview`} loading="lazy" tabIndex={-1} style={frame} />
      )}
      {showCategory && (
        <Tag style={{ position: 'absolute', left: 10, top: 10, margin: 0 }} color={tpl.kind === 'classic' ? 'default' : 'blue'}>
          {tpl.category}
        </Tag>
      )}
    </div>
  );
}
