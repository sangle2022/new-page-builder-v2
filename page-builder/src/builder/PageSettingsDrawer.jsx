import React, { useEffect, useState } from 'react';
import {
  Drawer, Tabs, Form, Input, InputNumber, Switch, DatePicker, Button, Space, ColorPicker, Select, Alert, App, Typography,
} from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Pages, AI } from '../api/client';
import { FONTS, DEFAULT_THEME } from './grapes/setupEditor';
import { useAuth, PERM } from '../context/AuthContext';

const hex = (v) => (v && typeof v !== 'string' ? v.toHexString() : v);

export default function PageSettingsDrawer({ open, onClose, page, theme, onTheme, onSaved, getHtml, formConfig, readOnly }) {
  const { message } = App.useApp();
  const { can, app } = useAuth();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [seoBusy, setSeoBusy] = useState(false);

  useEffect(() => {
    if (!open || !page) return;
    const s = page.settings || {};
    form.setFieldsValue({
      name: page.name,
      title: page.title,
      description: page.description,
      slug: page.slug,
      activeTill: s.activeTill ? dayjs(s.activeTill) : null,
      responseLimit: s.responseLimit || 0,
      closedMessage: s.closedMessage,
      dedupe: s.dedupe !== false,
      captcha: !!s.captcha,
      partialCapture: s.partialCapture !== false,
      pixelId: s.pixelId || '',
      ogImage: (s.seo && s.seo.ogImage) || '',
      noIndex: !!(s.seo && s.seo.noIndex),
      animations: s.animations !== false,
    });
  }, [open, page, form]);

  const save = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      const updated = await Pages.update(page.id, {
        name: v.name,
        title: v.title,
        description: v.description,
        slug: v.slug,
        settings: {
          activeTill: v.activeTill ? v.activeTill.format('YYYY-MM-DD') : null,
          responseLimit: v.responseLimit || 0,
          closedMessage: v.closedMessage,
          dedupe: v.dedupe,
          captcha: v.captcha,
          partialCapture: v.partialCapture,
          pixelId: v.pixelId || '',
          animations: v.animations,
          theme,
          seo: { description: v.description, ogImage: v.ogImage || '', noIndex: v.noIndex },
        },
      });
      message.success('Settings saved');
      onSaved(updated);
    } catch (e) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const seo = async () => {
    setSeoBusy(true);
    try {
      const r = await AI.seo({ html: getHtml(), name: form.getFieldValue('name'), pageId: page.id });
      form.setFieldsValue({ title: r.title, description: r.description, ...(page.isLive ? {} : { slug: r.slug }) });
      message.success('SEO suggestions filled in. Review and save.');
    } catch (e) {
      message.error(e.message);
    } finally {
      setSeoBusy(false);
    }
  };

  const themeField = (key, label) => (
    <Form.Item label={label}>
      <ColorPicker value={theme[key] || DEFAULT_THEME[key]} showText format="hex" disabled={readOnly} onChangeComplete={(c) => onTheme({ ...theme, [key]: hex(c) })} />
    </Form.Item>
  );

  if (!page) return null;
  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={560}
      title="Page settings"
      extra={<Button type="primary" loading={saving} disabled={readOnly} onClick={save}>Save settings</Button>}
      destroyOnClose={false}
    >
      <Form form={form} layout="vertical" requiredMark={false} disabled={readOnly}>
        <Tabs
          items={[
            {
              key: 'general',
              label: 'General & SEO',
              forceRender: true,
              children: (
                <>
                  <Form.Item name="name" label="Page name" rules={[{ required: true }]}><Input /></Form.Item>
                  <Form.Item
                    name="slug"
                    label="URL"
                    extra={page.isLive ? 'Unpublish the page to change its URL.' : 'Lowercase letters, numbers and hyphens'}
                    rules={[{ required: true, pattern: /^[a-z0-9-]+$/, message: 'Lowercase letters, numbers and hyphens only' }]}
                  >
                    <Input addonBefore={app.publicBase} disabled={page.isLive || readOnly} />
                  </Form.Item>
                  {can(PERM.AI_USE) && app.aiEnabled && (
                    <Button icon={<ThunderboltOutlined />} loading={seoBusy} onClick={seo} style={{ marginBottom: 16 }}>Write SEO title & description with AI</Button>
                  )}
                  <Form.Item name="title" label="SEO title" extra="Shown in the browser tab and search results (≈60 characters)"><Input showCount maxLength={120} /></Form.Item>
                  <Form.Item name="description" label="Meta description" extra="≈155 characters, with a call to action"><Input.TextArea rows={3} showCount maxLength={300} /></Form.Item>
                  <Form.Item name="ogImage" label="Social share image URL"><Input placeholder="https://…" /></Form.Item>
                  <Form.Item name="noIndex" label="Hide from search engines" valuePropName="checked"><Switch /></Form.Item>
                </>
              ),
            },
            {
              key: 'leads',
              label: 'Leads & rules',
              forceRender: true,
              children: (
                <>
                  <Form.Item name="activeTill" label="Accept leads until" extra="After this date the form shows the closed message."><DatePicker style={{ width: '100%' }} /></Form.Item>
                  <Form.Item name="responseLimit" label="Maximum responses" extra="0 = unlimited"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
                  <Form.Item name="closedMessage" label="Message when closed"><Input.TextArea rows={2} /></Form.Item>
                  <Form.Item name="dedupe" label="Merge repeat submissions (same phone/email within 24h)" valuePropName="checked"><Switch /></Form.Item>
                  <Form.Item name="partialCapture" label="Save multi-step leads after each step" valuePropName="checked"><Switch /></Form.Item>
                  <Form.Item name="captcha" label="Require reCAPTCHA" valuePropName="checked" extra="Keys are set in Settings → reCAPTCHA."><Switch /></Form.Item>
                  <Form.Item name="pixelId" label="Meta (Facebook) Pixel ID" extra="Leave empty to use the default pixel, if one is configured."><Input placeholder="e.g. 123456789012345" /></Form.Item>
                  <Alert type="info" showIcon message="OTP verification and form fields are set on the form itself: select a field in the canvas and use its settings." />
                </>
              ),
            },
            {
              key: 'theme',
              label: 'Theme',
              forceRender: true,
              children: (
                <>
                  <Space size={24} wrap>
                    {themeField('primary', 'Brand colour')}
                    {themeField('accent', 'Accent')}
                    {themeField('dark', 'Dark')}
                  </Space>
                  <Form.Item label="Body font">
                    <Select value={theme.font || 'Inter'} onChange={(v) => onTheme({ ...theme, font: v })} options={Object.keys(FONTS).map((f) => ({ value: f, label: f }))} />
                  </Form.Item>
                  <Form.Item label="Heading font">
                    <Select value={theme.headingFont || theme.font || 'Inter'} onChange={(v) => onTheme({ ...theme, headingFont: v })} options={Object.keys(FONTS).map((f) => ({ value: f, label: f }))} />
                  </Form.Item>
                  <Form.Item name="animations" label="Scroll animations on the published page" valuePropName="checked" extra="Sections fade and slide in as visitors scroll.">
                    <Switch />
                  </Form.Item>
                  <Form.Item label="Corner radius">
                    <Select value={theme.radius || '14px'} onChange={(v) => onTheme({ ...theme, radius: v })} options={['0px', '6px', '10px', '14px', '20px', '28px'].map((r) => ({ value: r, label: r }))} />
                  </Form.Item>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>Theme changes show immediately and are saved with the page.</Typography.Text>
                </>
              ),
            },
          ].filter(Boolean)}
        />
      </Form>
    </Drawer>
  );
}
