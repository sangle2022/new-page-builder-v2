'use strict';

// Resolves the acquisition channel of a visit or lead.
// Priority: explicit ?ch= (our share links and QR codes) -> UTM source/medium
// -> embedded in another site -> referrer domain -> Direct.

const CHANNELS = [
  'Direct', 'Email', 'Facebook', 'Instagram', 'LinkedIn', 'Google Ads', 'Organic Search',
  'QR Code', 'WhatsApp', 'Website Embed', 'Referral', 'SMS', 'YouTube', 'X (Twitter)', 'Other',
];

const ALIASES = [
  [/^(qr|qr[_-]?code|qrcode)$/, 'QR Code'],
  [/whats ?app|^wa$/, 'WhatsApp'],
  [/^(fb|facebook|meta)$|facebook\.com$|fb\.com$/, 'Facebook'],
  [/^(ig|insta|instagram)$|instagram\.com$/, 'Instagram'],
  [/linkedin|lnkd\.in/, 'LinkedIn'],
  [/^(email|e-?mail|newsletter|mailchimp|zoho ?campaigns|brevo)$/, 'Email'],
  [/^(sms|text)$/, 'SMS'],
  [/youtube|youtu\.be/, 'YouTube'],
  [/^(x|twitter)$|twitter\.com$|^t\.co$|^x\.com$/, 'X (Twitter)'],
  [/^(embed|website[_ -]?embed)$/, 'Website Embed'],
  [/^(google[_ -]?ads|adwords)$/, 'Google Ads'],
  [/^(direct|none)$/, 'Direct'],
];

function matchAlias(value) {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return null;
  for (const [re, name] of ALIASES) if (re.test(v)) return name;
  return CHANNELS.find((c) => c.toLowerCase() === v) || null;
}

function resolveChannel({ ch, utm_source: src, utm_medium: medium, referrer, embedded } = {}) {
  const explicit = matchAlias(ch);
  if (explicit) return explicit;

  const m = String(medium || '').toLowerCase();
  const s = String(src || '').toLowerCase();
  if (s || m) {
    if (/google|adwords/.test(s) && /cpc|ppc|paid/.test(m)) return 'Google Ads';
    const bySource = matchAlias(s);
    if (bySource) return bySource;
    if (m === 'email') return 'Email';
    if (m === 'qr' || m === 'qr_code') return 'QR Code';
    if (/organic|seo/.test(m)) return 'Organic Search';
    return 'Other';
  }

  if (embedded) return 'Website Embed';

  if (referrer) {
    let host = '';
    try {
      host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      host = '';
    }
    if (host) {
      if (/(^|\.)google\.|bing\.com|duckduckgo\.com|yahoo\.|baidu\.com/.test(host)) return 'Organic Search';
      const byHost = matchAlias(host);
      if (byHost) return byHost;
      if (/^mail\./.test(host)) return 'Email';
      return 'Referral';
    }
  }
  return 'Direct';
}

function deviceFromUserAgent(ua) {
  const s = String(ua || '');
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(s)) return 'Tablet';
  if (/Mobi|iPhone|Android|IEMobile|Opera Mini/i.test(s)) return 'Mobile';
  return 'Desktop';
}

module.exports = { CHANNELS, resolveChannel, deviceFromUserAgent };
