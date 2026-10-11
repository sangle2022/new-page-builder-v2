import grapesjs from 'grapesjs';
import { fieldHtml, fieldName, FIELD_TYPES } from '../formMarkup';
import { themeVarsObject } from '../theme';
import { FUNCTION_BASE } from '../../api/client';

// GrapesJS 0.22 (BSD-3) configured for Page Builder V2:
//  - our own React panels; GrapesJS managers render into containers we pass
//  - lead form components (form, step, field) with traits
//  - section blocks from the server's section library + V1 classic blocks
//  - the image gallery replaces the default asset manager
//  - every section keeps a unique data-pb-id so AI edits can target it

const PUBLIC_URL = process.env.PUBLIC_URL || '';

export const FONTS = {
  Inter: 'Inter:wght@400;500;600;700;800',
  Poppins: 'Poppins:wght@400;500;600;700;800',
  Montserrat: 'Montserrat:wght@400;500;600;700;800',
  Lato: 'Lato:wght@400;700;900',
  'Playfair Display': 'Playfair+Display:wght@500;600;700;800',
  Merriweather: 'Merriweather:wght@400;700;900',
  'DM Sans': 'DM+Sans:wght@400;500;600;700',
  Outfit: 'Outfit:wght@400;500;600;700;800',
};

export const DEFAULT_THEME = { primary: '#004AAD', accent: '#F59E0B', dark: '#0B1B33', font: 'Inter', headingFont: 'Inter', radius: '14px' };

export function fontUrl(theme) {
  const fams = [...new Set([theme.font, theme.headingFont].filter((f) => FONTS[f]))];
  if (!fams.length) fams.push('Inter');
  return `https://fonts.googleapis.com/css2?${fams.map((f) => `family=${FONTS[f]}`).join('&')}&display=swap`;
}

// Same variables the server writes (shared/pageStyles.js themeVars).
// Same variables as published pages (generated from the function's shared/theme.js).
export function themeStyle(theme = {}) {
  return themeVarsObject({ ...DEFAULT_THEME, ...theme });
}

export const newPbId = (prefix = 's') => `${prefix}${Math.random().toString(16).slice(2, 10)}`;

// Canvas-only CSS: show every form step while editing, outline sections.
const CANVAS_CSS = `
html{scrollbar-width:thin;scrollbar-color:#c9d6f0 transparent}
::-webkit-scrollbar{width:10px;height:10px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#c9d6f0;border-radius:999px;border:2px solid transparent;background-clip:padding-box}
::-webkit-scrollbar-thumb:hover{background:#a9bfe8;background-clip:padding-box}
.pb-form[data-pb-steps="true"] .pb-form-step{display:contents!important}
.pb-form-step{outline:1px dashed rgba(0,74,173,.35);outline-offset:6px}
.pb-form-step__title::after{content:" (step " attr(data-step) ")";opacity:.5;font-weight:400}
[data-pb-image-prompt]{outline:2px dashed rgba(124,58,237,.55);outline-offset:-2px}
.pb-video iframe,.pb-map iframe{pointer-events:none}
`;

function lockChildren(component) {
  component.components().forEach((c) => {
    c.set({ selectable: false, hoverable: false, draggable: false, droppable: false, layerable: false, copyable: false, editable: false, highlightable: false });
    lockChildren(c);
  });
}

function fieldFromAttrs(attrs) {
  return {
    label: attrs['data-label'],
    name: attrs['data-name'],
    type: attrs['data-type'],
    required: attrs['data-required'] === 'true' || attrs['data-required'] === true,
    options: attrs['data-options'] || '',
    placeholder: attrs['data-placeholder'] || '',
    width: attrs['data-width'] || 'full',
    otp: attrs['data-otp'] === 'true' || attrs['data-otp'] === true,
  };
}

function registerFormComponents(editor) {
  const dc = editor.DomComponents;

  dc.addType('pb-form', {
    isComponent: (el) => el.tagName === 'FORM' && el.getAttribute && el.getAttribute('data-pb-form') !== null,
    model: {
      defaults: {
        name: 'Lead form',
        droppable: '.pb-field, .pb-form-step, .pb-form-fields',
        traits: [
          { type: 'text', name: 'data-pb-success', label: 'Success message' },
          { type: 'text', name: 'data-pb-redirect', label: 'Redirect after submit (URL)' },
          { type: 'checkbox', name: 'data-pb-captcha', label: 'reCAPTCHA', valueTrue: 'true', valueFalse: 'false' },
        ],
      },
    },
  });

  dc.addType('pb-form-step', {
    isComponent: (el) => el.classList && el.classList.contains('pb-form-step'),
    model: {
      defaults: {
        name: 'Form step',
        draggable: '.pb-form-fields',
        droppable: '.pb-field',
        traits: [
          { type: 'text', name: 'data-title', label: 'Step title', changeProp: false },
          { type: 'number', name: 'data-step', label: 'Step number', min: 1 },
        ],
      },
      init() {
        this.on('change:attributes:data-title', () => {
          const title = this.components().filter((c) => c.getClasses().includes('pb-form-step__title'))[0];
          if (title) title.components(this.getAttributes()['data-title'] || '');
        });
      },
    },
  });

  dc.addType('pb-field', {
    isComponent: (el) => el.getAttribute && el.getAttribute('data-pb-field') === 'true',
    model: {
      defaults: {
        name: 'Form field',
        draggable: '.pb-form-fields, .pb-form-step',
        droppable: false,
        traits: [
          { type: 'text', name: 'data-label', label: 'Label' },
          { type: 'text', name: 'data-name', label: 'Field key' },
          { type: 'select', name: 'data-type', label: 'Type', options: FIELD_TYPES.map((t) => ({ id: t, name: t })) },
          { type: 'checkbox', name: 'data-required', label: 'Required', valueTrue: 'true', valueFalse: 'false' },
          { type: 'text', name: 'data-options', label: 'Options (a|b|c)' },
          { type: 'text', name: 'data-placeholder', label: 'Placeholder' },
          { type: 'select', name: 'data-width', label: 'Width', options: [{ id: 'full', name: 'Full' }, { id: 'half', name: 'Half' }] },
          { type: 'checkbox', name: 'data-otp', label: 'Verify by OTP (mobile)', valueTrue: 'true', valueFalse: 'false' },
        ],
      },
      init() {
        lockChildren(this);
        const watched = ['data-label', 'data-name', 'data-type', 'data-required', 'data-options', 'data-placeholder', 'data-width', 'data-otp'];
        this.on(watched.map((a) => `change:attributes:${a}`).join(' '), this.rebuild);
      },
      // Field markup is generated, so a trait change re-renders the field.
      rebuild() {
        if (this._rebuilding || !this.parent()) return;
        this._rebuilding = true;
        const field = fieldFromAttrs(this.getAttributes());
        // A key that was derived from the old label follows the new label;
        // a key the user typed stays as it is.
        const prev = this.previous('attributes') || {};
        if (prev['data-label'] && prev['data-label'] !== field.label && prev['data-name'] === field.name && field.name === fieldName(prev['data-label'])) {
          field.name = fieldName(field.label);
        }
        const html = fieldHtml(field);
        const em = this.em;
        const [next] = this.replaceWith(html);
        if (next && em) em.get('Editor').select(next);
        this._rebuilding = false;
      },
    },
  });
}

// YouTube / Vimeo page links -> embeddable player URL.
export function toVideoEmbed(input) {
  const url = String(input || '').trim();
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/i);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return /^https:\/\//i.test(url) ? url : null;
}

// Address, place name or a Google Maps embed link -> embeddable map URL.
export function toMapEmbed(input) {
  const v = String(input || '').trim();
  if (!v) return null;
  if (/^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/i.test(v)) return v;
  return `https://maps.google.com/maps?q=${encodeURIComponent(v)}&z=15&output=embed`;
}

// Video and map sections: the iframe is not clickable in the editor, so the
// wrapper is selected and offers a simple setting (link / address).
function registerEmbedComponents(editor) {
  const dc = editor.DomComponents;
  // GrapesJS turns YouTube/Vimeo and Google Maps iframes into its own
  // "video" / "map" components, which build the src from their properties.
  const iframeOf = (model) => model.components().filter((c) => c.get('tagName') === 'iframe' || ['video', 'map'].includes(c.get('type')))[0];
  const setVideo = (frame, src) => {
    if (frame.get('type') !== 'video') return frame.addAttributes({ src });
    const yt = src.match(/youtube\.com\/embed\/([\w-]+)/);
    const vi = src.match(/player\.vimeo\.com\/video\/(\d+)/);
    if (yt) frame.set({ provider: 'yt', videoId: yt[1] });
    else if (vi) frame.set({ provider: 'vi', videoId: vi[1] });
    else frame.set({ provider: 'so', src });
    return frame;
  };
  const videoLink = (frame) => {
    if (!frame) return '';
    if (frame.get('type') === 'video' && frame.get('videoId')) {
      return frame.get('provider') === 'vi' ? `https://vimeo.com/${frame.get('videoId')}` : `https://www.youtube.com/watch?v=${frame.get('videoId')}`;
    }
    return frame.getAttributes().src || '';
  };

  dc.addType('pb-video', {
    isComponent: (el) => el.classList && el.classList.contains('pb-video'),
    model: {
      defaults: {
        name: 'Video',
        droppable: false,
        traits: [{ type: 'text', name: 'videoUrl', label: 'YouTube or Vimeo link', changeProp: true, placeholder: 'https://www.youtube.com/watch?v=…' }],
      },
      init() {
        this.set('videoUrl', videoLink(iframeOf(this)), { silent: true });
        this.on('change:videoUrl', () => {
          const src = toVideoEmbed(this.get('videoUrl'));
          const frame = iframeOf(this);
          if (src && frame) setVideo(frame, src);
        });
      },
    },
  });

  dc.addType('pb-map', {
    isComponent: (el) => el.classList && el.classList.contains('pb-map'),
    model: {
      defaults: {
        name: 'Map',
        droppable: false,
        traits: [{ type: 'text', name: 'mapAddress', label: 'Address or place', changeProp: true, placeholder: 'e.g. Connaught Place, New Delhi' }],
      },
      init() {
        const iframe = iframeOf(this);
        if (iframe && iframe.get('type') === 'map' && iframe.get('address')) {
          this.set('mapAddress', iframe.get('address'), { silent: true });
        } else {
          const src = iframe ? iframe.getAttributes().src || '' : '';
          const q = (src.match(/[?&]q=([^&]+)/) || [])[1];
          if (q) this.set('mapAddress', decodeURIComponent(q.replace(/\+/g, ' ')), { silent: true });
        }
        this.on('change:mapAddress', () => {
          const value = String(this.get('mapAddress') || '').trim();
          const frame = iframeOf(this);
          if (!value || !frame) return;
          // GrapesJS maps default to zoom 1 (whole world); use street level.
          if (frame.get('type') === 'map' && !/^https:/i.test(value)) frame.set({ address: value, zoom: Number(frame.get('zoom')) > 3 ? frame.get('zoom') : 15 });
          else frame.addAttributes({ src: toMapEmbed(value) });
        });
      },
    },
  });
}

export function registerBasicBlocks(editor) {
  const bm = editor.BlockManager;
  const basic = [
    { id: 'b-heading', label: 'Heading', content: '<h2 class="pb-h2">A clear heading</h2>' },
    { id: 'b-text', label: 'Text', content: '<p class="pb-text">Write something persuasive here.</p>' },
    { id: 'b-button', label: 'Button', content: '<a class="pb-btn pb-btn--primary" href="#lead-form">Get started</a>' },
    { id: 'b-image', label: 'Image', content: { type: 'image', style: { 'max-width': '100%', 'border-radius': '12px' }, activate: true } },
    { id: 'b-2col', label: '2 columns', content: '<div class="pb-container"><div class="pb-grid pb-grid--2"><div class="pb-card"><p class="pb-text">Column one</p></div><div class="pb-card"><p class="pb-text">Column two</p></div></div></div>' },
    { id: 'b-3col', label: '3 columns', content: '<div class="pb-container"><div class="pb-grid pb-grid--3"><div class="pb-card"><p class="pb-text">One</p></div><div class="pb-card"><p class="pb-text">Two</p></div><div class="pb-card"><p class="pb-text">Three</p></div></div></div>' },
    { id: 'b-section', label: 'Empty section', content: `<section class="pb-section" data-pb-section="text" data-pb-id="${newPbId()}"><div class="pb-container"><h2 class="pb-h2">New section</h2><p class="pb-text">Add content here.</p></div></section>` },
    { id: 'b-spacer', label: 'Spacer', content: '<div style="height:48px"></div>' },
    { id: 'b-divider', label: 'Divider', content: '<hr style="border:0;border-top:1px solid #E2E8F0;margin:24px 0">' },
    { id: 'b-video', label: 'Video', content: { type: 'video', provider: 'yt', videoId: 'dQw4w9WgXcQ', style: { width: '100%', height: '360px' } } },
    { id: 'b-map', label: 'Map', content: { type: 'map', style: { width: '100%', height: '320px' } } },
    { id: 'b-html', label: 'Custom HTML', content: '<div class="pb-custom-html"><p>Custom content</p></div>' },
  ];
  basic.forEach((b) => bm.add(b.id, { ...b, category: { id: 'Basic', label: 'Basic elements', open: false } }));

  // Form fields, each a complete .pb-field that drops into a form.
  [
    ['text', 'Text field'], ['email', 'Email'], ['tel', 'Mobile number'], ['number', 'Number'], ['date', 'Date'],
    ['textarea', 'Message'], ['select', 'Dropdown'], ['radio', 'Single choice'], ['checkbox', 'Multiple choice'],
    ['pincode', 'Pincode'], ['consent', 'Consent'], ['hidden', 'Hidden value'],
  ].forEach(([type, label]) =>
    bm.add(`f-${type}`, {
      label,
      category: { id: 'Form fields', label: 'Form fields', open: false },
      content: fieldHtml({
        label: type === 'consent' ? 'I agree to be contacted about this enquiry' : label,
        type,
        options: ['select', 'radio', 'checkbox'].includes(type) ? ['Option 1', 'Option 2', 'Option 3'] : [],
        name: type === 'consent' ? 'consent' : undefined,
      }),
    }),
  );
}

export function registerSectionBlocks(editor, blocks) {
  const bm = editor.BlockManager;
  const open = new Set(['Header', 'Hero']);
  blocks.forEach((b) => {
    bm.add(b.id, {
      label: (b.label.split(' · ')[1] || b.label).replace(/^./, (c) => c.toUpperCase()),
      category: { id: b.category, label: b.category, open: open.has(b.category) },
      content: b.html,
      media: b.media || `<div style="font-size:10px;text-transform:uppercase;color:#004AAD;font-weight:700">${b.type.replace('_', ' ')}</div>`,
      attributes: { title: b.label },
    });
  });
}

// V1 blocks, loaded on demand (large, need Bootstrap/Tailwind on the canvas).
export async function registerClassicBlocks(editor) {
  const sets = await Promise.all([
    import('../classic/Templates'),
    import('../classic/LegacyTemplates'),
    import('../classic/SalesTemplates'),
    import('../classic/CampaignTemplates'),
    import('../classic/PortfolioTemplates'),
    import('../classic/FuturisticTemplates'),
    import('../classic/FestivalTemplates'),
    import('../classic/BlogTemplates'),
    import('../classic/websiteLayouts'),
  ]);
  const bm = editor.BlockManager;
  const strip = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);
  sets.forEach((mod) => {
    (mod.default || []).forEach((t) => {
      if (bm.get(`classic-${t.id}`)) return;
      bm.add(`classic-${t.id}`, {
        label: strip(t.label) || String(t.id).replace(/-/g, ' '),
        category: `Classic · ${t.category || 'Layouts'}`,
        content: t.content,
      });
    });
  });
  addLegacyCanvasAssets(editor);
}

export function addLegacyCanvasAssets(editor) {
  const doc = editor.Canvas.getDocument();
  if (!doc || doc.getElementById('pb-legacy-css')) return;
  const link = doc.createElement('link');
  link.id = 'pb-legacy-css';
  link.rel = 'stylesheet';
  link.href = `${PUBLIC_URL}/css/bootstrap.min.css`;
  doc.head.appendChild(link);
  const tw = doc.createElement('script');
  tw.src = `${PUBLIC_URL}/js/tailwind.js`;
  doc.head.appendChild(tw);
}

export function setCanvasFonts(editor, theme) {
  const doc = editor.Canvas.getDocument();
  if (!doc) return;
  let link = doc.getElementById('pb-fonts');
  if (!link) {
    link = doc.createElement('link');
    link.id = 'pb-fonts';
    link.rel = 'stylesheet';
    doc.head.appendChild(link);
  }
  link.href = fontUrl(theme);
}

export function applyTheme(editor, theme) {
  editor.Css.setRule(':root', themeStyle(theme));
  setCanvasFonts(editor, { ...DEFAULT_THEME, ...theme });
}

// Give every section dropped from a block (or duplicated) its own id.
function ensureUniqueIds(editor, component) {
  const seen = new Set();
  const wrapper = editor.getWrapper();
  if (!wrapper) return;
  wrapper
    .find('[data-pb-id]')
    .forEach((c) => {
      if (component && (c === component || c.parents().includes(component))) return;
      seen.add(c.getAttributes()['data-pb-id']);
    });
  const fix = (c) => {
    const id = c.getAttributes()['data-pb-id'];
    if (id && seen.has(id)) c.addAttributes({ 'data-pb-id': newPbId() });
    c.components().forEach(fix);
  };
  if (component) fix(component);
}

export function createEditor({ container, panels, onAssetRequest, legacyAssets }) {
  const editor = grapesjs.init({
    container,
    height: '100%',
    width: 'auto',
    fromElement: false,
    storageManager: false,
    undoManager: { trackSelection: false },
    panels: { defaults: [] },
    showOffsets: true,
    noticeOnUnload: false,
    avoidInlineStyle: true,
    canvas: {
      styles: [`${FUNCTION_BASE}/api/public/page-base.css`, fontUrl(DEFAULT_THEME)],
    },
    protectedCss: '* { box-sizing: border-box; } body { margin: 0; }',
    canvasCss: CANVAS_CSS,
    deviceManager: {
      devices: [
        { id: 'desktop', name: 'Desktop', width: '' },
        { id: 'tablet', name: 'Tablet', width: '820px', widthMedia: '992px' },
        { id: 'mobile', name: 'Mobile', width: '390px', widthMedia: '600px' },
      ],
    },
    blockManager: { appendTo: panels.blocks },
    layerManager: { appendTo: panels.layers },
    styleManager: {
      appendTo: panels.styles,
      sectors: [
        { name: 'Typography', open: true, properties: ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'color', 'text-align', 'text-transform'] },
        { name: 'Spacing', open: false, properties: ['margin', 'padding'] },
        { name: 'Size', open: false, properties: ['width', 'max-width', 'min-height', 'height'] },
        { name: 'Background', open: false, properties: ['background-color', 'background'] },
        { name: 'Border', open: false, properties: ['border', 'border-radius', 'box-shadow'] },
        { name: 'Layout', open: false, properties: ['display', 'flex-direction', 'justify-content', 'align-items', 'gap', 'position', 'top', 'left', 'z-index', 'opacity'] },
      ],
    },
    selectorManager: { componentFirst: true },
    traitManager: { appendTo: panels.traits },
    assetManager: { custom: true },
    richTextEditor: { actions: ['bold', 'italic', 'underline', 'strikethrough', 'link'] },
    parser: { optionsHtml: { allowScripts: false, allowUnsafeAttr: false } },
  });

  registerFormComponents(editor);
  registerEmbedComponents(editor);

  editor.on('asset:custom', (props) => {
    if (props.open && onAssetRequest) onAssetRequest(props);
  });

  editor.on('block:drag:stop', (component) => {
    if (!component) return;
    const list = Array.isArray(component) ? component : [component];
    list.forEach((c) => c && ensureUniqueIds(editor, c));
  });
  editor.on('component:clone', (c) => ensureUniqueIds(editor, c));

  // Add an image placeholder's prompt as the alt text when generated later.
  editor.on('canvas:frame:load', () => {
    if (legacyAssets) addLegacyCanvasAssets(editor);
  });

  return editor;
}

// Body HTML/CSS for saving (GrapesJS wraps the page in <body>).
export function exportContent(editor) {
  const html = editor
    .getHtml()
    .replace(/^<body[^>]*>/i, '')
    .replace(/<\/body>\s*$/i, '');
  const css = editor.getCss({ avoidProtected: true }) || '';
  return { html, css };
}

export function findByPbId(editor, id) {
  if (!id || !editor.getWrapper()) return null;
  return editor.getWrapper().find(`[data-pb-id="${String(id).replace(/"/g, '')}"]`)[0] || null;
}

// Make sure the selected component can be addressed by AI.
export function ensurePbId(component) {
  if (!component || component.get('type') === 'wrapper') return null;
  const attrs = component.getAttributes();
  if (attrs['data-pb-id']) return attrs['data-pb-id'];
  const id = newPbId('e');
  component.addAttributes({ 'data-pb-id': id });
  return id;
}

export function sectionOf(component) {
  let c = component;
  while (c && c.get('type') !== 'wrapper') {
    if (c.getAttributes()['data-pb-section']) return c;
    c = c.parent();
  }
  return null;
}
