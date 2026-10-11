'use strict';

// Section library: turns a section spec (plain data) into editable HTML that
// uses the pb-* design system from pageStyles.js.
//
// One renderer serves three producers, so every page looks consistent and
// stays editable the same way:
//   - system templates (shared/templates.js)
//   - AI page/section generation (services/ai/*)
//   - the builder's block panel (GET /api/templates/blocks)
//
// Every section root carries data-pb-section="<type>" and a stable
// data-pb-id, which the AI modification service uses to target changes.

const crypto = require('crypto');
const config = require('../config');
const { escapeHtml: e, escapeAttr: a } = require('../utils/text');
const { formHtml } = require('./formMarkup');

const SECTION_TYPES = [
  'navbar', 'hero', 'features', 'media_text', 'stats', 'steps', 'testimonials', 'pricing', 'faq',
  'cta', 'gallery', 'team', 'logos', 'lead_form', 'location', 'video', 'countdown', 'text', 'footer',
];

const VARIANTS = {
  navbar: ['simple', 'centered', 'dark'],
  hero: ['centered', 'split-image', 'split-form', 'background-image', 'minimal', 'showcase'],
  features: ['cards', 'icons', 'bento', 'list', 'numbered'],
  stats: ['plain', 'cards', 'band'],
  steps: ['cards', 'timeline'],
  testimonials: ['cards', 'single'],
  faq: ['stacked', 'split'],
  gallery: ['grid', 'wide'],
  footer: ['columns', 'simple', 'centered'],
  media_text: ['image-left', 'image-right'],
  lead_form: ['card', 'split-text'],
  cta: ['banner', 'band'],
};

const BACKGROUNDS = ['light', 'alt', 'dark', 'primary', 'gradient'];

const newId = (prefix = 's') => `${prefix}${crypto.randomBytes(4).toString('hex')}`;

function placeholderUrl(label, w = 1200, h = 900) {
  const t = encodeURIComponent(String(label || 'Image').slice(0, 60));
  return `${config.functionBase}/api/public/placeholder.svg?w=${w}&h=${h}&t=${t}`;
}

// An <img>. Without a URL it renders a placeholder that remembers its prompt,
// so the builder's "Generate images" action (or the AI pipeline) can fill it.
function img(item = {}, w = 1200, h = 900, extra = '') {
  const alt = item.imageAlt || item.title || item.heading || 'Image';
  if (item.imageUrl) return `<img src="${a(item.imageUrl)}" alt="${a(alt)}" loading="lazy"${extra}>`;
  const prompt = item.imagePrompt || alt;
  return `<img src="${a(placeholderUrl(alt, w, h))}" alt="${a(alt)}" data-pb-image-prompt="${a(prompt)}" data-pb-image-size="${w}x${h}" loading="lazy"${extra}>`;
}

function bgClass(bg) {
  return { alt: ' pb-section--alt', dark: ' pb-section--dark', primary: ' pb-section--primary', gradient: ' pb-section--gradient' }[bg] || '';
}

function wrap(s, inner, extraClass = '', tag = 'section') {
  const anchor = s.anchorId ? ` id="${a(s.anchorId)}"` : '';
  return `<${tag} class="pb-section${bgClass(s.background)}${extraClass}" data-pb-section="${s.type}" data-pb-id="${a(s.pbId || newId())}"${anchor}>${inner}</${tag}>`;
}

function head(s, center = true) {
  if (!s.heading && !s.subheading && !s.eyebrow) return '';
  return (
    `<div class="pb-section-head${center ? ' pb-center' : ''}">` +
    (s.eyebrow ? `<span class="pb-eyebrow">${e(s.eyebrow)}</span>` : '') +
    (s.heading ? `<h2 class="pb-h2">${e(s.heading)}</h2>` : '') +
    (s.subheading ? `<p class="pb-lead">${e(s.subheading)}</p>` : '') +
    `</div>`
  );
}

function buttons(s, onDark = false) {
  const out = [];
  if (s.ctaLabel) {
    out.push(`<a class="pb-btn pb-btn--primary pb-btn--lg" href="${a(s.ctaHref || '#lead-form')}">${e(s.ctaLabel)}</a>`);
  }
  if (s.secondaryCtaLabel) {
    out.push(
      `<a class="pb-btn ${onDark ? 'pb-btn--ghost' : 'pb-btn--outline'} pb-btn--lg" href="${a(s.secondaryCtaHref || '#features')}">${e(s.secondaryCtaLabel)}</a>`,
    );
  }
  return out.length ? `<div class="pb-actions">${out.join('')}</div>` : '';
}

const items = (s) => (Array.isArray(s.items) ? s.items : []);
const paragraphs = (text) =>
  String(text || '')
    .split(/\n{2,}|\n/)
    .filter((p) => p.trim())
    .map((p) => `<p class="pb-text">${e(p.trim())}</p>`)
    .join('');

function formCard(s) {
  const title = s.formTitle || 'Get in touch';
  const sub = s.formSubtitle || '';
  return (
    `<div class="pb-form-card" id="lead-form">` +
    `<h3 class="pb-h3">${e(title)}</h3>${sub ? `<p class="pb-form-card__sub">${e(sub)}</p>` : ''}` +
    formHtml(s.formFields, {
      submitLabel: s.formSubmitLabel || s.ctaLabel || 'Submit',
      successMessage: s.successMessage,
      steps: s.formSteps,
      single: s.formSingleColumn,
    }) +
    `</div>`
  );
}

const R = {
  navbar(s) {
    const links = items(s).length ? items(s) : [{ title: 'Features', href: '#features' }, { title: 'FAQ', href: '#faq' }];
    return (
      `<header class="pb-nav${s.variant === 'centered' ? ' pb-nav--centered' : s.variant === 'dark' ? ' pb-nav--dark' : ''}" data-pb-section="navbar" data-pb-id="${a(s.pbId || newId())}"><div class="pb-nav__inner">` +
      `<a class="pb-nav__brand" href="#">${e(s.brandName || s.heading || 'Brand')}</a>` +
      `<nav class="pb-nav__links">${links.map((l) => `<a href="${a(l.href || `#${(l.title || '').toLowerCase().replace(/\s+/g, '-')}`)}">${e(l.title)}</a>`).join('')}</nav>` +
      (s.ctaLabel ? `<a class="pb-btn pb-btn--primary" href="${a(s.ctaHref || '#lead-form')}">${e(s.ctaLabel)}</a>` : '') +
      `</div></header>`
    );
  },

  hero(s) {
    const v = VARIANTS.hero.includes(s.variant) ? s.variant : 'split-image';
    const onDark = ['dark', 'primary', 'gradient'].includes(s.background) || v === 'background-image';
    const badges = items(s).length
      ? `<div class="pb-badges">${items(s).map((b) => `<span class="pb-badge">${e(b.icon ? `${b.icon} ` : '')}${e(b.title || b.label || '')}</span>`).join('')}</div>`
      : '';
    const copy =
      (s.eyebrow ? `<span class="pb-eyebrow">${e(s.eyebrow)}</span>` : '') +
      `<h1 class="pb-h1">${e(s.heading || 'Your headline goes here')}</h1>` +
      (s.subheading ? `<p class="pb-lead">${e(s.subheading)}</p>` : '') +
      buttons(s, onDark) +
      badges;

    if (v === 'centered') {
      return wrap(s, `<div class="pb-container pb-container--narrow pb-center">${copy}</div>`, ' pb-hero');
    }
    // Oversized headline on a soft grid, no image: confident and minimal.
    if (v === 'minimal') {
      return wrap(s, `<div class="pb-container">${copy}</div>`, ' pb-hero pb-hero--minimal');
    }
    // Centered copy above a wide, framed image (product or hero shot).
    if (v === 'showcase') {
      return wrap(
        s,
        `<div class="pb-container"><div class="pb-showcase__copy">${copy}</div><div class="pb-showcase"><div class="pb-media">${img(s, 1600, 900)}</div></div></div>`,
        ' pb-hero pb-hero--showcase',
      );
    }
    if (v === 'background-image') {
      const url = s.imageUrl || placeholderUrl(s.imageAlt || s.heading, 1920, 1080);
      const prompt = s.imageUrl ? '' : ` data-pb-image-prompt="${a(s.imagePrompt || s.heading || 'Hero background')}" data-pb-image-size="1920x1080"`;
      return `<section class="pb-section pb-hero pb-hero--image" data-pb-section="hero" data-pb-id="${a(s.pbId || newId())}" style="background-image:url('${a(url)}')"${prompt}${s.anchorId ? ` id="${a(s.anchorId)}"` : ''}><div class="pb-container"><div style="max-width:720px">${copy}</div></div></section>`;
    }
    const right = v === 'split-form' ? formCard(s) : `<div class="pb-media">${img(s, 1200, 900)}</div>`;
    return wrap(s, `<div class="pb-container pb-split"><div>${copy}</div>${right}</div>`, ' pb-hero');
  },

  features(s) {
    const cols = items(s).length === 4 || items(s).length === 8 ? 4 : items(s).length === 2 ? 2 : 3;
    const cards = items(s)
      .map(
        (it) =>
          `<div class="pb-card pb-card--hover">${it.icon ? `<div class="pb-icon">${e(it.icon)}</div>` : ''}<h3 class="pb-h3">${e(it.title)}</h3><p class="pb-text pb-muted">${e(it.text)}</p></div>`,
      )
      .join('');
    if (s.variant === 'bento') {
      return wrap({ anchorId: 'features', ...s }, `<div class="pb-container">${head(s)}<div class="pb-bento">${cards}</div></div>`);
    }
    // Heading on the left, features as rows on the right.
    if (s.variant === 'list') {
      const rows = items(s)
        .map((it) => `<div class="pb-feature-row">${it.icon ? `<div class="pb-icon">${e(it.icon)}</div>` : ''}<div><h3 class="pb-h3">${e(it.title)}</h3><p class="pb-text pb-muted">${e(it.text)}</p></div></div>`)
        .join('');
      return wrap({ anchorId: 'features', ...s }, `<div class="pb-container pb-feature-list"><div class="pb-feature-list__head">${head(s, false)}${buttons(s)}</div><div>${rows}</div></div>`);
    }
    // Big gradient numbers instead of icons, no boxes.
    if (s.variant === 'numbered') {
      const cells = items(s)
        .map((it, i) => `<div class="pb-num-card"><div class="pb-num">${String(i + 1).padStart(2, '0')}</div><h3 class="pb-h3">${e(it.title)}</h3><p class="pb-text pb-muted">${e(it.text)}</p></div>`)
        .join('');
      return wrap({ anchorId: 'features', ...s }, `<div class="pb-container">${head(s)}<div class="pb-grid pb-grid--${cols}">${cells}</div></div>`);
    }
    return wrap({ anchorId: 'features', ...s }, `<div class="pb-container">${head(s)}<div class="pb-grid pb-grid--${cols}">${cards}</div></div>`);
  },

  media_text(s) {
    const reverse = s.variant === 'image-right';
    const bullets = items(s).length ? `<ul class="pb-list">${items(s).map((it) => `<li>${e(it.title || it.text)}</li>`).join('')}</ul>` : '';
    const copy =
      `<div>${s.eyebrow ? `<span class="pb-eyebrow">${e(s.eyebrow)}</span>` : ''}<h2 class="pb-h2">${e(s.heading || '')}</h2>` +
      `${paragraphs(s.body || s.subheading)}${bullets}${buttons(s)}</div>`;
    const media = `<div class="pb-media">${img(s, 1200, 900)}</div>`;
    return wrap(s, `<div class="pb-container pb-split${reverse ? ' pb-split--reverse' : ''}">${media}${copy}</div>`);
  },

  stats(s) {
    if (s.variant === 'band') {
      const band = items(s).map((it) => `<div><div class="pb-stat__value">${e(it.value)}</div><div class="pb-stat__label">${e(it.label || it.title)}</div></div>`).join('');
      return wrap({ background: 'primary', ...s }, `<div class="pb-container">${head(s)}<div class="pb-stats pb-stats--band">${band}</div></div>`, ' pb-section--tight');
    }
    const cells = items(s)
      .map((it) => `<div class="pb-center${s.variant === 'cards' ? ' pb-card' : ''}"><div class="pb-stat__value">${e(it.value)}</div><div class="pb-stat__label">${e(it.label || it.title)}</div></div>`)
      .join('');
    return wrap({ background: 'alt', ...s }, `<div class="pb-container">${head(s)}<div class="pb-stats">${cells}</div></div>`, ' pb-section--tight');
  },

  steps(s) {
    if (s.variant === 'timeline') {
      const rows = items(s)
        .map((it, i) => `<div class="pb-timeline__item"><div class="pb-step__num">${i + 1}</div><div><h3 class="pb-h3">${e(it.title)}</h3><p class="pb-text pb-muted">${e(it.text)}</p></div></div>`)
        .join('');
      return wrap(s, `<div class="pb-container pb-container--narrow">${head(s)}<div class="pb-timeline">${rows}</div></div>`);
    }
    const cells = items(s)
      .map((it, i) => `<div class="pb-card"><div class="pb-step__num">${i + 1}</div><h3 class="pb-h3">${e(it.title)}</h3><p class="pb-text pb-muted">${e(it.text)}</p></div>`)
      .join('');
    const cols = Math.min(Math.max(items(s).length, 2), 4);
    return wrap(s, `<div class="pb-container">${head(s)}<div class="pb-grid pb-grid--${cols}">${cells}</div></div>`);
  },

  testimonials(s) {
    if (s.variant === 'single' && items(s).length) {
      const it = items(s)[0];
      return wrap(
        { background: 'alt', ...s },
        `<div class="pb-container pb-container--narrow pb-center">${s.eyebrow ? `<span class="pb-eyebrow">${e(s.eyebrow)}</span>` : ''}<div class="pb-stars">★★★★★</div>` +
          `<p class="pb-quote pb-quote--hero">${e(it.text)}</p><div class="pb-h4" style="margin:0">${e(it.author || it.title)}</div>` +
          `<div class="pb-muted" style="font-size:15px">${e(it.role || it.label || '')}</div></div>`,
      );
    }
    const cards = items(s)
      .map((it) => {
        const initials = String(it.author || it.title || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
        return (
          `<div class="pb-card"><div class="pb-stars">★★★★★</div><p class="pb-quote">${e(it.text)}</p>` +
          `<div class="pb-person"><div class="pb-avatar">${e(initials)}</div><div><div class="pb-h4" style="margin:0">${e(it.author || it.title)}</div>` +
          `<div class="pb-muted" style="font-size:14px">${e(it.role || it.label || '')}</div></div></div></div>`
        );
      })
      .join('');
    const cols = items(s).length >= 3 ? 3 : 2;
    return wrap({ background: 'alt', ...s }, `<div class="pb-container">${head(s)}<div class="pb-grid pb-grid--${cols}">${cards}</div></div>`);
  },

  pricing(s) {
    const cards = items(s)
      .map((it) => {
        const feats = Array.isArray(it.features) ? it.features : [];
        return (
          `<div class="pb-card${it.featured ? ' pb-plan--featured' : ''}">${it.featured ? '<span class="pb-plan__tag">Most popular</span>' : ''}` +
          `<h3 class="pb-h3">${e(it.title)}</h3><div class="pb-price">${e(it.price)}</div><p class="pb-muted">${e(it.text || it.period || '')}</p>` +
          `<ul class="pb-list">${feats.map((f) => `<li>${e(f)}</li>`).join('')}</ul>` +
          `<a class="pb-btn ${it.featured ? 'pb-btn--primary' : 'pb-btn--outline'} pb-btn--block" href="${a(s.ctaHref || '#lead-form')}">${e(s.ctaLabel || 'Choose plan')}</a></div>`
        );
      })
      .join('');
    return wrap({ anchorId: 'pricing', ...s }, `<div class="pb-container">${head(s)}<div class="pb-grid pb-grid--${Math.min(Math.max(items(s).length, 2), 4)}">${cards}</div></div>`);
  },

  faq(s) {
    const qs = items(s).map((it, i) => `<details${i === 0 ? ' open' : ''}><summary>${e(it.title)}</summary><p>${e(it.text)}</p></details>`).join('');
    if (s.variant === 'split') {
      return wrap({ anchorId: 'faq', ...s }, `<div class="pb-container pb-faq-split"><div>${head(s, false)}${buttons(s)}</div><div class="pb-faq">${qs}</div></div>`);
    }
    return wrap({ anchorId: 'faq', ...s }, `<div class="pb-container pb-container--narrow">${head(s)}<div class="pb-faq">${qs}</div></div>`);
  },

  cta(s) {
    if (s.variant === 'band') {
      return wrap({ background: 'primary', ...s }, `<div class="pb-container pb-center"><h2 class="pb-h2">${e(s.heading)}</h2>${s.subheading ? `<p class="pb-lead">${e(s.subheading)}</p>` : ''}<div class="pb-actions"><a class="pb-btn pb-btn--light pb-btn--lg" href="${a(s.ctaHref || '#lead-form')}">${e(s.ctaLabel || 'Get started')}</a></div></div>`);
    }
    return wrap(
      s,
      `<div class="pb-container"><div class="pb-cta"><div><h2 class="pb-h2" style="margin-bottom:8px">${e(s.heading)}</h2>${s.subheading ? `<p class="pb-lead">${e(s.subheading)}</p>` : ''}</div>` +
        `<a class="pb-btn pb-btn--light pb-btn--lg" href="${a(s.ctaHref || '#lead-form')}">${e(s.ctaLabel || 'Get started')}</a></div></div>`,
    );
  },

  gallery(s) {
    const figs = (items(s).length ? items(s) : [{}, {}, {}])
      .map((it) => `<figure>${img(it, 900, 675)}${it.title ? `<figcaption>${e(it.title)}</figcaption>` : ''}</figure>`)
      .join('');
    return wrap(s, `<div class="pb-container">${head(s)}<div class="pb-gallery${s.variant === 'wide' ? ' pb-gallery--wide' : ''}">${figs}</div></div>`);
  },

  team(s) {
    const cells = items(s)
      .map((it) => `<div class="pb-team pb-center">${img({ ...it, imageAlt: it.title }, 600, 600)}<h3 class="pb-h4" style="margin:0">${e(it.title)}</h3><div class="pb-muted">${e(it.label || it.role || '')}</div></div>`)
      .join('');
    return wrap(s, `<div class="pb-container">${head(s)}<div class="pb-grid pb-grid--${Math.min(Math.max(items(s).length, 2), 4)}">${cells}</div></div>`);
  },

  logos(s) {
    return wrap(
      { background: 'alt', ...s },
      `<div class="pb-container pb-center">${s.heading ? `<p class="pb-muted" style="margin:0 0 20px;font-weight:600">${e(s.heading)}</p>` : ''}<div class="pb-logos">${items(s).map((it) => `<span>${e(it.title)}</span>`).join('')}</div></div>`,
      ' pb-section--tight',
    );
  },

  lead_form(s) {
    if (s.variant === 'split-text') {
      const bullets = items(s).length ? `<ul class="pb-list">${items(s).map((it) => `<li>${e(it.title || it.text)}</li>`).join('')}</ul>` : '';
      return wrap(
        { anchorId: 'contact', background: 'alt', ...s },
        `<div class="pb-container pb-split"><div>${s.eyebrow ? `<span class="pb-eyebrow">${e(s.eyebrow)}</span>` : ''}<h2 class="pb-h2">${e(s.heading || 'Talk to us')}</h2>${paragraphs(s.body || s.subheading)}${bullets}</div>${formCard(s)}</div>`,
      );
    }
    return wrap({ anchorId: 'contact', background: 'alt', ...s }, `<div class="pb-container pb-container--narrow">${head(s)}${formCard(s)}</div>`);
  },

  location(s) {
    const q = encodeURIComponent(s.address || s.heading || 'India');
    const lines = items(s).map((it) => `<li>${e(it.title || it.text)}</li>`).join('');
    return wrap(
      { anchorId: 'location', ...s },
      `<div class="pb-container pb-split"><div>${s.eyebrow ? `<span class="pb-eyebrow">${e(s.eyebrow)}</span>` : ''}<h2 class="pb-h2">${e(s.heading || 'Visit us')}</h2>${paragraphs(s.body || s.address)}${lines ? `<ul class="pb-list">${lines}</ul>` : ''}${buttons(s)}</div>` +
        `<div class="pb-map"><iframe loading="lazy" title="Map" src="https://maps.google.com/maps?q=${q}&output=embed"></iframe></div></div>`,
    );
  },

  video(s) {
    const url = String(s.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ').replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/');
    return wrap(s, `<div class="pb-container pb-container--narrow">${head(s)}<div class="pb-video"><iframe src="${a(url)}" title="Video" allowfullscreen loading="lazy"></iframe></div></div>`);
  },

  countdown(s) {
    const target = s.targetDate || new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
    const box = (k, l) => `<div class="pb-countdown__box"><div class="pb-countdown__value" data-pb-countdown-part="${k}">00</div><div class="pb-countdown__label">${l}</div></div>`;
    return wrap(
      { background: 'dark', ...s },
      `<div class="pb-container pb-split"><div><h2 class="pb-h2">${e(s.heading || 'Offer ends soon')}</h2>${s.subheading ? `<p class="pb-lead">${e(s.subheading)}</p>` : ''}${buttons(s, true)}</div>` +
        `<div class="pb-countdown" data-pb-countdown="${a(target)}">${box('d', 'Days')}${box('h', 'Hours')}${box('m', 'Minutes')}${box('s', 'Seconds')}</div></div>`,
      ' pb-section--tight',
    );
  },

  text(s) {
    return wrap(s, `<div class="pb-container pb-container--narrow">${s.eyebrow ? `<span class="pb-eyebrow">${e(s.eyebrow)}</span>` : ''}${s.heading ? `<h2 class="pb-h2">${e(s.heading)}</h2>` : ''}${paragraphs(s.body || s.subheading)}</div>`);
  },

  footer(s) {
    const links = items(s).map((it) => `<a href="${a(it.href || '#')}">${e(it.title)}</a>`).join('');
    const legal = e(s.legal || `© ${new Date().getFullYear()} ${s.brandName || ''}. All rights reserved.`);
    const brand = e(s.brandName || s.heading || 'Brand');
    const open = (mod) => `<footer class="pb-footer${mod}" data-pb-section="footer" data-pb-id="${a(s.pbId || newId())}"><div class="pb-container">`;
    if (s.variant === 'simple') {
      return `${open(' pb-footer--simple')}<div class="pb-footer__row"><div class="pb-footer__brand">${brand}</div><div class="pb-footer__links">${links}</div><div class="pb-footer__legal">${legal}</div></div></div></footer>`;
    }
    if (s.variant === 'centered') {
      return `${open(' pb-footer--centered')}<div class="pb-footer__brand">${brand}</div>${s.body ? `<p>${e(s.body)}</p>` : ''}<div class="pb-footer__links">${links}</div><div class="pb-footer__legal">${legal}</div></div></footer>`;
    }
    return (
      `${open('')}<div class="pb-footer__grid">` +
      `<div><div class="pb-footer__brand">${brand}</div><p>${e(s.body || s.subheading || '')}</p></div>` +
      `<div class="pb-footer__links">${links}</div></div>` +
      `<div class="pb-footer__legal">${legal}</div></div></footer>`
    );
  },
};

function normalizeSection(input = {}) {
  const type = SECTION_TYPES.includes(input.type) ? input.type : 'text';
  const out = { ...input, type };
  if (out.background && !BACKGROUNDS.includes(out.background)) out.background = 'light';
  // Drop empty values so per-section defaults ({ background: 'alt', ...s })
  // are not overwritten by undefined/empty fields from AI output.
  Object.keys(out).forEach((k) => {
    if (out[k] === undefined || out[k] === null || out[k] === '') delete out[k];
  });
  return out;
}

function renderSection(spec) {
  const s = normalizeSection(spec);
  return R[s.type](s);
}

function renderSections(sections = []) {
  return sections.map(renderSection).join('\n');
}

module.exports = { SECTION_TYPES, VARIANTS, BACKGROUNDS, renderSection, renderSections, placeholderUrl, newId };
