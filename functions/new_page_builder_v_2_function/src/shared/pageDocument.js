'use strict';

const { renderSections } = require('./sectionLibrary');
const { BASE_CSS, fontLinks, themeVars } = require('./pageStyles');
const { escapeHtml: e, escapeAttr: a } = require('../utils/text');

const DEFAULT_THEME = {
  primary: '#004AAD',
  accent: '#F59E0B',
  dark: '#0B1B33',
  font: 'Inter',
  headingFont: 'Inter',
  radius: '14px',
};

const mergeTheme = (theme) => ({ ...DEFAULT_THEME, ...(theme || {}) });

// Page spec (theme + sections) -> what the builder loads: body HTML (sections)
// and the theme. The theme is applied in the editor as a :root rule, so it
// also ends up in the exported CSS.
function renderSpec(spec = {}) {
  const theme = mergeTheme(spec.theme);
  return {
    html: renderSections(spec.sections || []),
    css: themeVars(theme),
    theme,
  };
}

// Full standalone HTML document for a published page.
//   body/css   - GrapesJS getHtml()/getCss() output of the version
//   head       - extra tags (SEO meta, runtime config, scripts)
function buildDocument({ title, description, body, css, theme, headExtra = '', bodyExtra = '', legacyAssets = false, assetBase = '' }) {
  const t = mergeTheme(theme);
  const legacy = legacyAssets
    ? `<link rel="stylesheet" href="${a(assetBase)}/css/bootstrap.min.css"><script src="${a(assetBase)}/js/tailwind.js"></script>`
    : '';
  return (
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    `<title>${e(title || 'Page')}</title>` +
    (description ? `<meta name="description" content="${a(description)}">` : '') +
    (title ? `<meta property="og:title" content="${a(title)}">` : '') +
    (description ? `<meta property="og:description" content="${a(description)}">` : '') +
    fontLinks(t) +
    legacy +
    `<style id="pb-base">${themeVars(t)}${BASE_CSS}</style>` +
    `<style id="pb-page">${css || ''}</style>` +
    headExtra +
    `</head><body>${body || ''}${bodyExtra}</body></html>`
  );
}

module.exports = { DEFAULT_THEME, mergeTheme, renderSpec, buildDocument };
