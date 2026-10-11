import React, { useCallback, useEffect, useState } from 'react';
import { Input, Upload, Button, Empty, Spin, Typography, App, Tooltip } from 'antd';
import { UploadOutlined, PictureOutlined } from '@ant-design/icons';
import { Media } from '../api/client';
import { useAuth, PERM } from '../context/AuthContext';
import { attachImage } from './grapes/images';

const isImage = (c) => c && (c.get('type') === 'image' || c.get('tagName') === 'img');

// Editor "Images" panel: every gallery image (uploaded and AI-generated).
// Click a picture to put it on the selected element:
//   image / image placeholder -> replaced
//   section with a background placeholder -> background
//   any other element -> picture added inside it
export default function EditorGallery({ editor, selected, readOnly }) {
  const { can } = useAuth();
  const { message } = App.useApp();
  const [items, setItems] = useState(null);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    setItems(null);
    Media.list({ search: search || undefined, limit: 120 })
      .then(setItems)
      .catch((e) => {
        message.error(e.message);
        setItems([]);
      });
  }, [search, message]);
  useEffect(load, [load]);
  // Images created from the AI assistant appear without a manual refresh.
  useEffect(() => {
    window.addEventListener('pb:media-changed', load);
    return () => window.removeEventListener('pb:media-changed', load);
  }, [load]);

  const attach = (img) => {
    if (readOnly) return;
    if (!selected) {
      message.info('First select the image or section on the page where the picture should go.');
      return;
    }
    attachImage(editor, selected, img);
    Media.markUsed([img.id]).catch(() => {});
    message.success('Image added');
  };

  const upload = async (files) => {
    setUploading(true);
    try {
      const res = await Media.upload(files);
      message.success(`${res.data.length} image(s) uploaded`);
      load();
    } catch (e) {
      message.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const target = !selected
    ? null
    : isImage(selected)
      ? 'Click a picture to replace the selected image.'
      : selected.getAttributes()['data-pb-image-prompt']
        ? 'Click a picture to use it as this section’s background.'
        : 'Click a picture to add it inside the selected element.';

  return (
    <div>
      <div style={{ background: target ? '#E6EEFA' : '#F8FAFC', borderRadius: 10, padding: '8px 10px', fontSize: 12.5, marginBottom: 10 }}>
        <PictureOutlined /> {target || 'Select an image or section on the page, then click a picture below.'}
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <Input.Search size="small" placeholder="Search images" allowClear onSearch={setSearch} />
        {can(PERM.MEDIA_UPLOAD) && (
          <Upload multiple accept="image/*" showUploadList={false} beforeUpload={(f, list) => { if (f === list[0]) upload(list); return false; }}>
            <Tooltip title="Upload images"><Button size="small" icon={<UploadOutlined />} loading={uploading} /></Tooltip>
          </Upload>
        )}
      </div>
      {!items ? (
        <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
      ) : items.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {items.map((m) => (
            <Tooltip key={m.id} title={m.prompt || m.name} mouseEnterDelay={0.6}>
              <button
                type="button"
                onClick={() => attach(m)}
                disabled={readOnly}
                style={{ padding: 0, border: '2px solid transparent', borderRadius: 8, overflow: 'hidden', aspectRatio: '4 / 3', cursor: readOnly ? 'default' : 'pointer', background: '#E2E8F0' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#004AAD')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
              >
                <img src={m.url} alt={m.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </button>
            </Tooltip>
          ))}
        </div>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={search ? 'No images match' : 'No images yet. Upload one, or ask the AI assistant to create one.'} />
      )}
      <Typography.Paragraph type="secondary" style={{ fontSize: 11.5, marginTop: 10 }}>
        Includes uploaded and AI-generated images. To create a new image, select a spot and ask the AI assistant, or double-click an image on the page.
      </Typography.Paragraph>
    </div>
  );
}
