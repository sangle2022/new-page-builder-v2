import React, { useEffect, useState } from 'react';
import { Button } from 'antd';
import { SyncOutlined } from '@ant-design/icons';

// The app is a single-page app: a tab that stays open keeps running the code
// it loaded, even after a new deploy. This checks the published build every
// two minutes and offers a reload when it changed.
const CHECK_MS = 2 * 60 * 1000;

function loadedMainScript() {
  const s = [...document.querySelectorAll('script[src]')].map((x) => x.getAttribute('src')).find((src) => /static\/js\/main\.[\w]+\.js/.test(src));
  return s ? s.match(/main\.[\w]+\.js/)[0] : null;
}

export default function VersionBanner() {
  const [outdated, setOutdated] = useState(false);

  useEffect(() => {
    const current = loadedMainScript();
    if (!current) return undefined; // dev server
    let stopped = false;
    const check = async () => {
      try {
        const res = await fetch(`${process.env.PUBLIC_URL || '.'}/asset-manifest.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const manifest = await res.json();
        const latest = String((manifest.files && manifest.files['main.js']) || '').match(/main\.[\w]+\.js/);
        if (!stopped && latest && latest[0] !== current) setOutdated(true);
      } catch {
        /* offline: try again later */
      }
    };
    const timer = setInterval(check, CHECK_MS);
    const onFocus = () => check();
    window.addEventListener('focus', onFocus);
    check();
    return () => {
      stopped = true;
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  if (!outdated) return null;
  return (
    <div
      style={{
        position: 'fixed', left: '50%', bottom: 20, transform: 'translateX(-50%)', zIndex: 2000, display: 'flex', alignItems: 'center', gap: 14,
        padding: '10px 12px 10px 18px', borderRadius: 14, background: '#0A1226', color: '#fff', boxShadow: '0 16px 40px rgba(10,18,38,.35)',
        border: '1px solid rgba(143,176,245,.25)', fontSize: 13.5,
      }}
    >
      <span>A new version of Kite is available.</span>
      <Button type="primary" size="small" icon={<SyncOutlined />} onClick={() => window.location.reload()}>
        Reload
      </Button>
    </div>
  );
}
