import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Tag, Button, Space, Empty, Spin, Modal, App, Popconfirm, Typography } from 'antd';
import { EyeOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { Templates, Pages, FUNCTION_BASE } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { useAuth, PERM } from '../context/AuthContext';
import TemplateThumb from '../components/TemplateThumb';
import { loadClassicTemplates, classicPreviewDoc, isClassicKey, getClassicTemplate } from '../builder/classic/catalog';

// Renders a template's HTML in an isolated iframe for preview.
function TemplatePreview({ tpl, onClose }) {
  const [html, setHtml] = useState(null);
  useEffect(() => {
    if (!tpl) return;
    setHtml(null);
    if (tpl.kind === 'classic') {
      setHtml(classicPreviewDoc(tpl.html));
      return;
    }
    Templates.get(tpl.key).then((t) => {
      const doc = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="${FUNCTION_BASE}/api/public/page-base.css"><style>${t.css || ''}</style></head><body>${t.html}</body></html>`;
      setHtml(doc);
    });
  }, [tpl]);
  return (
    <Modal open={!!tpl} onCancel={onClose} footer={null} width="90vw" style={{ top: 20 }} title={tpl && tpl.name} destroyOnClose>
      {!html ? <Spin /> : <iframe title="Template preview" srcDoc={html} style={{ width: '100%', height: '78vh', border: '1px solid #E2E8F0', borderRadius: 8 }} />}
    </Modal>
  );
}

export default function TemplatesPage() {
  const { can } = useAuth();
  const { message } = App.useApp();
  const [data, setData] = useState(null);
  const [category, setCategory] = useState('All');
  const [preview, setPreview] = useState(null);
  const [creating, setCreating] = useState(null);
  const navigate = useNavigate();

  // "Use" creates the page right away (named after the template, with a free
  // URL) and opens it in the editor. Name and URL can be changed there.
  const createFromTemplate = async (t) => {
    if (creating) return;
    setCreating(t.key);
    try {
      const classic = isClassicKey(t.key) ? await getClassicTemplate(t.key) : null;
      const page = await Pages.create({ mode: 'template', name: t.name, templateKey: t.key, html: classic ? classic.html : undefined });
      window.dispatchEvent(new CustomEvent('pb:pages-changed'));
      navigate(`/builder/${page.id}?images=1`);
    } catch (e) {
      message.error(e.message);
      setCreating(null);
    }
  };

  const load = () =>
    Promise.all([Templates.list(), loadClassicTemplates().catch(() => [])])
      .then(([d, classic]) => setData({ ...d, categories: [...d.categories, 'Classic'], templates: [...d.templates, ...classic] }))
      .catch((e) => message.error(e.message));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) return <Card loading />;
  const list = data.templates.filter((t) => category === 'All' || t.category === category || (category === 'Saved' && t.kind === 'custom'));

  return (
    <div>
      <div className="pb-page-head">
        <div>
          <h1>Templates</h1>
          <p>Ready-made, fully editable layouts. Save any page as a template from its menu.</p>
        </div>
      </div>
      <Space size={[6, 6]} wrap style={{ marginBottom: 16 }}>
        {['All', ...data.categories, 'Saved'].map((c) => (
          <Tag.CheckableTag key={c} checked={category === c} onChange={() => setCategory(c)} style={{ padding: '4px 12px', border: '1px solid #E2E8F0' }}>
            {c}
          </Tag.CheckableTag>
        ))}
      </Space>
      {list.length ? (
        <Row gutter={[16, 16]}>
          {list.map((t) => (
            <Col xs={24} sm={12} lg={8} xxl={6} key={t.key}>
              <Card
                hoverable
                cover={<TemplateThumb tpl={t} />}
                actions={[
                  <Button key="p" type="text" icon={<EyeOutlined />} onClick={() => setPreview(t)}>Preview</Button>,
                  can(PERM.PAGE_CREATE) && <Button key="u" type="text" icon={<PlusOutlined />} loading={creating === t.key} disabled={!!creating && creating !== t.key} onClick={() => createFromTemplate(t)}>Use</Button>,
                  t.kind === 'custom' && can(PERM.TEMPLATE_MANAGE) && (
                    <Popconfirm key="d" title="Delete this template?" onConfirm={() => Templates.remove(t.id).then(load).catch((e) => message.error(e.message))}>
                      <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  ),
                ].filter(Boolean)}
              >
                <Card.Meta
                  title={<span>{t.name} {t.kind === 'custom' && <Tag>Saved</Tag>}{t.kind === 'classic' && <Tag>Classic</Tag>}</span>}
                  description={<Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ margin: 0 }}>{t.description || `By ${t.createdBy}`}</Typography.Paragraph>}
                />
                {t.sectionTypes && (
                  <div style={{ marginTop: 10 }}>
                    {t.sectionTypes.slice(0, 6).map((s, i) => <Tag key={`${s}${i}`} bordered={false} style={{ fontSize: 11 }}>{s.replace('_', ' ')}</Tag>)}
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description="No templates in this category" />
      )}
      <TemplatePreview tpl={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
