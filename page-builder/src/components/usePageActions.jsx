import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Input, Form } from 'antd';
import {
  EditOutlined,
  EyeOutlined,
  CopyOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  TeamOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  ShareAltOutlined,
  RollbackOutlined,
  HistoryOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { Pages } from '../api/client';
import ShareModal from './ShareModal';
import HistoryDrawer from './HistoryDrawer';

// One place for every page action (list, cards, approvals, builder) so they
// behave the same everywhere. Visibility comes from page.actions, which the
// server computes from the user's role, ownership and page status.
export default function usePageActions(onChanged) {
  const { modal, message } = App.useApp();
  const navigate = useNavigate();
  const [sharePage, setSharePage] = useState(null);
  const [historyPage, setHistoryPage] = useState(null);

  const run = async (fn, success) => {
    try {
      const res = await fn();
      if (success) message.success(success);
      if (onChanged) onChanged(res);
      window.dispatchEvent(new CustomEvent('pb:pages-changed'));
      return res;
    } catch (e) {
      message.error(e.message);
      throw e;
    }
  };

  const ask = ({ title, content, okText, danger, field, required, placeholder }) =>
    new Promise((resolve) => {
      let value = '';
      modal.confirm({
        title,
        icon: null,
        okText,
        okButtonProps: { danger },
        content: (
          <div>
            {content && <p style={{ marginBottom: 10 }}>{content}</p>}
            {field && (
              <Form.Item style={{ margin: 0 }} required={required}>
                <Input.TextArea rows={3} placeholder={placeholder} onChange={(e) => (value = e.target.value)} />
              </Form.Item>
            )}
          </div>
        ),
        onOk: () => {
          if (required && !value.trim()) {
            message.warning('Please add a comment');
            return Promise.reject();
          }
          resolve({ ok: true, value });
          return undefined;
        },
        onCancel: () => resolve({ ok: false }),
      });
    });

  const handlers = {
    edit: (p) => navigate(`/builder/${p.id}`),
    aiEdit: (p) => navigate(`/builder/${p.id}?panel=ai`),
    preview: (p) => window.open(Pages.previewUrl(p.id), '_blank', 'noopener'),
    open: (p) => p.isLive && window.open(`${window.location.origin}${process.env.REACT_APP_FUNCTION_BASE || '/server/new_page_builder_v_2_function'}/p/${p.slug}`, '_blank', 'noopener'),
    share: (p) => setSharePage(p),
    history: (p) => setHistoryPage(p),
    viewLeads: (p) => navigate(`/leads?pageId=${p.id}`),
    duplicate: (p) => run(() => Pages.duplicate(p.id), 'Copy created'),
    submit: async (p) => {
      const r = await ask({ title: `Send "${p.name}" for approval?`, content: 'A snapshot of the current draft goes to the marketing team for review.', okText: 'Send for approval', field: true, placeholder: 'Note for the reviewer (optional)' });
      if (r.ok) await run(() => Pages.action(p.id, 'submit', { note: r.value }), 'Sent for approval');
    },
    withdraw: async (p) => {
      const r = await ask({ title: 'Withdraw from review?', content: 'The page goes back to draft so it can be edited.', okText: 'Withdraw' });
      if (r.ok) await run(() => Pages.action(p.id, 'withdraw'), 'Withdrawn');
    },
    approve: async (p) => {
      const r = await ask({ title: `Approve "${p.name}"?`, content: `Version ${p.currentVersion} will be approved for publishing.`, okText: 'Approve', field: true, placeholder: 'Comment (optional)' });
      if (r.ok) await run(() => Pages.action(p.id, 'approve', { comment: r.value }), 'Approved');
    },
    reject: async (p) => {
      const r = await ask({ title: `Reject "${p.name}"?`, content: 'Tell the author what to change.', okText: 'Reject', danger: true, field: true, required: true, placeholder: 'Reason for rejection' });
      if (r.ok) await run(() => Pages.action(p.id, 'reject', { comment: r.value }), 'Rejected');
    },
    publish: async (p) => {
      const approved = p.status === 'Approved' || (p.status === 'Unpublished' && p.approvedVersion > 0);
      const r = await ask({
        title: `Publish "${p.name}"?`,
        content: approved ? `Approved version ${p.approvedVersion} goes live.` : 'The current draft is published directly (you have direct publishing rights).',
        okText: 'Publish',
      });
      if (r.ok) {
        const res = await run(() => Pages.action(p.id, 'publish'), 'Published');
        setSharePage(res);
      }
    },
    unpublish: async (p) => {
      const r = await ask({ title: `Unpublish "${p.name}"?`, content: 'Visitors will see "page not available" and the form stops accepting leads.', okText: 'Unpublish', danger: true });
      if (r.ok) await run(() => Pages.action(p.id, 'unpublish'), 'Unpublished');
    },
    saveTemplate: async (p) => {
      const r = await ask({ title: 'Save as template', content: 'Your team can start new pages from it.', okText: 'Save template', field: true, required: true, placeholder: 'Template name' });
      if (r.ok) await run(() => Pages.saveAsTemplate(p.id, { name: r.value, category: 'Saved' }), 'Template saved');
    },
    delete: async (p) => {
      const r = await ask({ title: `Delete "${p.name}"?`, content: p.isLive ? 'The page is live. It will be taken offline and removed. Leads are kept.' : 'The page will be removed. Leads are kept.', okText: 'Delete', danger: true });
      if (r.ok) await run(() => Pages.remove(p.id), 'Page deleted');
    },
  };

  // Menu items for a page, filtered by the server-computed permissions.
  const menuItems = (p, { exclude = [] } = {}) => {
    const a = p.actions || {};
    const items = [
      a.edit && { key: 'edit', icon: <EditOutlined />, label: 'Edit' },
      a.aiEdit && { key: 'aiEdit', icon: <ThunderboltOutlined />, label: 'Edit with AI' },
      { key: 'preview', icon: <EyeOutlined />, label: 'Preview' },
      { key: 'share', icon: <ShareAltOutlined />, label: 'Share / links / QR' },
      { type: 'divider' },
      a.submit && { key: 'submit', icon: <SendOutlined />, label: 'Send for approval' },
      a.withdraw && { key: 'withdraw', icon: <RollbackOutlined />, label: 'Withdraw from review' },
      a.approve && { key: 'approve', icon: <CheckCircleOutlined />, label: 'Approve' },
      a.reject && { key: 'reject', icon: <CloseCircleOutlined />, label: 'Reject' },
      a.publish && { key: 'publish', icon: <CloudUploadOutlined />, label: 'Publish' },
      a.unpublish && { key: 'unpublish', icon: <CloudDownloadOutlined />, label: 'Unpublish' },
      { type: 'divider' },
      a.viewLeads && { key: 'viewLeads', icon: <TeamOutlined />, label: `View leads (${p.leads})` },
      { key: 'history', icon: <HistoryOutlined />, label: 'History & versions' },
      a.duplicate && { key: 'duplicate', icon: <CopyOutlined />, label: 'Duplicate' },
      a.saveTemplate && { key: 'saveTemplate', icon: <SaveOutlined />, label: 'Save as template' },
      a.delete && { type: 'divider' },
      a.delete && { key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true },
    ].filter((x) => x && !exclude.includes(x.key));
    // drop leading/trailing/double dividers
    return items.filter((x, i, arr) => !(x.type === 'divider' && (i === 0 || i === arr.length - 1 || (arr[i + 1] && arr[i + 1].type === 'divider'))));
  };

  const onMenu = (p) => ({ key }) => {
    if (handlers[key]) Promise.resolve(handlers[key](p)).catch(() => {});
  };

  const elements = (
    <>
      <ShareModal page={sharePage} onClose={() => setSharePage(null)} />
      <HistoryDrawer page={historyPage} onClose={() => setHistoryPage(null)} onRestored={onChanged} />
    </>
  );

  return { handlers, menuItems, onMenu, elements };
}
