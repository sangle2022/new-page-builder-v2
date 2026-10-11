import React, { useCallback, useEffect, useState } from 'react';
import {
  Input, Segmented, Upload, Button, Space, Tag, Empty, Spin, App, Tooltip, Popconfirm, Modal, Form, Select, Alert, Typography, Divider,
} from 'antd';
import { UploadOutlined, ThunderboltOutlined, DeleteOutlined, CheckOutlined, CopyOutlined, BulbOutlined } from '@ant-design/icons';
import { Media, AI } from '../api/client';
import { useAuth, PERM } from '../context/AuthContext';

const ASPECTS = ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9'];

// AI image dialog: looks for a similar gallery image first; generates only
// when the user asks for a new one.
export function GenerateImageModal({ open, onClose, initialPrompt, size, onDone, context }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [suggest, setSuggest] = useState(null);
  const [busy, setBusy] = useState(false);
  const [enhancing, setEnhancing] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSuggest(null);
    form.setFieldsValue({ prompt: initialPrompt || '', aspectRatio: undefined });
  }, [open, initialPrompt, form]);

  const findSimilar = async () => {
    const { prompt } = await form.validateFields(['prompt']);
    setBusy(true);
    try {
      setSuggest(await AI.suggestImages(prompt));
    } catch (e) {
      message.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const generate = async (forceNew) => {
    const v = await form.validateFields();
    setBusy(true);
    try {
      const res = await AI.generateImage({ prompt: v.prompt, aspectRatio: v.aspectRatio, size, reuseExisting: !forceNew });
      message.success(res.reused ? 'Reused a matching image from the gallery (no generation cost)' : 'Image generated and saved to the gallery');
      onDone(res.image, res);
      onClose();
    } catch (e) {
      message.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const enhance = async () => {
    const idea = form.getFieldValue('prompt');
    if (!idea) return;
    setEnhancing(true);
    try {
      const r = await AI.imagePrompt({ idea, context });
      form.setFieldsValue({ prompt: r.prompt });
    } catch (e) {
      message.error(e.message);
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <Modal open={open} onCancel={busy ? undefined : onClose} title="Generate an image with AI" footer={null} width={720} destroyOnClose>
      <Spin spinning={busy} tip="Working… image generation takes 10-30 seconds">
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="prompt" label="Describe the image" rules={[{ required: true, min: 3 }]}>
            <Input.TextArea rows={3} placeholder="e.g. young couple receiving keys to their new apartment, bright and happy" />
          </Form.Item>
          <Space wrap>
            <Button icon={<BulbOutlined />} loading={enhancing} onClick={enhance}>Improve prompt</Button>
            <Form.Item name="aspectRatio" noStyle>
              <Select allowClear placeholder={size ? `Fit (${size})` : 'Aspect ratio'} style={{ width: 150 }} options={ASPECTS.map((a) => ({ value: a, label: a }))} />
            </Form.Item>
            <Button onClick={findSimilar}>Find similar in gallery</Button>
            <Button type="primary" icon={<ThunderboltOutlined />} onClick={() => generate(false)}>Get image</Button>
          </Space>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8 }}>
            "Get image" reuses a very similar gallery image when one exists, to save generation cost.
          </Typography.Paragraph>
        </Form>
        {suggest && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            {suggest.candidates.length ? (
              <>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>Similar images already in your gallery</div>
                <div className="pb-gallery-grid">
                  {suggest.candidates.map((m) => (
                    <div key={m.id} className="pb-gallery-item" onClick={() => { Media.markUsed([m.id]).catch(() => {}); onDone(m, { reused: true }); onClose(); }}>
                      <img src={m.url} alt={m.name} loading="lazy" />
                      <div className="pb-gallery-meta"><span>{Math.round(m.score * 100)}% match</span><span>Use</span></div>
                    </div>
                  ))}
                </div>
                <Button style={{ marginTop: 12 }} onClick={() => generate(true)} icon={<ThunderboltOutlined />}>None of these, generate a new one</Button>
              </>
            ) : (
              <Alert type="info" showIcon message="No similar image found. Generating a new one is the way to go." />
            )}
          </>
        )}
      </Spin>
    </Modal>
  );
}

// Gallery grid with search, upload, AI generation and delete. In picker mode
// a click selects the image (builder asset manager / image fields).
export default function MediaLibrary({ picker = false, onSelect, height, generatePrompt, context }) {
  const { can } = useAuth();
  const { message } = App.useApp();
  const [items, setItems] = useState(null);
  const [source, setSource] = useState('all');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    setItems(null);
    Media.list({ source, search: search || undefined })
      .then(setItems)
      .catch((e) => {
        message.error(e.message);
        setItems([]);
      });
  }, [source, search, message]);
  useEffect(load, [load]);

  const upload = async (files) => {
    setUploading(true);
    try {
      const res = await Media.upload(files);
      if (res.errors && res.errors.length) message.warning(res.errors.map((e) => `${e.name}: ${e.message}`).join(' '));
      message.success(`${res.data.length} image(s) uploaded`);
      load();
      if (picker && res.data.length === 1) setSelected(res.data[0]);
    } catch (e) {
      message.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const remove = async (m) => {
    try {
      await Media.remove(m.id);
      message.success(m.usageCount > 1 ? 'Deleted. Pages that already use it keep a broken link; replace the image there.' : 'Deleted');
      load();
    } catch (e) {
      message.error(e.message);
    }
  };

  const choose = (m) => {
    if (!picker) return;
    setSelected(m);
  };

  const confirm = () => {
    if (!selected) return;
    Media.markUsed([selected.id]).catch(() => {});
    onSelect(selected);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
        <Input.Search placeholder="Search by meaning, e.g. 'family at home'" allowClear onSearch={setSearch} style={{ width: 280 }} />
        <Segmented value={source} onChange={setSource} options={[{ value: 'all', label: 'All' }, { value: 'ai', label: 'AI generated' }, { value: 'upload', label: 'Uploaded' }]} />
        <div style={{ flex: 1 }} />
        {can(PERM.MEDIA_UPLOAD) && (
          <Upload multiple accept="image/*" showUploadList={false} beforeUpload={(f, list) => { if (f === list[0]) upload(list); return false; }}>
            <Button icon={<UploadOutlined />} loading={uploading}>Upload</Button>
          </Upload>
        )}
        {can(PERM.AI_USE) && <Button type="primary" icon={<ThunderboltOutlined />} onClick={() => setGenOpen(true)}>Generate with AI</Button>}
      </div>
      <div style={{ maxHeight: height, overflow: height ? 'auto' : undefined, padding: 2 }}>
        {!items ? (
          <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
        ) : items.length ? (
          <div className="pb-gallery-grid">
            {items.map((m) => (
              <div key={m.id} className={`pb-gallery-item${selected && selected.id === m.id ? ' is-selected' : ''}`} onClick={() => choose(m)} onDoubleClick={() => picker && onSelect(m)}>
                <img src={m.url} alt={m.name} loading="lazy" />
                <div className="pb-gallery-meta">
                  <span>{m.source === 'ai' ? <Tag color="purple" style={{ fontSize: 10, margin: 0, lineHeight: '16px' }}>AI</Tag> : null}</span>
                  <Tooltip title={m.prompt || m.tags.join(', ') || m.name}><span>Used {m.usageCount}×</span></Tooltip>
                </div>
                <div className="pb-gallery-actions" onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="Copy URL"><Button size="small" icon={<CopyOutlined />} onClick={() => navigator.clipboard && navigator.clipboard.writeText(m.url).then(() => message.success('URL copied'))} /></Tooltip>
                  {(can(PERM.MEDIA_DELETE) || can(PERM.MEDIA_UPLOAD)) && (
                    <Popconfirm title="Delete this image?" description={m.usageCount > 1 ? `It is used ${m.usageCount} times.` : undefined} onConfirm={() => remove(m)}>
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty description={search ? 'No images match. Try other words or generate one.' : 'No images yet. Upload or generate one.'} />
        )}
      </div>
      {picker && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
          <span className="pb-muted" style={{ fontSize: 12.5 }}>{selected ? selected.prompt || selected.name : 'Select an image, or double-click to insert'}</span>
          <Button type="primary" icon={<CheckOutlined />} disabled={!selected} onClick={confirm}>Use image</Button>
        </div>
      )}
      <GenerateImageModal
        open={genOpen}
        onClose={() => setGenOpen(false)}
        initialPrompt={generatePrompt}
        context={context}
        onDone={(img) => {
          load();
          if (picker) onSelect(img);
        }}
      />
    </div>
  );
}
