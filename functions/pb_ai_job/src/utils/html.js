'use strict';

// Cleans HTML that comes from the AI before it reaches the editor. Removes
// scripts, inline event handlers, javascript: URLs and iframes other than
// video/map embeds. (Users can still add custom code manually in the
// builder; this guards against model output only.)

const ALLOWED_IFRAME = /^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|player\.vimeo\.com|maps\.google\.com|www\.google\.com\/maps)/i;

function sanitizeHtml(html) {
  let s = String(html || '');
  s = s.replace(/<script\b[\s\S]*?<\/script\s*>/gi, '').replace(/<script\b[^>]*>/gi, '');
  s = s.replace(/<(link|meta|base|object|embed)\b[^>]*>/gi, '');
  s = s.replace(/<style\b[\s\S]*?<\/style\s*>/gi, '');
  s = s.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  s = s.replace(/(href|src|action|formaction)\s*=\s*("|')\s*(javascript|vbscript|data:text\/html)[^"']*\2/gi, '$1="#"');
  s = s.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi, (m) => {
    const src = (m.match(/\ssrc\s*=\s*"([^"]*)"/i) || [])[1] || '';
    return ALLOWED_IFRAME.test(src) ? m : '';
  });
  return s.trim();
}

// Visible text of an HTML fragment (for SEO prompts, outlines).
function textOf(html, max = 20000) {
  return String(html || '')
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

module.exports = { sanitizeHtml, textOf };
