import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Segmented, Tooltip, Space, Spin, Result, App, Modal, Progress, Alert, Dropdown, Tabs, Typography, Switch, Badge } from 'antd';
import {
  ArrowLeftOutlined, DesktopOutlined, TabletOutlined, MobileOutlined, UndoOutlined, RedoOutlined, EyeOutlined, SaveOutlined,
  PlusSquareOutlined, BarsOutlined, ThunderboltOutlined, SettingOutlined, BorderOutlined, PictureOutlined, HistoryOutlined,
  SendOutlined, CloudUploadOutlined, EllipsisOutlined, CheckCircleOutlined, FormOutlined, CloseOutlined,
} from '@ant-design/icons';
import { Pages, Templates } from '../api/client';
import { useAuth, PERM } from '../context/AuthContext';
import StatusTag from '../components/StatusTag';
import usePageActions from '../components/usePageActions';
import MediaLibrary from '../components/MediaLibrary';
import AiPanel from './AiPanel';
import EditorGallery from './EditorGallery';
import PageSettingsDrawer from './PageSettingsDrawer';
import { formConfigFromHtml, fieldHtml, FIELD_TYPES } from './formMarkup';
import {
  createEditor, registerSectionBlocks, registerBasicBlocks, registerClassicBlocks, applyTheme, exportContent, DEFAULT_THEME, addLegacyCanvasAssets,
} from './grapes/setupEditor';
import { fillAllImages, findImagePlaceholders, replaceImage } from './grapes/images';

const AUTOSAVE_MS = 60000;

function ImageTools({ selected, onPick, readOnly }) {
  if (!selected) return null;
  const attrs = selected.getAttributes();
  const isImg = selected.get('type') === 'image' || selected.get('tagName') === 'img';
  if (!isImg && !attrs['data-pb-image-prompt']) return null;
  return (
    <div style={{ padding: 12, borderBottom: '1px solid #EEF2F7' }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}><PictureOutlined /> Image</div>
      <Button size="small" block disabled={readOnly} onClick={() => onPick(selected)}>Change image</Button>
    </div>
  );
}

function FormTools({ editor, selected }) {
  if (!selected) return null;
  let form = selected;
  while (form && form.get('type') !== 'pb-form') form = form.parent();
  if (!form) return null;
  const container = (() => {
    let c = selected;
    while (c && c !== form) {
      if (c.get('type') === 'pb-form-step') return c;
      c = c.parent();
    }
    return form.find('.pb-form-fields')[0] || form;
  })();
  const add = ({ key }) => {
    const [comp] = container.append(fieldHtml({ label: key === 'consent' ? 'I agree to be contacted about this enquiry' : `New ${key} field`, type: key, name: key === 'consent' ? 'consent' : undefined, options: ['select', 'radio', 'checkbox'].includes(key) ? ['Option 1', 'Option 2'] : [] }));
    if (comp) editor.select(comp);
  };
  return (
    <div style={{ padding: 12, borderBottom: '1px solid #EEF2F7' }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}><FormOutlined /> Lead form</div>
      <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
        Select a field to edit its label, type, options, required and OTP below. Drag fields to reorder.
      </Typography.Paragraph>
      <Dropdown menu={{ items: FIELD_TYPES.map((t) => ({ key: t, label: t })), onClick: add }}>
        <Button size="small" block>+ Add field {container.get('type') === 'pb-form-step' ? 'to this step' : ''}</Button>
      </Dropdown>
    </div>
  );
}

export default function Builder() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const { can, app } = useAuth();

  const canvasRef = useRef(null);
  const blocksRef = useRef(null);
  const layersRef = useRef(null);
  const stylesRef = useRef(null);
  const traitsRef = useRef(null);
  const editorRef = useRef(null);
  const loadedRef = useRef(false);

  const [page, setPage] = useState(null);
  const [error, setError] = useState(null);
  const [editor, setEditor] = useState(null);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [panel, setPanel] = useState(params.get('panel') === 'ai' ? 'ai' : 'blocks');
  const [rightTab, setRightTab] = useState('style');
  const [showRight, setShowRight] = useState(true);
  const [device, setDevice] = useState('desktop');
  const [selected, setSelected] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [assetReq, setAssetReq] = useState(null);
  const [imgJob, setImgJob] = useState(null);
  const [placeholderCount, setPlaceholderCount] = useState(0);
  const [classicLoaded, setClassicLoaded] = useState(false);
  const [outline, setOutline] = useState(true);
  const stopImages = useRef(false);

  const readOnly = !page || !page.actions || !page.actions.edit;
  const aiEnabled = app.aiEnabled && can(PERM.AI_USE);

  // ---- load page + editor ----
  useEffect(() => {
    let cancelled = false;
    let ed;
    (async () => {
      try {
        const [doc, blocks] = await Promise.all([Pages.document(id), Templates.blocks().catch(() => [])]);
        if (cancelled) return;
        setPage(doc.page);
        const t = { ...DEFAULT_THEME, ...((doc.page.settings && doc.page.settings.theme) || {}) };
        setTheme(t);
        const legacy = !!(doc.page.settings && doc.page.settings.legacyAssets);
        ed = createEditor({
          container: canvasRef.current,
          panels: {
            blocks: blocksRef.current,
            layers: layersRef.current,
            styles: stylesRef.current,
            traits: traitsRef.current,
          },
          onAssetRequest: (props) => setAssetReq(props),
          legacyAssets: legacy,
        });
        editorRef.current = ed;
        window.pbEditor = ed; // handy for support/debugging from the console
        registerSectionBlocks(ed, blocks);
        registerBasicBlocks(ed);
        ed.onReady(() => {
          if (doc.project && Array.isArray(doc.project.pages) && doc.project.pages.length) {
            ed.loadProjectData(doc.project);
          } else {
            // CSS first: loading HTML turns inline styles into CSS rules,
            // which a later setStyle() would wipe out.
            ed.setStyle(doc.css || '');
            ed.setComponents(doc.html || '');
          }
          applyTheme(ed, t);
          if (legacy) {
            addLegacyCanvasAssets(ed);
            registerClassicBlocks(ed).then(() => setClassicLoaded(true));
          }
          ed.UndoManager.clear();
          setPlaceholderCount(findImagePlaceholders(ed).length);
          setTimeout(() => {
            loadedRef.current = true;
          }, 600);
          setEditor(ed);
        });
        ed.on('update', () => {
          if (!loadedRef.current) return;
          setDirty(true);
        });
        ed.on('component:add component:remove', () => {
          if (loadedRef.current) setPlaceholderCount(findImagePlaceholders(ed).length);
        });
        ed.on('component:selected component:deselected', () => {
          setSelected(ed.getSelected() || null);
        });
        // Picture button in the toolbar of every image: gallery / AI image.
        ed.Commands.add('pb:pick-image', {
          run(editorInstance) {
            const c = editorInstance.getSelected();
            if (c) setPickFor(c);
          },
        });
        ed.on('component:selected', (c) => {
          const isImage = c.get('type') === 'image' || c.get('tagName') === 'img' || c.getAttributes()['data-pb-image-prompt'];
          const toolbar = c.get('toolbar') || [];
          if (!isImage || toolbar.some((t) => t.command === 'pb:pick-image')) return;
          c.set('toolbar', [
            {
              label:
                '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z"/></svg>',
              command: 'pb:pick-image',
              attributes: { title: 'Choose image (gallery or AI)' },
            },
            ...toolbar,
          ]);
        });
      } catch (e) {
        if (!cancelled) setError(e);
      }
    })();
    return () => {
      cancelled = true;
      if (ed) ed.destroy();
      editorRef.current = null;
    };
  }, [id]);

  // ---- save ----
  const isDraft = !!page && page.status === 'Draft';
  const save = useCallback(
    async ({ silent, confirmed } = {}) => {
      const ed = editorRef.current;
      if (!ed || readOnly) return null;
      // Approved / published / rejected pages go back to Draft when saved, so
      // that only happens when the user clicks Save and confirms; automatic
      // saves skip these pages.
      if (page && page.status !== 'Draft') {
        if (silent) return null;
        if (!confirmed) {
          modal.confirm({
            title: 'Save changes?',
            content: `This page is ${page.status}. Saving moves it back to Draft so the changes can be reviewed${page.isLive ? '. The live version keeps running until the new version is approved and published' : ''}.`,
            okText: 'Save as draft',
            onOk: () => save({ confirmed: true }),
          });
          return null;
        }
      }
      setSaving(true);
      try {
        const { html, css } = exportContent(ed);
        const res = await Pages.save(id, { project: ed.getProjectData(), html, css, theme });
        setPage(res.page);
        setDirty(false);
        setLastSaved(new Date());
        if (res.statusChanged) {
          message.info(`Saved. The page moved from ${res.previousStatus} back to Draft${res.page.isLive ? '; the live version keeps running until the new one is approved and published' : ''}.`, 6);
        } else if (!silent) {
          message.success('Saved');
        }
        return res.page;
      } catch (e) {
        message.error(e.message);
        return null;
      } finally {
        setSaving(false);
      }
    },
    [id, readOnly, theme, message, modal, page],
  );

  // autosave + Ctrl/Cmd+S + leave warning
  useEffect(() => {
    if (!dirty || readOnly || !isDraft) return undefined;
    const t = setTimeout(() => save({ silent: true }), AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [dirty, readOnly, save, isDraft]);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    };
    const onLeave = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('beforeunload', onLeave);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('beforeunload', onLeave);
    };
  }, [save, dirty]);

  // ---- theme ----
  const updateTheme = (next) => {
    setTheme(next);
    if (editorRef.current) applyTheme(editorRef.current, next);
    setDirty(true);
  };

  // ---- images ----
  const runImages = useCallback(async () => {
    const ed = editorRef.current;
    if (!ed) return;
    stopImages.current = false;
    setImgJob({ done: 0, total: findImagePlaceholders(ed).length, reused: 0, generated: 0, failed: 0 });
    const stats = await fillAllImages(ed, { pageId: id, onProgress: (p) => setImgJob((j) => ({ ...j, ...p })), shouldStop: () => stopImages.current });
    setImgJob((j) => ({ ...j, ...stats, finished: true }));
    setPlaceholderCount(findImagePlaceholders(ed).length);
    if (stats.done) {
      if (isDraft) await save({ silent: true });
      else setDirty(true);
    }
  }, [id, save, isDraft]);

  useEffect(() => {
    if (!editor || !page || params.get('images') !== '1') return;
    const next = new URLSearchParams(params);
    next.delete('images');
    next.delete('ai');
    setParams(next, { replace: true });
    const n = findImagePlaceholders(editor).length;
    if (!n || !aiEnabled || readOnly) return;
    modal.confirm({
      title: `Add ${n} image${n > 1 ? 's' : ''} to this page?`,
      content: 'AI fills the image placeholders. Similar images already in your gallery are reused, so only new ones are generated.',
      okText: 'Generate images',
      cancelText: 'Later',
      onOk: () => {
        runImages();
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, page]);

  // ---- asset manager (gallery) ----
  const [pickFor, setPickFor] = useState(null);
  const onPicked = (img) => {
    const ed = editorRef.current;
    if (assetReq) {
      const asset = ed.Assets.add({ src: img.url, name: img.name });
      assetReq.select(asset, true);
      assetReq.close();
      setAssetReq(null);
    } else if (pickFor) {
      replaceImage(pickFor, img.url);
      setPickFor(null);
    }
  };

  // ---- workflow actions ----
  const reloadPage = useCallback(async () => {
    const p = await Pages.get(id);
    setPage(p);
  }, [id]);
  const { handlers, menuItems, onMenu, elements } = usePageActions(reloadPage);
  const withSave = (fn) => async () => {
    let p = page;
    if (dirty && isDraft) p = (await save({ silent: true })) || page;
    fn(p);
  };

  const primaryAction = useMemo(() => {
    if (!page || !page.actions) return null;
    const a = page.actions;
    if (a.publish) return { key: 'publish', label: 'Publish', icon: <CloudUploadOutlined /> };
    if (a.submit) return { key: 'submit', label: 'Send for approval', icon: <SendOutlined /> };
    if (a.approve) return { key: 'approve', label: 'Approve', icon: <CheckCircleOutlined /> };
    return null;
  }, [page]);

  const setDeviceMode = (d) => {
    setDevice(d);
    if (editorRef.current) editorRef.current.setDevice(d);
  };
  const toggleOutline = (on) => {
    setOutline(on);
    const ed = editorRef.current;
    if (!ed) return;
    if (on) ed.runCommand('core:component-outline');
    else ed.stopCommand('core:component-outline');
  };
  useEffect(() => {
    if (editor && outline) editor.runCommand('core:component-outline');
  }, [editor, outline]);

  const loadClassic = async () => {
    if (!editorRef.current || classicLoaded) return;
    await registerClassicBlocks(editorRef.current);
    setClassicLoaded(true);
    message.info('Classic blocks added. They use Bootstrap/Tailwind, which the page loads automatically.');
    // Mark the page so published output includes the classic CSS.
    if (!(page.settings && page.settings.legacyAssets)) {
      Pages.update(id, { settings: { legacyAssets: true } }).then(setPage).catch(() => {});
    }
  };

  if (error) {
    return <Result status={error.status === 404 ? '404' : 'error'} title={error.status === 404 ? 'Page not found' : 'Could not open the page'} subTitle={error.message} extra={<Button onClick={() => navigate('/pages')}>Back to pages</Button>} />;
  }

  const rail = [
    { key: 'blocks', icon: <PlusSquareOutlined />, tip: 'Add sections & elements' },
    { key: 'layers', icon: <BarsOutlined />, tip: 'Layers' },
    { key: 'ai', icon: <ThunderboltOutlined />, tip: 'Edit with AI' },
    { key: 'images', icon: <PictureOutlined />, tip: 'Images' },
  ];

  return (
    <div className="pb-builder">
      {/* ---- top bar ---- */}
      <div className="pb-builder-top">
        <Tooltip title="Back to pages">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/pages')} />
        </Tooltip>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, minWidth: 0 }}>
          <span className="pb-builder-title">{page ? page.name : 'Loading…'}</span>
          <span style={{ fontSize: 11, opacity: 0.65 }}>
            {saving ? 'Saving…' : dirty ? 'Unsaved changes' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : page ? `/${page.slug}` : ''}
          </span>
        </div>
        {page && <StatusTag page={page} />}
        <div style={{ flex: 1 }} />
        <Segmented
          size="small"
          value={device}
          onChange={setDeviceMode}
          options={[
            { value: 'desktop', icon: <DesktopOutlined /> },
            { value: 'tablet', icon: <TabletOutlined /> },
            { value: 'mobile', icon: <MobileOutlined /> },
          ]}
        />
        <Tooltip title="Undo"><Button type="text" icon={<UndoOutlined />} onClick={() => editor && editor.UndoManager.undo()} /></Tooltip>
        <Tooltip title="Redo"><Button type="text" icon={<RedoOutlined />} onClick={() => editor && editor.UndoManager.redo()} /></Tooltip>
        <Tooltip title="Show element outlines"><Button type="text" icon={<BorderOutlined />} style={{ opacity: outline ? 1 : 0.5 }} onClick={() => toggleOutline(!outline)} /></Tooltip>
        <div style={{ flex: 1 }} />
        <Tooltip title="Page settings, SEO, theme, CRM"><Button type="text" icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)} /></Tooltip>
        <Tooltip title="History & versions"><Button type="text" icon={<HistoryOutlined />} onClick={() => page && handlers.history(page)} /></Tooltip>
        <Tooltip title="Preview (saves first)">
          <Button type="text" icon={<EyeOutlined />} onClick={withSave((p) => handlers.preview(p))} />
        </Tooltip>
        {!readOnly && (
          <Badge dot={dirty} offset={[-4, 4]}>
            <Button icon={<SaveOutlined />} loading={saving} onClick={() => save()}>
              Save
            </Button>
          </Badge>
        )}
        {primaryAction && (
          <Button type="primary" icon={primaryAction.icon} onClick={withSave((p) => handlers[primaryAction.key](p))}>
            {primaryAction.label}
          </Button>
        )}
        {page && (
          <Dropdown menu={{ items: menuItems(page, { exclude: ['edit', 'aiEdit', 'delete'] }), onClick: onMenu(page) }} trigger={['click']}>
            <Button type="text" icon={<EllipsisOutlined />} />
          </Dropdown>
        )}
      </div>

      {page && readOnly && (
        <Alert
          banner
          type="warning"
          message={
            page.status === 'Pending Approval'
              ? 'This page is waiting for approval and cannot be edited. Withdraw it from review to make changes.'
              : 'You can view this page but not edit it.'
          }
          action={page.actions && page.actions.withdraw ? <Button size="small" onClick={() => handlers.withdraw(page)}>Withdraw</Button> : null}
        />
      )}
      {imgJob && !imgJob.finished && (
        <Alert
          banner
          type="info"
          message={
            <Space>
              <span>Adding images {imgJob.done}/{imgJob.total}{imgJob.current ? ` · ${String(imgJob.current).slice(0, 60)}` : ''}</span>
              <Progress percent={Math.round((imgJob.done / Math.max(1, imgJob.total)) * 100)} size="small" style={{ width: 160, margin: 0 }} />
            </Space>
          }
          action={<Button size="small" onClick={() => { stopImages.current = true; }}>Stop</Button>}
        />
      )}
      {imgJob && imgJob.finished && (
        <Alert
          banner
          closable
          onClose={() => setImgJob(null)}
          type={imgJob.failed ? 'warning' : 'success'}
          message={`Images: ${imgJob.generated} generated, ${imgJob.reused} reused from the gallery${imgJob.failed ? `, ${imgJob.failed} failed (${imgJob.errors && imgJob.errors[0]})` : ''}.`}
        />
      )}

      <div className="pb-builder-body">
        {/* ---- left rail ---- */}
        <div className="pb-rail">
          {rail.map((r) => (
            <Tooltip key={r.key} title={r.tip} placement="right">
              <button type="button" className={panel === r.key ? 'is-active' : ''} onClick={() => setPanel(panel === r.key ? null : r.key)}>
                {r.key === 'images' && placeholderCount ? <Badge count={placeholderCount} size="small">{r.icon}</Badge> : r.icon}
              </button>
            </Tooltip>
          ))}
        </div>

        {/* ---- left panel ---- */}
        <div className={`pb-panel${panel ? '' : ' is-hidden'}`}>
          <div style={{ display: panel === 'blocks' ? 'flex' : 'none', flexDirection: 'column', minHeight: 0, flex: 1 }}>
            <div className="pb-panel-head">
              <span>Add to page</span>
              <Space size={4}>
                <span style={{ fontSize: 12, fontWeight: 400 }}>Classic</span>
                <Switch size="small" checked={classicLoaded} disabled={classicLoaded} onChange={loadClassic} />
              </Space>
            </div>
            <div className="pb-panel-body" ref={blocksRef} />
          </div>
          <div style={{ display: panel === 'layers' ? 'flex' : 'none', flexDirection: 'column', minHeight: 0, flex: 1 }}>
            <div className="pb-panel-head">Layers</div>
            <div className="pb-panel-body" ref={layersRef} />
          </div>
          {(
            <div style={{ display: panel === 'ai' ? 'flex' : 'none', flexDirection: 'column', minHeight: 0, flex: 1 }}>
              <div className="pb-panel-head">
                <span><ThunderboltOutlined /> AI assistant</span>
                <Button size="small" type="text" icon={<CloseOutlined />} onClick={() => setPanel(null)} />
              </div>
              <div className="pb-panel-body" style={{ display: 'flex', flexDirection: 'column' }}>
                {editor ? (
                  <AiPanel
                    editor={editor}
                    pageId={id}
                    theme={theme}
                    onTheme={updateTheme}
                    onSettings={(s) => {
                      Pages.update(id, { title: s.title || undefined, description: s.description || undefined }).then(setPage).catch(() => {});
                    }}
                    enabled={aiEnabled}
                    readOnly={readOnly}
                  />
                ) : (
                  <Spin />
                )}
              </div>
            </div>
          )}
          {panel === 'images' && (
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
              <div className="pb-panel-head">Images</div>
              <div className="pb-panel-body">
                {editor && <EditorGallery editor={editor} selected={selected} readOnly={readOnly} />}
              </div>
            </div>
          )}
        </div>

        {/* ---- canvas ---- */}
        <div className="pb-canvas-wrap">
          {!editor && (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', zIndex: 5, background: '#EEF1F6' }}>
              <Spin size="large" tip="Opening the builder…" />
            </div>
          )}
          <div ref={canvasRef} style={{ height: '100%' }} />
          <Tooltip title={showRight ? 'Hide properties' : 'Show properties'} placement="left">
            <Button size="small" shape="circle" style={{ position: 'absolute', right: 10, top: 10, zIndex: 6 }} icon={<SettingOutlined />} onClick={() => setShowRight(!showRight)} />
          </Tooltip>
        </div>

        {/* ---- right panel ---- */}
        <div className={`pb-right${showRight ? '' : ' is-hidden'}`}>
          <Tabs
            size="small"
            activeKey={rightTab}
            onChange={setRightTab}
            centered
            items={[
              { key: 'style', label: 'Design' },
              { key: 'traits', label: 'Settings' },
            ]}
            style={{ padding: '0 8px' }}
          />
          <div style={{ flex: 1, overflow: 'auto' }}>
            {!selected && <div className="pb-muted" style={{ padding: 16, fontSize: 13 }}>Select an element on the canvas to edit its design and settings.</div>}
            {editor && <ImageTools selected={selected} readOnly={readOnly} onPick={(c) => setPickFor(c)} />}
            {editor && rightTab === 'traits' && <FormTools editor={editor} selected={selected} />}
            <div style={{ display: rightTab === 'style' ? 'block' : 'none' }}>
              <div ref={stylesRef} />
            </div>
            <div style={{ display: rightTab === 'traits' ? 'block' : 'none' }} ref={traitsRef} />
          </div>
        </div>
      </div>

      <Modal
        open={!!assetReq || !!pickFor}
        onCancel={() => {
          if (assetReq) assetReq.close();
          setAssetReq(null);
          setPickFor(null);
        }}
        title="Image gallery"
        footer={null}
        width={960}
        destroyOnClose
      >
        <MediaLibrary
          picker={pickFor !== 'browse'}
          height="60vh"
          context={page ? page.name : ''}
          generatePrompt={pickFor && pickFor !== 'browse' ? pickFor.getAttributes()['data-pb-image-prompt'] || pickFor.getAttributes().alt : undefined}
          onSelect={onPicked}
        />
      </Modal>

      <PageSettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        page={page}
        theme={theme}
        onTheme={updateTheme}
        onSaved={setPage}
        readOnly={readOnly}
        getHtml={() => (editorRef.current ? exportContent(editorRef.current).html : '')}
        formConfig={settingsOpen && editorRef.current ? formConfigFromHtml(exportContent(editorRef.current).html) : (page && page.formConfig) || []}
      />
      {elements}
    </div>
  );
}
