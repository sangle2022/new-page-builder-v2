'use strict';

// Renders published pages (/p/:slug) and authenticated previews as complete
// HTML documents. The page body is the GrapesJS output of the live version;
// this service wraps it with the base design system, SEO tags, the runtime
// that powers forms/tracking, captcha and the Meta pixel.

const config = require('../config');
const db = require('../utils/db');
const pages = require('./page.service');
const storage = require('./storage.service');
const settingsService = require('./settings.service');
const { closedReason } = require('./lead.service');
const { buildDocument } = require('../shared/pageDocument');
const { escapeHtml: e } = require('../utils/text');
const { slugify } = require('../utils/text');

// JSON safe to embed in a <script> tag.
const jsonForScript = (v) =>
  JSON.stringify(v)
    .split('<').join('\\u003c')
    .split(String.fromCharCode(0x2028)).join('')
    .split(String.fromCharCode(0x2029)).join('');

function pixelSnippet(id) {
  if (!id || !/^\d{5,20}$/.test(String(id))) return '';
  return (
    '<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?' +
    'n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;' +
    "n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];" +
    "s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');" +
    `fbq('init','${id}');fbq('track','PageView');</script>`
  );
}

function messagePage(title, text, status = 404) {
  const body =
    '<section class="pb-section" style="min-height:100vh;display:flex;align-items:center">' +
    '<div class="pb-container pb-container--narrow pb-center">' +
    `<h1 class="pb-h2">${e(title)}</h1><p class="pb-lead">${e(text)}</p></div></section>`;
  return { status, html: buildDocument({ title, body, css: '' }) };
}

// A page that stopped accepting responses keeps its content, but every lead
// form is replaced by the closed message.
function closeForms(html, message) {
  return String(html).replace(
    /<form\b[^>]*data-pb-form[^>]*>[\s\S]*?<\/form>/gi,
    `<div class="pb-form-success"><div class="pb-form-success__icon">!</div><p class="pb-muted">${e(message)}</p></div>`,
  );
}

async function documentFor(capp, row, render, { preview = false, versionLabel = '' } = {}) {
  const page = pages.toDto(row);
  const s = page.settings;
  let html = (render && render.html) || '';
  const css = (render && render.css) || '';

  const reason = preview ? null : closedReason(page);
  if (reason) html = closeForms(html, s.closedMessage);

  const usesCaptcha = s.captcha || /data-pb-captcha="true"/.test(html);
  const captchaKeys = usesCaptcha ? await settingsService.getCaptchaKeys(capp).catch(() => null) : null;
  const siteKey = captchaKeys && captchaKeys.siteKey;

  const runtimeConfig = {
    pageId: String(row.ROWID),
    slug: page.slug,
    api: `${config.functionBase}/api/public`,
    preview,
    captcha: !!s.captcha,
    captchaSiteKey: siteKey || null,
    partialCapture: s.partialCapture !== false,
  };

  let head = `<script>window.__PB=${jsonForScript(runtimeConfig)}</script>`;
  // Scroll animations: hide-until-visible only once JS is known to run, and
  // show everything if the runtime has not started within 3 s.
  if (s.animations !== false && !s.legacyAssets) {
    head +=
      "<script>document.documentElement.classList.add('pb-js');" +
      "setTimeout(function(){if(!window.__PB_REVEAL)document.documentElement.classList.remove('pb-js')},3000)</script>";
  }
  head += `<script src="${config.functionBase}/api/public/runtime.js" defer></script>`;
  if (siteKey && !preview) head += '<script src="https://www.google.com/recaptcha/api.js?render=explicit" async defer></script>';
  if (!preview) head += pixelSnippet(s.pixelId || config.metaPixelId);
  if (preview) head += '<meta name="robots" content="noindex,nofollow">';
  if (s.seo && s.seo.ogImage) head += `<meta property="og:image" content="${e(s.seo.ogImage)}">`;
  if (s.seo && s.seo.noIndex) head += '<meta name="robots" content="noindex">';

  const banner = preview
    ? `<div style="position:fixed;z-index:99999;left:50%;bottom:16px;transform:translateX(-50%);background:#0B1B33;color:#fff;` +
      `font:600 13px/1.2 system-ui,sans-serif;padding:10px 16px;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,.25)">` +
      `Preview${versionLabel ? ` · ${e(versionLabel)}` : ''} · forms are not submitted</div>`
    : '';

  return buildDocument({
    title: page.title || page.name,
    description: page.description,
    body: html,
    css,
    theme: s.theme,
    headExtra: head,
    bodyExtra: banner,
    legacyAssets: !!s.legacyAssets,
    assetBase: config.clientBase,
  });
}

async function liveRender(capp, row) {
  if (row.LiveFileID) return storage.getJson(capp, row.LiveFileID);
  // A V1 page that was published in V1 and has not been republished in V2.
  if (!row.ProjectFileID && row.FileID) return pages.legacyRender(capp, row);
  return null;
}

async function renderPublished(capp, slugParam) {
  const slug = slugify(slugParam);
  const row = await db.selectOne(capp, 'Pages', `pageSlug = ${db.q(slug)}`);
  if (!row || db.toBool(row.IsDeleted) || row.Status === 'Deleted') {
    return messagePage('Page not found', 'The page you are looking for does not exist or has been removed.');
  }
  const page = pages.toDto(row);
  if (!page.isLive) return messagePage('Page not available', 'This page is not available right now. Please check back later.');
  const render = await liveRender(capp, row);
  if (!render) return messagePage('Page not available', 'This page is being updated. Please check back shortly.', 503);
  return { status: 200, html: await documentFor(capp, row, render), page };
}

// Authenticated preview: the working draft, or a specific version.
async function renderPreview(capp, id, { version } = {}) {
  const row = await pages.getRow(capp, id);
  let render;
  let label = 'Draft';
  if (version) {
    render = await pages.getVersionRender(capp, id, version);
    label = `Version ${version}`;
  } else if (row.ProjectFileID) {
    render = await storage.getJson(capp, row.FileID);
  } else {
    render = await pages.legacyRender(capp, row);
  }
  return { status: 200, html: await documentFor(capp, row, render || { html: '', css: '' }, { preview: true, versionLabel: label }) };
}

// Public link of a page. Behind Catalyst's proxy the function may see the
// internal protocol/port ("http://host:443"); published links are always
// https on the public host, without a default port.
function publicUrl(req, slug) {
  const rawHost = String(req.get('x-forwarded-host') || req.get('host') || '').split(',')[0].trim();
  const host = rawHost.replace(/:(443|80)$/, '');
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  const proto = local ? String(req.get('x-forwarded-proto') || req.protocol || 'http').split(',')[0] : 'https';
  return `${proto}://${host}${config.functionBase}/p/${slug}`;
}

module.exports = { renderPublished, renderPreview, messagePage, publicUrl };
