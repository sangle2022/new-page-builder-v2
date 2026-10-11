import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Row, Col, Input, Form, Select, Switch, ColorPicker, Button, Space, Tag, Alert, Spin, Typography, App } from 'antd';
import { FileAddOutlined, AppstoreOutlined, ThunderboltOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Pages, Templates, AI } from '../api/client';
import { useAuth, PERM } from '../context/AuthContext';
import { loadClassicTemplates, getClassicTemplate, isClassicKey } from '../builder/classic/catalog';
import TemplateThumb from './TemplateThumb';

const INDUSTRIES = [
  'Real Estate', 'Product Launch', 'Event Registration', 'Webinar', 'Corporate', 'Healthcare', 'Education',
  'Lead Generation', 'Service Business', 'Promotional Campaign', 'Financial Services', 'Automobile', 'Hospitality', 'Retail',
];
const GOALS = ['Collect leads / enquiries', 'Event or webinar registrations', 'Book appointments / site visits', 'Pre-launch waitlist', 'Promote an offer', 'Download a brochure'];
const TONES = ['Professional', 'Friendly', 'Premium / luxury', 'Bold and energetic', 'Trustworthy and calm', 'Playful'];
const LANGUAGES = ['English', 'Hindi', 'Hinglish', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Gujarati', 'Malayalam'];
// Art directions the AI follows (layouts, mode, fonts, shapes). Keys match
// the server's designStyles.js.
const DESIGN_STYLES = [
  { value: 'auto', label: 'Surprise me', hint: 'A different style every time' },
  { value: 'saas-dark', label: 'SaaS dark', hint: 'Dark, glowing, product showcase' },
  { value: 'editorial', label: 'Editorial', hint: 'Serif headlines, airy, story-led' },
  { value: 'bold-gradient', label: 'Bold gradient', hint: 'Loud gradients, form in hero' },
  { value: 'minimal', label: 'Clean minimal', hint: 'Oversized type, lots of white space' },
  { value: 'corporate', label: 'Corporate trust', hint: 'Banks, insurance, B2B' },
  { value: 'playful', label: 'Playful', hint: 'Rounded, bright, friendly' },
  { value: 'luxury', label: 'Luxury', hint: 'Dark and gold, full-bleed photos' },
  { value: 'glass', label: 'Glass & glow', hint: 'Frosted cards on deep gradients' },
];
const SECTIONS = ['navbar', 'hero', 'features', 'media_text', 'stats', 'steps', 'testimonials', 'pricing', 'faq', 'cta', 'gallery', 'team', 'logos', 'lead_form', 'location', 'video', 'countdown', 'footer'];
const EXAMPLES = [
  'Landing page for a 2-day digital marketing workshop in Bengaluru for small business owners, early-bird price ₹2,999.',
  'Personal loan offer page for salaried professionals, instant approval up to ₹15 lakh, two-step form with OTP.',
  'Dental clinic in Pune offering painless root canal and implants, book a free consultation.',
];

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);

export default function CreatePageModal({ open, onClose, initialMode, initialTemplate }) {
  const { can, app } = useAuth();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [templates, setTemplates] = useState(null);
  const [category, setCategory] = useState('All');
  const [templateKey, setTemplateKey] = useState(null);
  const [busy, setBusy] = useState(false);
  // The name follows the chosen template until the user types their own.
  const nameTouched = useRef(false);
  const prefilled = useRef(false);
  const [form] = Form.useForm();
  const [aiForm] = Form.useForm();

  useEffect(() => {
    if (!open) return;
    setMode(initialMode || null);
    setTemplateKey(initialTemplate || null);
    nameTouched.current = false;
    prefilled.current = false;
    form.resetFields();
    aiForm.resetFields();
  }, [open, initialMode, initialTemplate, form, aiForm]);

  useEffect(() => {
    if (open && mode === 'template' && !templates) {
      Promise.all([Templates.list(), loadClassicTemplates().catch(() => [])])
        .then(([data, classic]) => setTemplates({ ...data, categories: [...data.categories, 'Classic'], templates: [...data.templates, ...classic] }))
        .catch((e) => message.error(e.message));
    }
  }, [open, mode, templates, message]);

  // Opened from a template's "Use" button: show that template's category and
  // suggest a page name.
  useEffect(() => {
    if (!open || !templates || !initialTemplate || prefilled.current) return;
    const t = templates.templates.find((x) => x.key === initialTemplate);
    if (!t) return;
    prefilled.current = true;
    setCategory(t.category || 'All');
    form.setFieldsValue({ name: t.name, slug: slugify(t.name) });
  }, [open, templates, initialTemplate, form]);

  const visibleTemplates = useMemo(() => {
    if (!templates) return [];
    return templates.templates.filter((t) => category === 'All' || t.category === category);
  }, [templates, category]);

  const finish = (page, extra = '') => {
    onClose();
    navigate(`/builder/${page.id}${extra}`);
    window.dispatchEvent(new CustomEvent('pb:pages-changed'));
  };

  const createBlankOrTemplate = async () => {
    const v = await form.validateFields();
    if (mode === 'template' && !templateKey) {
      message.warning('Choose a template');
      return;
    }
    setBusy(true);
    try {
      const classic = mode === 'template' && isClassicKey(templateKey) ? await getClassicTemplate(templateKey) : null;
      const page = await Pages.create({ mode, name: v.name, slug: v.slug || undefined, templateKey, html: classic ? classic.html : undefined });
      message.success('Page created');
      finish(page, mode === 'template' ? '?images=1' : '');
    } catch (e) {
      message.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const createWithAi = async () => {
    const v = await aiForm.validateFields();
    setBusy(true);
    try {
      const color = v.primaryColor ? (typeof v.primaryColor === 'string' ? v.primaryColor : v.primaryColor.toHexString()) : undefined;
      // Generate first (may run as a background job), then create the page.
      const generated = await AI.generatePage({ ...v, primaryColor: color, name: undefined });
      const page = await Pages.create({ mode: 'ai', name: v.name || undefined, generated });
      message.success('Your page is ready. Images are generated next.');
      finish(page, '?images=1&ai=1');
    } catch (e) {
      message.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const choice = (key, icon, title, text, disabled) => (
    <Col xs={24} md={8} key={key}>
      <div
        className={`pb-choice${mode === key ? ' is-active' : ''}`}
        style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        onClick={() => !disabled && setMode(key)}
        role="button"
        tabIndex={0}
      >
        <div style={{ fontSize: 26, color: '#004AAD' }}>{icon}</div>
        <h4>{title}</h4>
        <div className="pb-muted" style={{ fontSize: 13 }}>{text}</div>
      </div>
    </Col>
  );

  const aiAllowed = can(PERM.AI_USE) && app.aiEnabled;

  let body;
  if (!mode) {
    body = (
      <Row gutter={[14, 14]}>
        {choice('blank', <FileAddOutlined />, 'Blank page', 'Start from an empty canvas and drag in sections.')}
        {choice('template', <AppstoreOutlined />, 'From a template', 'Pick one of the ready-made layouts for your industry.')}
        {choice(
          'ai',
          <ThunderboltOutlined />,
          'Generate with AI',
          aiAllowed ? 'Describe the page. AI writes the copy, picks colours and builds the form.' : 'AI is not available for your account yet.',
          !aiAllowed,
        )}
      </Row>
    );
  } else if (mode === 'ai') {
    body = (
      <Spin spinning={busy} tip="Designing your page… this takes 20-40 seconds">
        <Form form={aiForm} layout="vertical" requiredMark={false} initialValues={{ language: 'English', tone: 'Professional', goal: GOALS[0], designStyle: 'auto' }}>
          <Form.Item name="prompt" label="Describe your page" rules={[{ required: true, min: 10, message: 'Write a sentence or two about the page' }]}>
            <Input.TextArea rows={4} placeholder="What are you promoting, for whom, and what should visitors do?" showCount maxLength={4000} />
          </Form.Item>
          <div style={{ marginTop: -12, marginBottom: 12 }}>
            <Space size={[6, 6]} wrap>
              {EXAMPLES.map((ex) => (
                <Tag key={ex} style={{ cursor: 'pointer', whiteSpace: 'normal' }} onClick={() => aiForm.setFieldValue('prompt', ex)}>
                  {ex.slice(0, 58)}…
                </Tag>
              ))}
            </Space>
          </div>
          <Row gutter={12}>
            <Col xs={24} md={12}><Form.Item name="businessName" label="Brand / business name"><Input placeholder="Optional" /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="industry" label="Industry"><Select allowClear showSearch options={INDUSTRIES.map((v) => ({ value: v, label: v }))} placeholder="Optional" /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="goal" label="Goal"><Select options={GOALS.map((v) => ({ value: v, label: v }))} /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="audience" label="Target audience"><Input placeholder="e.g. first-time home buyers aged 28-40" /></Form.Item></Col>
            <Col xs={24}>
              <Form.Item name="designStyle" label="Design style">
                <Select
                  options={DESIGN_STYLES.map((d) => ({ value: d.value, label: <span>{d.label} <span className="pb-muted" style={{ fontSize: 12 }}>· {d.hint}</span></span> }))}
                />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}><Form.Item name="tone" label="Tone"><Select options={TONES.map((v) => ({ value: v, label: v }))} /></Form.Item></Col>
            <Col xs={12} md={8}><Form.Item name="language" label="Language"><Select options={LANGUAGES.map((v) => ({ value: v, label: v }))} /></Form.Item></Col>
            <Col xs={12} md={8}><Form.Item name="primaryColor" label="Brand colour"><ColorPicker showText allowClear format="hex" /></Form.Item></Col>
            <Col xs={24}><Form.Item name="sections" label="Sections to include (optional, AI decides otherwise)"><Select mode="multiple" allowClear options={SECTIONS.map((v) => ({ value: v, label: v.replace('_', ' ') }))} /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="formFields" label="Form should collect"><Input placeholder="e.g. name, mobile, city, budget" /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="name" label="Page name (internal)"><Input placeholder="AI suggests one if empty" /></Form.Item></Col>
            <Col xs={12} md={6}><Form.Item name="multiStep" label="Two-step form" valuePropName="checked"><Switch /></Form.Item></Col>
            <Col xs={12} md={6}><Form.Item name="otp" label="OTP on mobile" valuePropName="checked"><Switch /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item name="offerEndsOn" label="Offer ends on (adds countdown)"><Input type="date" /></Form.Item></Col>
          </Row>
          <Alert type="info" showIcon message="Everything AI creates stays fully editable. You can change any text, image or section afterwards, by hand or by asking the AI." />
        </Form>
      </Spin>
    );
  } else {
    body = (
      <Form form={form} layout="vertical" requiredMark={false}>
        {mode === 'template' && (
          <>
            <Space size={[6, 6]} wrap style={{ marginBottom: 12 }}>
              {['All', ...((templates && templates.categories) || []), 'Saved'].map((c) => (
                <Tag.CheckableTag key={c} checked={category === c} onChange={() => setCategory(c)}>
                  {c}
                </Tag.CheckableTag>
              ))}
            </Space>
            {!templates ? (
              <Spin />
            ) : (
              <Row gutter={[12, 12]} style={{ maxHeight: 'max(260px, calc(100vh - 480px))', overflowY: 'auto', overflowX: 'hidden', marginBottom: 16, paddingRight: 4 }}>
                {visibleTemplates.map((t) => (
                  <Col xs={12} md={8} key={t.key}>
                    <div
                      className={`pb-template-tile${templateKey === t.key ? ' is-active' : ''}`}
                      onClick={() => {
                        setTemplateKey(t.key);
                        if (!nameTouched.current) form.setFieldsValue({ name: t.name, slug: slugify(t.name) });
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="pb-template-thumb">
                        <TemplateThumb tpl={t} height={120} />
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div>
                      <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ fontSize: 12, margin: 0 }}>
                        {t.description}
                      </Typography.Paragraph>
                    </div>
                  </Col>
                ))}
                {!visibleTemplates.length && <Col span={24} className="pb-muted">No templates in this category yet.</Col>}
              </Row>
            )}
          </>
        )}
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item name="name" label="Page name" rules={[{ required: true, message: 'Name the page' }]}>
              <Input placeholder="e.g. Diwali home loan offer" onChange={(e) => {
                  nameTouched.current = true;
                  form.setFieldsValue({ slug: slugify(e.target.value) });
                }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="slug"
              label="Page URL"
              extra="Lowercase words separated by hyphens"
              rules={[{ pattern: /^[a-z0-9-]*$/, message: 'Use lowercase letters, numbers and hyphens' }]}
            >
              <Input addonBefore={`${app.publicBase}`} placeholder="auto" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    );
  }

  const footer = mode ? (
    <Space>
      <Button icon={<ArrowLeftOutlined />} onClick={() => setMode(null)} disabled={busy}>
        Back
      </Button>
      <Button type="primary" loading={busy} onClick={mode === 'ai' ? createWithAi : createBlankOrTemplate} icon={mode === 'ai' ? <ThunderboltOutlined /> : null}>
        {mode === 'ai' ? 'Generate page' : 'Create page'}
      </Button>
    </Space>
  ) : null;

  return (
    <Modal
      title={mode === 'ai' ? 'Generate a page with AI' : mode === 'template' ? 'Start from a template' : mode === 'blank' ? 'New blank page' : 'Create a new page'}
      open={open}
      onCancel={busy ? undefined : onClose}
      footer={footer}
      width={mode === 'template' || mode === 'ai' ? 'min(980px, 94vw)' : 720}
      centered
      styles={{ body: { maxHeight: 'calc(100vh - 190px)', overflowY: 'auto', overflowX: 'hidden' } }}
      destroyOnClose
      maskClosable={!busy}
    >
      {body}
    </Modal>
  );
}
