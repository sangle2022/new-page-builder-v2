import React, { useEffect, useState } from 'react';
import { Select, Button, Space, Alert, Table, App, Spin, Typography, Tag } from 'antd';
import { Pages, CRM } from '../api/client';
import { TABLE_PAGINATION } from '../utils/table';

// Map one page's form fields to Zoho CRM Lead fields.
export default function CrmMapping({ page, formConfig }) {
  const { message } = App.useApp();
  const [status, setStatus] = useState(null);
  const [layouts, setLayouts] = useState([]);
  const [fields, setFields] = useState(null);
  const [sources, setSources] = useState({});
  const [mapping, setMapping] = useState({ layoutId: null, fields: {} });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    CRM.status()
      .then(async (s) => {
        setStatus(s);
        if (!s.connected) return;
        const [ls, src, current] = await Promise.all([CRM.layouts(), CRM.sources(), Pages.mapping(page.id)]);
        setLayouts(ls);
        setSources(src);
        const m = current || { layoutId: null, fields: {} };
        setMapping({ layoutId: m.layoutId || null, fields: m.fields || {} });
      })
      .catch((e) => message.error(e.message));
  }, [page.id, message]);

  useEffect(() => {
    if (!status || !status.connected) return;
    setFields(null);
    CRM.fields(mapping.layoutId || undefined)
      .then((f) => setFields(f.sort((a, b) => Number(b.mandatory) - Number(a.mandatory))))
      .catch((e) => {
        message.error(e.message);
        setFields([]);
      });
  }, [mapping.layoutId, status, message]);

  const autoMap = () => {
    const next = { ...mapping.fields };
    const find = (re) => ((formConfig || []).find((f) => re.test(f.name) || re.test(f.label.toLowerCase())) || {}).name;
    const guesses = {
      Last_Name: find(/name/), First_Name: find(/first/), Email: find(/email/), Mobile: find(/mobile|phone/), Phone: find(/phone/),
      City: find(/city/), State: find(/state/), Zip_Code: find(/pin|zip/), Description: find(/message|comment/), Company: find(/company/),
    };
    Object.entries(guesses).forEach(([k, v]) => {
      if (v && !next[k] && (fields || []).some((f) => f.apiName === k)) next[k] = v;
    });
    setMapping({ ...mapping, fields: next });
  };

  const save = async () => {
    setSaving(true);
    try {
      await Pages.saveMapping(page.id, mapping);
      message.success('CRM mapping saved');
    } catch (e) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!status) return <Spin />;
  if (!status.connected) {
    return <Alert type="info" showIcon message="Zoho CRM is not connected" description="Connect Zoho CRM above first. Leads are stored here either way." />;
  }
  const sourceOptions = [
    { label: 'Form fields', options: (formConfig || []).map((f) => ({ value: f.name, label: f.label })) },
    { label: 'Page and tracking', options: Object.entries(sources).map(([v, l]) => ({ value: v, label: l })) },
  ];
  return (
    <div>
      <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
        Map this page's form fields to Zoho CRM Lead fields. Unmapped essentials (name, email, mobile, lead source) are filled automatically.
      </Typography.Paragraph>
      <Space style={{ marginBottom: 12 }} wrap>
        <Select
          style={{ width: 240 }}
          placeholder="Default layout"
          allowClear
          value={mapping.layoutId || undefined}
          onChange={(v) => setMapping({ ...mapping, layoutId: v || null })}
          options={layouts.map((l) => ({ value: l.id, label: l.name }))}
        />
        <Button onClick={autoMap}>Auto-map</Button>
        <Button type="primary" loading={saving} onClick={save}>Save mapping</Button>
      </Space>
      <Table
        size="small"
        rowKey="apiName"
        loading={!fields}
        dataSource={fields || []}
        pagination={TABLE_PAGINATION}
        columns={[
          { title: 'CRM field', render: (_, f) => <span>{f.label} {f.mandatory && <Tag color="red" style={{ fontSize: 10 }}>required</Tag>}</span> },
          {
            title: 'Value from',
            width: 220,
            render: (_, f) => (
              <Select
                allowClear
                size="small"
                style={{ width: '100%' }}
                placeholder="—"
                value={mapping.fields[f.apiName]}
                options={sourceOptions}
                onChange={(v) => {
                  const next = { ...mapping.fields };
                  if (v) next[f.apiName] = v;
                  else delete next[f.apiName];
                  setMapping({ ...mapping, fields: next });
                }}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
