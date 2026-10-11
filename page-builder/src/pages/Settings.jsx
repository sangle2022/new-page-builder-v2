import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Card, Tabs, Button, Space, Tag, Descriptions, Alert, Form, Input, Table, Upload, Popconfirm, App, Result, List, Typography, Spin, Checkbox, Tooltip, Select, Empty,
} from 'antd';
import { CheckCircleTwoTone, CloseCircleTwoTone, ApiOutlined, UploadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { CRM, Admin, Pages } from '../api/client';
import CrmMapping from '../components/CrmMapping';
import { TABLE_PAGINATION } from '../utils/table';
import { useAuth, PERM } from '../context/AuthContext';

const okIcon = (ok) => (ok ? <CheckCircleTwoTone twoToneColor="#16A34A" /> : <CloseCircleTwoTone twoToneColor="#DC2626" />);

function CrmTab() {
  const { message } = App.useApp();
  const [params] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = () => CRM.status().then(setStatus).catch((e) => message.error(e.message));
  useEffect(() => {
    load();
    if (params.get('crm') === 'connected') message.success('Zoho CRM connected');
    if (params.get('crm') === 'error') message.error(params.get('message') || 'Could not connect Zoho CRM');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = async () => {
    setBusy(true);
    try {
      const { url } = await CRM.connect();
      window.location.href = url;
    } catch (e) {
      message.error(e.message);
      setBusy(false);
    }
  };
  const disconnect = async () => {
    await CRM.disconnect();
    message.success('Disconnected');
    load();
  };

  if (!status) return <Spin />;
  return (
    <div style={{ maxWidth: 900 }}>
      {!status.configured && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="CRM credentials are not configured"
          description="Create a Server-based Application in the Zoho API Console and set CRM_CLIENT_ID, CRM_CLIENT_SECRET, CRM_REDIRECT_URI (and CRM_ACCOUNTS_URL for your data centre) in the function's environment variables."
        />
      )}
      <Descriptions bordered column={1} size="middle">
        <Descriptions.Item label="Status">{status.connected ? <Tag color="green">Connected</Tag> : <Tag>Not connected</Tag>}</Descriptions.Item>
        {status.connected && <Descriptions.Item label="API domain">{status.apiDomain}</Descriptions.Item>}
        {status.connected && <Descriptions.Item label="Connected by">{status.connectedBy} · {status.connectedAt && dayjs(status.connectedAt).format('DD MMM YYYY')}</Descriptions.Item>}
        <Descriptions.Item label="Redirect URI">
          <Typography.Text copyable={!!status.redirectUri}>{status.redirectUri || 'Set CRM_REDIRECT_URI'}</Typography.Text>
        </Descriptions.Item>
      </Descriptions>
      <Space style={{ marginTop: 16 }}>
        {status.connected ? (
          <Popconfirm title="Disconnect Zoho CRM?" description="New leads will stop syncing until you connect again." onConfirm={disconnect}>
            <Button danger>Disconnect</Button>
          </Popconfirm>
        ) : (
          <Button type="primary" icon={<ApiOutlined />} disabled={!status.configured} loading={busy} onClick={connect}>Connect Zoho CRM</Button>
        )}
      </Space>
      {status.connected && <CrmFieldMapping />}
    </div>
  );
}

// Field mapping, chosen page by page. Uses the form fields of the page's
// last saved version.
function CrmFieldMapping() {
  const { message } = App.useApp();
  const [pages, setPages] = useState(null);
  const [pageId, setPageId] = useState(null);
  useEffect(() => {
    Pages.list()
      .then((list) => setPages(list.filter((p) => p.formConfig && p.formConfig.length)))
      .catch((e) => {
        message.error(e.message);
        setPages([]);
      });
  }, [message]);
  const page = pages && pages.find((p) => p.id === pageId);
  return (
    <Card size="small" title="Field mapping" style={{ marginTop: 20 }}>
      <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
        Choose a page, then match its form fields to Zoho CRM Lead fields. Leads sync automatically when submitted; failed syncs can be retried from the Leads screen.
      </Typography.Paragraph>
      <Select
        showSearch
        optionFilterProp="label"
        loading={!pages}
        style={{ width: 360, maxWidth: '100%', marginBottom: 16 }}
        placeholder="Select a page with a form"
        value={pageId || undefined}
        onChange={setPageId}
        options={(pages || []).map((p) => ({ value: p.id, label: `${p.name} (/${p.slug})` }))}
      />
      {page ? <CrmMapping key={page.id} page={page} formConfig={page.formConfig} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select a page to map its form" />}
    </Card>
  );
}

function CaptchaTab() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [hasSecret, setHasSecret] = useState(false);
  useEffect(() => {
    Admin.captcha()
      .then((d) => {
        form.setFieldsValue({ siteKey: d.siteKey });
        setHasSecret(d.hasSecret);
      })
      .catch((e) => message.error(e.message));
  }, [form, message]);
  const save = async () => {
    const v = await form.validateFields();
    await Admin.saveCaptcha(v);
    message.success('Saved');
    if (v.secretKey) setHasSecret(true);
    form.setFieldsValue({ secretKey: '' });
  };
  return (
    <Form form={form} layout="vertical" style={{ maxWidth: 560 }}>
      <Alert type="info" showIcon style={{ marginBottom: 16 }} message="Google reCAPTCHA v2 (checkbox). Turn it on per page in Page settings. The secret is checked on the server and never sent to the browser." />
      <Form.Item name="siteKey" label="Site key" rules={[{ required: true }]}><Input /></Form.Item>
      <Form.Item name="secretKey" label="Secret key" extra={hasSecret ? 'A secret is stored. Leave empty to keep it.' : undefined}><Input.Password placeholder={hasSecret ? '••••••••' : ''} /></Form.Item>
      <Button type="primary" onClick={save}>Save</Button>
    </Form>
  );
}

function PincodesTab() {
  const { message } = App.useApp();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();
  const load = () => Admin.pincodes(search).then(setRows).catch((e) => message.error(e.message));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const importCsv = async (file) => {
    const text = await file.text();
    const [head, ...lines] = text.split(/\r?\n/).filter(Boolean);
    const cols = head.split(',').map((c) => c.trim().toLowerCase());
    const data = lines.map((l) => Object.fromEntries(l.split(',').map((v, i) => [cols[i], v.trim()])));
    try {
      const r = await Admin.importPincodes(data);
      message.success(`Imported ${r.inserted} rows${r.skipped ? `, skipped ${r.skipped}` : ''}`);
      load();
    } catch (e) {
      message.error(e.message);
    }
    return false;
  };

  return (
    <div>
      <Space wrap style={{ marginBottom: 14 }}>
        <Input.Search placeholder="Search pincode" allowClear onSearch={setSearch} style={{ width: 200 }} />
        <Upload accept=".csv" showUploadList={false} beforeUpload={importCsv}>
          <Button icon={<UploadOutlined />}>Import CSV (pincode, area, city, state, country)</Button>
        </Upload>
      </Space>
      <Form form={form} layout="inline" style={{ marginBottom: 14 }} onFinish={(v) => Admin.savePincode(v).then(() => { form.resetFields(); load(); message.success('Added'); }).catch((e) => message.error(e.message))}>
        <Form.Item name="pincode" rules={[{ required: true, pattern: /^\d{6}$/, message: '6 digits' }]}><Input placeholder="Pincode" style={{ width: 110 }} /></Form.Item>
        <Form.Item name="area"><Input placeholder="Area" /></Form.Item>
        <Form.Item name="city"><Input placeholder="City" /></Form.Item>
        <Form.Item name="state"><Input placeholder="State" /></Form.Item>
        <Button htmlType="submit" icon={<PlusOutlined />}>Add</Button>
      </Form>
      <Table
        size="small"
        rowKey="id"
        dataSource={rows}
        pagination={TABLE_PAGINATION}
        columns={[
          { title: 'Pincode', dataIndex: 'pincode' },
          { title: 'Area', dataIndex: 'area' },
          { title: 'City', dataIndex: 'city' },
          { title: 'State', dataIndex: 'state' },
          { title: '', width: 50, render: (_, r) => <Popconfirm title="Delete?" onConfirm={() => Admin.deletePincode(r.id).then(load)}><Button size="small" type="text" danger icon={<DeleteOutlined />} /></Popconfirm> },
        ]}
      />
    </div>
  );
}

function TeamTab() {
  const { can } = useAuth();
  const [users, setUsers] = useState(null);
  const [roles, setRoles] = useState(null);
  useEffect(() => {
    Admin.roles().then(setRoles).catch(() => {});
    if (can(PERM.SETTINGS_MANAGE)) Admin.users().then(setUsers).catch(() => setUsers([]));
  }, [can]);
  if (!roles) return <Spin />;
  const roleKeys = Object.keys(roles.matrix);
  return (
    <div>
      {users && (
        <Card size="small" title="Team" style={{ marginBottom: 16 }}>
          <Table
            size="small"
            rowKey="id"
            dataSource={users}
            pagination={false}
            columns={[
              { title: 'Name', dataIndex: 'name' },
              { title: 'Email', dataIndex: 'email' },
              { title: 'Catalyst role', dataIndex: 'catalystRole' },
              { title: 'App role', dataIndex: 'appRole', render: (r) => <Tag color="blue">{r}</Tag> },
              { title: 'Status', dataIndex: 'status' },
            ]}
          />
        </Card>
      )}
      <RoleMatrix roles={roles} roleKeys={roleKeys} editable={can(PERM.SETTINGS_MANAGE)} onSaved={setRoles} />
    </div>
  );
}

// Who-can-do-what grid. Admins can tick/untick permissions for every role
// except admin (always full access, so nobody can lock themselves out).
function RoleMatrix({ roles, roleKeys, editable, onSaved }) {
  const { message } = App.useApp();
  const { reload } = useAuth();
  const [draft, setDraft] = useState(roles.matrix);
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(roles.matrix), [roles]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(roles.matrix);
  const toggle = (role, perm, on) => {
    const current = draft[role] || [];
    setDraft({ ...draft, [role]: on ? [...current, perm] : current.filter((p) => p !== perm) });
  };
  const persist = async (fn, msg) => {
    setSaving(true);
    try {
      onSaved(await fn());
      message.success(msg);
      reload(); // refresh the signed-in user's own permissions
    } catch (e) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      size="small"
      title="What each role can do"
      extra={
        editable && (
          <Space>
            <Popconfirm title="Restore the default permissions for all roles?" onConfirm={() => persist(() => Admin.resetRoles(), 'Default permissions restored')}>
              <Button size="small" disabled={saving}>Reset to defaults</Button>
            </Popconfirm>
            <Button size="small" onClick={() => setDraft(roles.matrix)} disabled={!dirty || saving}>Discard</Button>
            <Button size="small" type="primary" loading={saving} disabled={!dirty} onClick={() => persist(() => Admin.saveRoles(draft), 'Permissions saved. They apply within a minute.')}>
              Save permissions
            </Button>
          </Space>
        )
      }
    >
      {editable && (
        <Typography.Paragraph type="secondary" style={{ fontSize: 12.5 }}>
          Tick what each role may do. The admin role always has full access. Changes apply to everyone with that role within about a minute.
        </Typography.Paragraph>
      )}
      <Table
        size="small"
        rowKey="key"
        pagination={false}
        scroll={{ x: 640 }}
        dataSource={roles.permissions}
        columns={[
          { title: 'Permission', dataIndex: 'label' },
          ...roleKeys.map((r) => ({
            title: <span style={{ textTransform: 'capitalize' }}>{r}</span>,
            align: 'center',
            render: (_, p) => {
              const on = (draft[r] || []).includes(p.key);
              if (editable && (roles.editableRoles || []).includes(r)) {
                const changed = on !== (roles.defaults[r] || []).includes(p.key);
                return (
                  <Tooltip title={changed ? 'Changed from the default' : ''}>
                    <Checkbox checked={on} onChange={(e) => toggle(r, p.key, e.target.checked)} style={changed ? { outline: '2px solid #FBBF24', outlineOffset: 2, borderRadius: 3 } : undefined} />
                  </Tooltip>
                );
              }
              return on ? <CheckCircleTwoTone twoToneColor="#16A34A" /> : <span className="pb-muted">—</span>;
            },
          })),
        ]}
      />
    </Card>
  );
}

function SystemTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const run = () => {
    setLoading(true);
    Admin.setupCheck()
      .then(setData)
      .finally(() => setLoading(false));
  };
  useEffect(run, []);
  if (!data) return <Spin />;
  return (
    <div>
      {data.ok ? (
        <Alert type="success" showIcon message="Everything is set up" style={{ marginBottom: 16 }} />
      ) : (
        <Alert type="warning" showIcon style={{ marginBottom: 16 }} message="Setup needs attention" description={<ul style={{ margin: 0, paddingLeft: 18 }}>{data.problems.map((p) => <li key={p}>{p}</li>)}</ul>} />
      )}
      <Button onClick={run} loading={loading} style={{ marginBottom: 16 }}>Run check again</Button>
      <Card size="small" title="Data store tables" style={{ marginBottom: 16 }}>
        <List
          size="small"
          dataSource={data.tables}
          renderItem={(t) => (
            <List.Item>
              <Space>{okIcon(t.exists && !t.missing.length && !(t.wrongUnique || []).length && !(t.mandatory || []).length)}<b>{t.table}</b></Space>
              <span className="pb-muted" style={{ fontSize: 12 }}>{!t.exists ? 'missing table' : [t.missing.length && `missing: ${t.missing.join(', ')}`, (t.wrongUnique || []).length && `turn off Is Unique: ${t.wrongUnique.join(', ')}`, (t.mandatory || []).length && `turn off Is Mandatory: ${t.mandatory.join(', ')}`].filter(Boolean).join(' · ') || 'ok'}</span>
            </List.Item>
          )}
        />
      </Card>
      <Card size="small" title="Storage and configuration">
        <Descriptions column={1} size="small">
          {data.buckets.map((b) => <Descriptions.Item key={b.bucket} label={`Bucket ${b.bucket}`}>{okIcon(b.ok)}</Descriptions.Item>)}
          <Descriptions.Item label="Gemini AI">{okIcon(data.env.gemini)}</Descriptions.Item>
          <Descriptions.Item label="Signing secret">{okIcon(data.env.signingSecret)}</Descriptions.Item>
          <Descriptions.Item label="Zoho CRM">{data.crm.connected ? 'connected' : data.env.crmConfigured ? 'configured, not connected' : 'not configured'}</Descriptions.Item>
          <Descriptions.Item label="reCAPTCHA">{okIcon(data.captcha.configured)}</Descriptions.Item>
          <Descriptions.Item label="OTP provider">{data.env.otpProvider}</Descriptions.Item>
          <Descriptions.Item label="Approval required">{data.env.requireApproval ? 'yes' : 'no'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}

export default function Settings() {
  const { can } = useAuth();
  const [params, setParams] = useSearchParams();
  const tabs = [
    can(PERM.CRM_MANAGE) && { key: 'crm', label: 'Zoho CRM', children: <CrmTab /> },
    can(PERM.SETTINGS_MANAGE) && { key: 'captcha', label: 'reCAPTCHA', children: <CaptchaTab /> },
    can(PERM.SETTINGS_MANAGE) && { key: 'pincodes', label: 'Pincodes', children: <PincodesTab /> },
    { key: 'team', label: 'Team & roles', children: <TeamTab /> },
    can(PERM.SETTINGS_MANAGE) && { key: 'system', label: 'System check', children: <SystemTab /> },
  ].filter(Boolean);
  if (!tabs.length) return <Result status="403" title="No settings available for your role" />;
  const active = tabs.some((t) => t.key === params.get('tab')) ? params.get('tab') : tabs[0].key;
  return (
    <div>
      <div className="pb-page-head">
        <div>
          <h1>Settings</h1>
          <p>Integrations, security and team access.</p>
        </div>
      </div>
      <Card>
        <Tabs activeKey={active} onChange={(k) => setParams({ tab: k })} items={tabs} />
      </Card>
    </div>
  );
}
