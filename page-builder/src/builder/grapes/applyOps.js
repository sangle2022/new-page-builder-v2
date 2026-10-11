import { findByPbId, applyTheme } from './setupEditor';
import { FUNCTION_BASE } from '../../api/client';

// Applies AI modification operations (see the function's
// services/ai/pageModification.service.js) to the live editor. Each op only
// touches its target, so the rest of the page is unchanged and everything
// stays editable. Returns a report per op.

function parseCss(css) {
  const out = {};
  String(css || '')
    .split(';')
    .forEach((decl) => {
      const i = decl.indexOf(':');
      if (i < 1) return;
      const k = decl.slice(0, i).trim().toLowerCase();
      const v = decl.slice(i + 1).trim();
      if (/^[a-z-]+$/.test(k) && v) out[k] = v;
    });
  return out;
}

// Sections often have gradient backgrounds (background-image), which hide a
// plain background-color. When a colour is set without an image, clear the
// image so the colour actually shows.
function fixBackground(component) {
  const style = component.getStyle() || {};
  if (style['background-color'] && !style.background && !style['background-image']) {
    component.addStyle({ 'background-image': 'none' });
  }
}

// The lead form inside a section (by data-pb-id), or the page's first form.
function findForm(editor, sectionId) {
  const scope = (sectionId && findByPbId(editor, sectionId)) || editor.getWrapper();
  return scope.find('form[data-pb-form]')[0] || editor.getWrapper().find('form[data-pb-form]')[0] || null;
}

function insertIndex(target, position) {
  const parent = target.parent();
  const idx = parent.components().indexOf(target);
  return { parent, at: position === 'before' ? idx : idx + 1 };
}

export function applyOperations(editor, ops, { onTheme, onSettings, theme } = {}) {
  const wrapper = editor.getWrapper();
  const report = [];
  const touched = [];

  ops.forEach((op) => {
    try {
      switch (op.op) {
        case 'update_element': {
          const target = findByPbId(editor, op.target);
          if (!target) throw new Error('element not found');
          const [next] = target.replaceWith(op.html);
          if (next) {
            fixBackground(next);
            touched.push(next);
          }
          break;
        }
        case 'insert_section': {
          const ref = op.reference ? findByPbId(editor, op.reference) : null;
          let added;
          if (ref && (op.position === 'before' || op.position === 'after')) {
            const { parent, at } = insertIndex(ref, op.position);
            added = parent.append(op.html, { at });
          } else if (op.position === 'start') {
            added = wrapper.append(op.html, { at: 0 });
          } else {
            // "end": keep the footer last
            const children = wrapper.components();
            const last = children.at(children.length - 1);
            const footerLast = last && (last.getAttributes()['data-pb-section'] === 'footer' || last.get('tagName') === 'footer');
            added = wrapper.append(op.html, footerLast ? { at: children.length - 1 } : {});
          }
          if (added && added[0]) touched.push(added[0]);
          break;
        }
        case 'remove_element': {
          const target = findByPbId(editor, op.target);
          if (!target) throw new Error('element not found');
          target.remove();
          break;
        }
        case 'move_section': {
          const target = findByPbId(editor, op.target);
          const ref = findByPbId(editor, op.reference);
          if (!target || !ref) throw new Error('section not found');
          const { parent, at } = insertIndex(ref, op.position);
          const from = target.parent() === parent ? parent.components().indexOf(target) : -1;
          target.move(parent, { at: from > -1 && from < at ? at - 1 : at });
          touched.push(target);
          break;
        }
        case 'update_theme': {
          const base = { ...(theme || {}) };
          // Switching light/dark: drop old page colours unless given again.
          if (op.theme.mode || op.theme.background) {
            ['background', 'surface', 'text', 'muted', 'card', 'mode'].forEach((k) => {
              if (!(k in op.theme)) delete base[k];
            });
          }
          const next = { ...base, ...op.theme };
          applyTheme(editor, next);
          if (onTheme) onTheme(next);
          break;
        }
        case 'set_style': {
          const target = findByPbId(editor, op.target);
          if (!target) throw new Error('element not found');
          target.addStyle(parseCss(op.css));
          fixBackground(target);
          touched.push(target);
          break;
        }
        case 'update_settings':
          if (onSettings) onSettings(op.settings);
          break;
        case 'add_css':
          editor.Css.addRules(op.css);
          break;
        case 'add_class':
        case 'remove_class': {
          const target = findByPbId(editor, op.target);
          if (!target) throw new Error('element not found');
          if (op.op === 'add_class') target.addClass(op.classes);
          else target.removeClass(op.classes);
          touched.push(target);
          break;
        }
        case 'set_attribute': {
          const target = findByPbId(editor, op.target);
          if (!target) throw new Error('element not found');
          target.addAttributes(op.attributes);
          touched.push(target);
          break;
        }
        case 'add_field': {
          const form = findForm(editor, op.target);
          if (!form) throw new Error('this page has no lead form');
          let container = form.find('.pb-form-fields')[0] || form;
          if (op.step) container = form.find(`.pb-form-step[data-step="${op.step}"]`)[0] || container;
          const after = op.after ? form.find(`[data-pb-field][data-name="${op.after}"]`)[0] : null;
          const parent = after ? after.parent() : container;
          const at = after ? parent.components().indexOf(after) + 1 : undefined;
          const [added] = parent.append(op.html, at === undefined ? {} : { at });
          if (added) touched.push(added);
          break;
        }
        case 'update_field': {
          const field = editor.getWrapper().find(`[data-pb-field][data-name="${op.name}"]`)[0];
          if (!field) throw new Error(`field ${op.name} not found`);
          const [next] = field.replaceWith(op.html);
          if (next) touched.push(next);
          break;
        }
        case 'remove_field': {
          const field = editor.getWrapper().find(`[data-pb-field][data-name="${op.name}"]`)[0];
          if (!field) throw new Error(`field ${op.name} not found`);
          field.remove();
          break;
        }
        case 'set_image': {
          // Marks the spot with an image prompt; the AI panel then generates
          // the picture (and saves it to the gallery).
          const target = findByPbId(editor, op.target);
          if (!target) throw new Error('element not found');
          const isImgComp = (c) => c.get('type') === 'image' || c.get('tagName') === 'img';
          const isImg = isImgComp(target);
          // A container that already shows a picture: replace that picture
          // (main media image first) instead of stacking another one below.
          const inner = isImg ? null : target.find('.pb-media img')[0] || target.find('img')[0] || null;
          const bgPlaceholder = !isImg && target.getAttributes()['data-pb-image-prompt'];
          const attrs = { 'data-pb-image-prompt': op.prompt, 'data-pb-image-size': isImg || inner ? '1200x900' : '1600x900' };
          if (isImg) {
            target.addAttributes({ ...attrs, ...(op.alt ? { alt: op.alt } : {}) });
            touched.push(target);
          } else if (op.placement === 'background' || bgPlaceholder) {
            target.addAttributes(attrs);
            touched.push(target);
          } else if (inner) {
            inner.addAttributes({ ...attrs, ...(op.alt ? { alt: op.alt } : {}) });
            touched.push(inner);
          } else {
            const alt = (op.alt || op.prompt).replace(/["<>]/g, '');
            const src = `${FUNCTION_BASE}/api/public/placeholder.svg?w=1200&h=800&t=${encodeURIComponent(alt.slice(0, 40))}`;
            const [img] = target.append(
              `<img src="${src}" alt="${alt}" data-pb-image-prompt="${op.prompt.replace(/"/g, '&quot;')}" data-pb-image-size="1200x800" style="width:100%;height:auto;border-radius:16px;margin-top:16px">`,
            );
            if (img) touched.push(img);
          }
          break;
        }
        case 'update_form': {
          const form = findForm(editor, op.target);
          if (!form) throw new Error('this page has no lead form');
          const f = op.form;
          if (f.successMessage) form.addAttributes({ 'data-pb-success': f.successMessage });
          if (f.redirectUrl) form.addAttributes({ 'data-pb-redirect': f.redirectUrl });
          if (f.submitLabel) {
            const btn = form.find('.pb-form-submit')[0];
            if (btn) btn.components(f.submitLabel);
          }
          const card = form.closest('.pb-form-card');
          if (card && f.title) {
            const h = card.find('.pb-h3')[0];
            if (h) h.components(f.title);
          }
          if (card && f.subtitle) {
            const sub = card.find('.pb-form-card__sub')[0];
            if (sub) sub.components(f.subtitle);
          }
          touched.push(form);
          break;
        }
        default:
          throw new Error(`unknown operation ${op.op}`);
      }
      report.push({ ...op, ok: true });
    } catch (e) {
      report.push({ ...op, ok: false, error: e.message });
    }
  });

  if (touched[0]) {
    editor.select(touched[0]);
    const el = touched[0].getEl();
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  return report;
}
