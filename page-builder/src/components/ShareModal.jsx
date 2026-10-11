import React, { useEffect, useState } from 'react';
import { Modal, Input, Button, Space, Table, Alert, Tabs, Typography, App, Select } from 'antd';
import { CopyOutlined, DownloadOutlined, LinkOutlined } from '@ant-design/icons';
import QRCode from 'qrcode';
import { Pages } from '../api/client';

const copy = async (text, message) => {
  try {
    await navigator.clipboard.writeText(text);
    message.success('Copied');
  } catch {
    message.info(text);
  }
};

// Share links per channel (ch + UTM), so every lead is attributed to where it
// came from; QR codes carry ch=qr and an optional location tag.
export default function ShareModal({ page, onClose }) {
  const { message } = App.useApp();
  const [data, setData] = useState(null);
  const [qr, setQr] = useState(null);
  const [tag, setTag] = useState('');
  const [qrChannel, setQrChannel] = useState('QR Code');

  useEffect(() => {
    if (!page) return;
    setData(null);
    Pages.share(page.id)
      .then(setData)
      .catch((e) => message.error(e.message));
  }, [page, message]);

  const qrUrl = (() => {
    if (!data) return '';
    const base = (data.channels.find((c) => c.channel === qrChannel) || data.channels[data.channels.length - 1]).url;
    return tag ? `${base}&tag=${encodeURIComponent(tag)}` : base;
  })();

  useEffect(() => {
    if (!qrUrl) return;
    QRCode.toDataURL(qrUrl, { width: 520, margin: 2, color: { dark: '#0B1B33' } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [qrUrl]);

  if (!page) return null;
  return (
    <Modal
      open={!!page}
      onCancel={onClose}
      footer={null}
      width="min(1080px, 94vw)"
      centered
      styles={{ body: { maxHeight: 'calc(100vh - 140px)', overflowY: 'auto', overflowX: 'hidden' } }}
      title={`Share "${page.name}"`}
    >
      {data && !data.isLive && (
        <Alert type="warning" showIcon style={{ marginBottom: 12 }} message="This page is not live yet. Links will work after it is published." />
      )}
      {data && (
        <Tabs
          items={[
            {
              key: 'links',
              label: 'Links by channel',
              children: (
                <>
                  <Space.Compact style={{ width: '100%', marginBottom: 14 }}>
                    <Input value={data.url} readOnly prefix={<LinkOutlined />} />
                    <Button icon={<CopyOutlined />} onClick={() => copy(data.url, message)}>Copy</Button>
                    <Button onClick={() => window.open(data.url, '_blank', 'noopener')}>Open</Button>
                  </Space.Compact>
                  <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
                    Share each channel's own link there (Facebook link in your Facebook post, WhatsApp link in WhatsApp…).
                    Every lead is then tagged with that channel and campaign automatically.
                  </Typography.Paragraph>
                  <Table
                    size="small"
                    pagination={false}
                    rowKey="channel"
                    dataSource={data.channels}
                    columns={[
                      { title: 'Channel', dataIndex: 'channel', width: 120, render: (c) => <b>{c}</b> },
                      {
                        title: 'Link',
                        dataIndex: 'url',
                        render: (u) => <span style={{ fontSize: 12.5, wordBreak: 'break-all', color: '#4E5565', fontFamily: 'var(--k-mono)' }}>{u}</span>,
                      },
                      {
                        title: '',
                        width: 92,
                        render: (_, r) => (
                          <Button size="small" icon={<CopyOutlined />} onClick={() => copy(r.url, message)}>
                            Copy
                          </Button>
                        ),
                      },
                    ]}
                  />
                </>
              ),
            },
            {
              key: 'qr',
              label: 'QR code',
              children: (
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 260px' }}>
                    <p className="pb-muted">Leads from this QR code are recorded with channel and tag, so you can compare locations or print runs.</p>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Select value={qrChannel} onChange={setQrChannel} style={{ width: '100%' }} options={data.channels.map((c) => ({ value: c.channel, label: c.channel }))} />
                      <Input placeholder="Tag, e.g. pune-branch or flyer-june (optional)" value={tag} onChange={(e) => setTag(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))} />
                      <Input.TextArea value={qrUrl} readOnly autoSize style={{ fontSize: 12.5, fontFamily: 'var(--k-mono)' }} />
                      <Button icon={<CopyOutlined />} onClick={() => copy(qrUrl, message)}>Copy QR link</Button>
                    </Space>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    {qr && <img src={qr} alt="QR code" style={{ width: 220, height: 220, border: '1px solid #E2E8F0', borderRadius: 12 }} />}
                    <div style={{ marginTop: 8 }}>
                      <Button icon={<DownloadOutlined />} href={qr || undefined} download={`${page.slug}${tag ? `-${tag}` : ''}-qr.png`}>
                        Download PNG
                      </Button>
                    </div>
                  </div>
                </div>
              ),
            },
          ]}
        />
      )}
    </Modal>
  );
}
