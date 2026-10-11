import React, { useEffect, useRef, useState } from 'react';
import { Input, Button, Tag, Space, Alert, App, Tooltip, Divider, List } from 'antd';
import { SendOutlined, UndoOutlined, ThunderboltOutlined, AimOutlined, CloseOutlined, EditOutlined, PlusOutlined, ReloadOutlined, LoadingOutlined, CheckCircleFilled, ExclamationCircleFilled } from '@ant-design/icons';
import { AI, Media } from '../api/client';
import { exportContent, ensurePbId, sectionOf, newPbId } from './grapes/setupEditor';
import { applyOperations } from './grapes/applyOps';
import { findImagePlaceholders, fillImage, attachImage, notifyMediaChanged } from './grapes/images';

const QUICK = [
  'Make the headline more benefit-focused',
  'Add a testimonials section after the features',
  'Add a FAQ section with 4 questions',
  'Make the page feel more premium',
  'Add a city field to the form',
  'Shorten all the copy by 30%',
  'Translate the page to Hindi',
  'Change the brand colour to deep green',
];

// Pages built from classic templates or blank blocks have no section ids.
// Give every top-level block one, so the AI can see and target it.
function tagBlocks(editor) {
  editor
    .getWrapper()
    .components()
    .forEach((c) => {
      if (['textnode', 'comment'].includes(c.get('type'))) return;
      const a = c.getAttributes();
      if (!a['data-pb-id']) c.addAttributes({ 'data-pb-id': newPbId() });
      if (!a['data-pb-section']) c.addAttributes({ 'data-pb-section': 'block' });
    });
}

// "Create an image of a sunset" (nothing about where it goes) only makes an
// image: it is saved to the gallery and shown in the chat. Requests that
// place or change something on the page go through the normal AI edit.
const WANTS_IMAGE = /\b(image|images|picture|photo|photograph|illustration|graphic|artwork|wallpaper|banner)\b/i;
const CREATE = /\b(create|generate|make|draw|design|render|produce|give me|show me|need)\b/i;
const PLACES = /\b(add|attach|insert|put|place|set|use|replace|apply|append|swap|change|edit|update|into|to (the|this|that|my|selected)|in (the|this|that|my|selected)|on (the|this|that|my)|background|section|div|hero|header|footer|card|page|selected|this|existing|current)\b/i;
// Element name inside a sentence: "the div", not "the Div".
const inProse = (c) => { const d = describe(c) || 'selected element'; return d.charAt(0).toLowerCase() + d.slice(1); };
const isImageOnly = (text) => WANTS_IMAGE.test(text) && CREATE.test(text) && !PLACES.test(text);

const describe = (c) => {
  if (!c) return null;
  const a = c.getAttributes();
  if (a['data-pb-section']) return `${a['data-pb-section'].replace('_', ' ')} section`;
  if (a['data-pb-field']) return `form field "${a['data-label']}"`;
  return c.getName ? c.getName() : c.get('type') || c.get('tagName');
};

// Natural-language editing. The server returns targeted operations; they are
// applied as normal editor changes. A snapshot taken before each request
// allows one-click undo of the whole AI change.
export default function AiPanel({ editor, pageId, theme, onTheme, onSettings, enabled, readOnly }) {
  const { message } = App.useApp();
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Tell me what to change. Select an element on the canvas first to change only that part, for example "make this shorter" or "add a phone field".' },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [waitText, setWaitText] = useState(null);
  const [selected, setSelected] = useState(null);
  const [rewrite, setRewrite] = useState(null);
  const [phase, setPhase] = useState(null);
  const snapshots = useRef([]);
  const keySeq = useRef(0);
  const push = (msg) => {
    keySeq.current += 1;
    const key = keySeq.current;
    setMessages((m) => [...m, { ...msg, key }]);
    return key;
  };
  const patch = (key, fn) => setMessages((m) => m.map((x) => (x.key === key ? { ...x, ...fn(x) } : x)));
  const patchImage = (key, i, value) => patch(key, (x) => ({ images: x.images.map((im, j) => (j === i ? { ...im, ...value } : im)) }));
  const endRef = useRef(null);

  useEffect(() => {
    if (!editor) return undefined;
    const onSel = () => setSelected(editor.getSelected() || null);
    editor.on('component:selected component:deselected', onSel);
    onSel();
    return () => editor.off('component:selected component:deselected', onSel);
  }, [editor]);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  // Create an image only: saved to the gallery and shown in the chat, with a
  // button to put it on the selected element.
  const createImage = async (prompt, { fresh = false } = {}) => {
    const key = push({ role: 'ai', text: fresh ? 'Creating a new image instead…' : 'Creating your image…', images: [{ prompt, status: 'working' }], standalone: true });
    setBusy(true);
    setPhase(null);
    try {
      const r = await AI.generateImage({ prompt, pageId, reuseExisting: !fresh });
      if (!r.reused) notifyMediaChanged();
      patch(key, () => ({
        text: r.reused
          ? 'I found a very similar image in your gallery, so I reused it instead of creating a duplicate.'
          : 'Here is your image. It is saved in the gallery, so you can also find it in the Images panel.',
        images: [{ prompt, status: 'done', image: r.image, reused: r.reused }],
      }));
    } catch (e) {
      patch(key, () => ({ text: 'I could not create that image.', images: [{ prompt, status: 'failed', error: e.message }] }));
    } finally {
      setBusy(false);
    }
  };

  const addToSelected = (img) => {
    const target = editor && editor.getSelected();
    if (!target) {
      message.info('Select the image or section on the page where this picture should go, then click Add again.');
      return;
    }
    const where = inProse(target);
    snapshots.current.push({ project: editor.getProjectData(), theme });
    attachImage(editor, target, img);
    Media.markUsed([img.id]).catch(() => {});
    push({ role: 'ai', text: `Added the image to the ${where}.`, undoable: true, id: snapshots.current.length });
  };

  const send = async (text) => {
    const instruction = String(text || input).trim();
    if (!instruction || !editor) return;
    setInput('');
    push({ role: 'user', text: instruction, target: describe(selected) });
    if (isImageOnly(instruction)) {
      await createImage(instruction);
      return;
    }
    setBusy(true);
    setPhase(selected ? `Reading the ${inProse(selected)}…` : 'Reading the page…');
    try {
      // Target the selected element; fall back to its section when the
      // element is part of generated markup (form fields, locked children).
      let target = selected;
      if (target && !target.get('selectable')) target = sectionOf(target) || target;
      const selectedId = target ? ensurePbId(target) : null;
      tagBlocks(editor);
      const { html, css } = exportContent(editor);
      const snapshot = editor.getProjectData();
      const res = await AI.modifyPage(
        { pageId, instruction, html, css, selectedId },
        {
          // Whole-page redesigns run on the advanced model and can take 1-2 minutes.
          onWaiting: (status, ms) => {
            if (ms > 3000 && ms <= 12000) setPhase('Working out the changes…');
            if (ms > 12000) setWaitText(`Still working (${Math.round(ms / 1000)}s)… whole-page redesigns use the advanced model and can take 1–2 minutes.`);
          },
        },
      );
      if (!res.operations.length) {
        push({ role: 'ai', text: res.summary });
        return;
      }
      setWaitText(null);
      setPhase('Applying the changes…');
      snapshots.current.push({ project: snapshot, theme });
      // Remember each placeholder's description, to spot new or changed ones.
      const promptOf = (c) => c.getAttributes()['data-pb-image-prompt'];
      const before = new Map(findImagePlaceholders(editor).map((c) => [c, promptOf(c)]));
      const report = applyOperations(editor, res.operations, { theme, onTheme, onSettings });
      const failed = report.filter((r) => !r.ok);
      const notApplied = failed.length + (res.skipped || 0);
      // Images the AI added or re-described arrive as placeholders (including
      // template placeholders it re-described): generate them now, one
      // request each, reusing similar gallery images. Progress shows in the
      // same chat message, with each picture as it arrives.
      const added = findImagePlaceholders(editor).filter((c) => !before.has(c) || before.get(c) !== promptOf(c));
      const key = push({
        role: 'ai',
        text: res.summary,
        note: notApplied ? `${notApplied} change(s) could not be applied.` : null,
        ops: report,
        images: added.map((c) => ({ prompt: promptOf(c), status: 'pending' })),
        undoable: !added.length,
        id: snapshots.current.length,
      });
      if (added.length) {
        setPhase(null);
        let ok = 0;
        let reused = 0;
        for (let i = 0; i < added.length; i += 1) {
          patchImage(key, i, { status: 'working' });
          try {
            // eslint-disable-next-line no-await-in-loop
            const r = await fillImage(added[i], { pageId });
            ok += 1;
            if (r && r.reused) reused += 1;
            patchImage(key, i, { status: 'done', image: r && r.image, reused: !!(r && r.reused) });
          } catch (err) {
            patchImage(key, i, { status: 'failed', error: err.message });
          }
        }
        if (ok > reused) notifyMediaChanged();
        const failedImages = added.length - ok;
        const doneText = failedImages
          ? `${ok} of ${added.length} image(s) added. You can retry the rest from the Images panel.`
          : `Done. ${ok === 1 ? 'The image is' : `All ${ok} images are`} on the page${reused ? ` (${reused} reused from the gallery)` : ''} and saved in the gallery.`;
        patch(key, () => ({ undoable: true, done: doneText, failedDone: failedImages > 0 }));
      }
    } catch (e) {
      setMessages((m) => [...m, { role: 'ai', text: `Sorry, that did not work: ${e.message}` }]);
    } finally {
      setBusy(false);
      setWaitText(null);
      setPhase(null);
    }
  };

  const undo = () => {
    const snap = snapshots.current.pop();
    if (!snap) return;
    editor.loadProjectData(snap.project);
    if (snap.theme) onTheme(snap.theme);
    setMessages((m) => [...m.map((x) => (x.id === snapshots.current.length + 1 ? { ...x, undoable: false } : x)), { role: 'ai', text: 'Undone. The page is back to how it was before that change.' }]);
    message.success('AI change undone');
  };

  const isText = selected && ['text', 'link', 'heading'].includes(selected.get('type')) && selected.get('editable') !== false;

  const startRewrite = async (instruction) => {
    if (!selected) return;
    const el = selected.getEl();
    const text = el ? el.innerText : '';
    if (!text.trim()) return;
    setRewrite({ loading: true, options: [] });
    try {
      const r = await AI.rewrite({ text, instruction, pageId });
      setRewrite({ loading: false, options: r.options });
    } catch (e) {
      message.error(e.message);
      setRewrite(null);
    }
  };

  const applyOption = (text) => {
    selected.components(text);
    setRewrite(null);
    message.success('Text replaced');
  };

  if (!enabled) {
    return <Alert type="info" showIcon message="AI editing is not available" description="Ask an admin to set GEMINI_API_KEY, or check that your role includes AI." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 8 }}>
        <div className="pb-ai-chat">
          {messages.map((m, i) => (
            <div key={m.key || i} className={`pb-ai-msg ${m.role}`}>
              {m.target && <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 4 }}>On: {m.target}</div>}
              {m.text}
              {m.note && <div className="pb-ai-note"><ExclamationCircleFilled /> {m.note}</div>}
              {m.images && m.images.length > 0 && (
                <div className="pb-ai-images">
                  {m.images.map((im, j) => (
                    <ChatImage
                      key={j}
                      item={im}
                      standalone={m.standalone}
                      canAdd={!readOnly}
                      busy={busy}
                      onAdd={() => addToSelected(im.image)}
                      onFresh={() => createImage(im.prompt, { fresh: true })}
                    />
                  ))}
                </div>
              )}
              {m.done && <div className={m.failedDone ? 'pb-ai-note' : 'pb-ai-done'}>{m.failedDone ? <ExclamationCircleFilled /> : <CheckCircleFilled />} {m.done}</div>}
              {m.ops && (
                <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {m.ops.map((o, j) => (
                    <Tooltip key={j} title={o.error || o.note}>
                      <Tag color={o.ok ? 'blue' : 'red'} style={{ fontSize: 11, margin: 0 }}>{o.op.replace('_', ' ')}</Tag>
                    </Tooltip>
                  ))}
                </div>
              )}
              {m.undoable && m.id === snapshots.current.length && (
                <Button size="small" icon={<UndoOutlined />} style={{ marginTop: 8 }} onClick={undo}>Undo this change</Button>
              )}
            </div>
          ))}
          {busy && phase && (
            <div className="pb-ai-msg ai pb-ai-status">
              <span className="pb-ai-typing"><i /><i /><i /></span>
              {waitText || phase}
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {isText && !readOnly && (
        <div style={{ borderTop: '1px solid #EEF2F7', paddingTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}><EditOutlined /> Rewrite selected text</div>
          <Space size={[4, 4]} wrap>
            {['Make it shorter', 'More persuasive', 'Friendlier', 'More formal', 'Fix grammar'].map((t) => (
              <Tag key={t} style={{ cursor: 'pointer' }} onClick={() => startRewrite(t)}>{t}</Tag>
            ))}
          </Space>
          {rewrite && (
            <List
              size="small"
              loading={rewrite.loading}
              dataSource={rewrite.options}
              style={{ marginTop: 6 }}
              renderItem={(o) => (
                <List.Item style={{ cursor: 'pointer', fontSize: 12.5 }} onClick={() => applyOption(o)}>{o}</List.Item>
              )}
            />
          )}
          <Divider style={{ margin: '8px 0' }} />
        </div>
      )}

      <div style={{ borderTop: '1px solid #EEF2F7', paddingTop: 8 }}>
        {selected ? (
          <Tag icon={<AimOutlined />} color="blue" closable closeIcon={<CloseOutlined />} onClose={() => editor.select(null)} style={{ marginBottom: 6 }}>
            {describe(selected)}
          </Tag>
        ) : (
          <div className="pb-muted" style={{ fontSize: 12, marginBottom: 6 }}>No selection: changes may apply to the whole page.</div>
        )}
        <Space size={[4, 4]} wrap style={{ marginBottom: 8 }}>
          {QUICK.slice(0, 4).map((q) => (
            <Tag key={q} style={{ cursor: 'pointer', fontSize: 11 }} onClick={() => !busy && !readOnly && send(q)}>{q}</Tag>
          ))}
        </Space>
        <Input.TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoSize={{ minRows: 2, maxRows: 5 }}
          placeholder={readOnly ? 'This page cannot be edited right now' : 'e.g. Add a pricing section with 3 plans'}
          disabled={busy || readOnly}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <Button type="primary" block icon={busy ? <ThunderboltOutlined /> : <SendOutlined />} loading={busy} disabled={readOnly || !input.trim()} style={{ marginTop: 8 }} onClick={() => send()}>
          Apply with AI
        </Button>
      </div>
    </div>
  );
}

// One picture in the chat: a shimmer while it is created, then the image
// and what happened to it.
function ChatImage({ item, standalone, canAdd, busy, onAdd, onFresh }) {
  const shortPrompt = String(item.prompt || '').replace(/\s+/g, ' ').slice(0, 90);
  if (item.status === 'failed') {
    return (
      <div className="pb-ai-img pb-ai-img--failed">
        <ExclamationCircleFilled /> {item.error || 'The image could not be created.'}
      </div>
    );
  }
  if (item.status !== 'done' || !item.image) {
    return (
      <div className="pb-ai-img">
        <div className={`pb-ai-img__shimmer${item.status === 'working' ? ' is-working' : ''}`}>
          {item.status === 'working' ? <><LoadingOutlined /> Creating image…</> : 'Waiting…'}
        </div>
        {shortPrompt && <div className="pb-ai-img__caption">{shortPrompt}</div>}
      </div>
    );
  }
  return (
    <div className="pb-ai-img">
      <a href={item.image.url} target="_blank" rel="noreferrer" title="Open full size">
        <img src={item.image.url} alt={item.image.name || shortPrompt} />
      </a>
      <div className="pb-ai-img__caption">
        <Tag color={item.reused ? 'gold' : 'green'} style={{ margin: 0, fontSize: 11 }}>{item.reused ? 'Reused from gallery' : 'New · saved to gallery'}</Tag>
        {!standalone && <span>Added to the page</span>}
      </div>
      {standalone && canAdd && (
        <div className="pb-ai-img__actions">
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={onAdd}>Add to selected</Button>
          {item.reused && <Button size="small" icon={<ReloadOutlined />} disabled={busy} onClick={onFresh}>Create a new one</Button>}
        </div>
      )}
    </div>
  );
}

export { QUICK };
