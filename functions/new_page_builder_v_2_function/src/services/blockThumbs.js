'use strict';

// Small wireframe previews (SVG) for the builder's section blocks, so each
// header / hero / footer layout can be recognised at a glance.

const P = '#004AAD';
const L = '#CBD5E1';
const LL = '#E2E8F0';
const D = '#0B1B33';
const T = '#94A3B8';
const A = '#F59E0B';

const R = (x, y, w, h, f, rx = 2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}"/>`;
const C = (x, y, r, f) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"/>`;
const img = (x, y, w, h, rx = 3) =>
  R(x, y, w, h, '#DCE6F5', rx) + `<path d="M${x + w * 0.15} ${y + h * 0.82} L${x + w * 0.42} ${y + h * 0.42} L${x + w * 0.62} ${y + h * 0.66} L${x + w * 0.74} ${y + h * 0.52} L${x + w * 0.9} ${y + h * 0.82}Z" fill="#9DB4DB"/>` + C(x + w * 0.75, y + h * 0.28, Math.min(w, h) * 0.09, '#B9CBE8');
const lines = (x, y, w, n, gap = 5, f = L) => Array.from({ length: n }, (_, i) => R(x, y + i * gap, i === n - 1 ? w * 0.6 : w, 2.4, f, 1.2)).join('');
const btn = (x, y, w = 18, f = P) => R(x, y, w, 6, f, 3);
const svg = (inner, bg = '#FFFFFF') =>
  `<svg viewBox="0 0 120 76" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block"><rect x=".5" y=".5" width="119" height="75" rx="6" fill="${bg}" stroke="${LL}"/>${inner}</svg>`;
const head = (y = 9) => R(40, y, 40, 4, D, 2) + R(30, y + 7, 60, 2.4, L, 1.2);
const navLinks = (x, y, f = T) => [0, 1, 2].map((i) => R(x + i * 13, y, 10, 2.4, f, 1.2)).join('');

const THUMBS = {
  'navbar:simple': () => svg(C(14, 38, 4, P) + R(21, 36.5, 18, 3, D) + navLinks(52, 37) + btn(94, 35, 18)),
  'navbar:centered': () => svg(C(53, 30, 4, P) + R(60, 28.5, 16, 3, D) + navLinks(41, 42)),
  'navbar:dark': () => svg(R(0, 22, 120, 32, D, 0) + C(14, 38, 4, A) + R(21, 36.5, 18, 3, '#fff') + navLinks(52, 37, '#64748B') + btn(94, 35, 18, A)),
  'hero:centered': () => svg(R(35, 18, 50, 5, D) + R(28, 27, 64, 5, D) + lines(32, 38, 56, 2) + btn(44, 52, 32)),
  'hero:split-image': () => svg(R(8, 18, 46, 5, D) + R(8, 26, 38, 5, D) + lines(8, 37, 44, 2) + btn(8, 50, 22) + img(62, 12, 50, 52)),
  'hero:split-form': () => svg(R(8, 20, 44, 5, D) + R(8, 28, 36, 5, D) + lines(8, 39, 42, 2) + R(62, 10, 50, 56, '#fff', 4) + `<rect x="62" y="10" width="50" height="56" rx="4" fill="none" stroke="${LL}"/>` + R(67, 16, 26, 3, D) + R(67, 24, 40, 6, LL, 2) + R(67, 33, 40, 6, LL, 2) + R(67, 42, 40, 6, LL, 2) + btn(67, 53, 40)),
  'hero:background-image': () => svg(img(0, 0, 120, 76, 6) + R(0, 0, 120, 76, 'rgba(11,27,51,.62)', 6) + R(10, 24, 54, 5, '#fff') + R(10, 32, 44, 5, '#fff') + lines(10, 43, 50, 2, 5, 'rgba(255,255,255,.7)') + btn(10, 55, 24, A)),
  'hero:minimal': () => svg(`<path d="M0 20h120M0 38h120M0 56h120M24 0v76M48 0v76M72 0v76M96 0v76" stroke="#EEF2F7" stroke-width="1"/>` + R(46, 14, 28, 4, '#DCE6F5', 2) + R(16, 24, 88, 7, D) + R(26, 34, 68, 7, D) + lines(34, 47, 52, 2) + btn(40, 58, 18) + btn(62, 58, 18, L)),
  'hero:showcase': () => svg(R(34, 8, 52, 5, D) + R(40, 16, 40, 2.4, L, 1.2) + btn(50, 22, 20) + R(22, 34, 76, 38, '#E6EEFA', 4) + img(26, 38, 68, 34, 2)),
  'features:cards': () => svg(head() + [0, 1, 2].map((i) => R(8 + i * 36, 26, 32, 40, '#F4F7FB', 3) + R(12 + i * 36, 30, 7, 7, P, 2) + lines(12 + i * 36, 42, 22, 3)).join('')),
  'features:icons': () => svg(head() + [0, 1, 2].map((i) => C(26 + i * 34, 36, 6, '#DCE6F5') + C(26 + i * 34, 36, 3, P) + R(16 + i * 34, 47, 20, 3, D) + lines(14 + i * 34, 54, 24, 2)).join('')),
  'features:bento': () => svg(head() + R(8, 26, 66, 42, '#E6EEFA', 3) + lines(13, 52, 40, 2, 5, P) + R(78, 26, 34, 20, '#F4F7FB', 3) + R(78, 48, 34, 20, '#F4F7FB', 3) + R(82, 30, 6, 6, P, 2) + R(82, 52, 6, 6, P, 2)),
  'features:list': () => svg(R(8, 18, 34, 5, D) + lines(8, 28, 30, 3) + btn(8, 46, 18) + [0, 1, 2].map((i) => R(52, 12 + i * 19, 8, 8, '#DCE6F5', 2) + R(64, 13 + i * 19, 26, 3, D) + lines(64, 19 + i * 19, 44, 1) + R(52, 27 + i * 19, 60, 0.8, LL, 0)).join('')),
  'features:numbered': () => svg(head() + [0, 1, 2].map((i) => R(8 + i * 36, 26, 32, 1.4, LL, 0) + R(8 + i * 36, 31, 13, 9, P, 2) + R(8 + i * 36, 45, 22, 3, D) + lines(8 + i * 36, 52, 28, 3)).join('')),
  'media_text:image-left': () => svg(img(8, 12, 50, 52) + R(66, 20, 40, 4, D) + lines(66, 30, 44, 3) + btn(66, 50, 22)),
  'media_text:image-right': () => svg(R(10, 20, 40, 4, D) + lines(10, 30, 44, 3) + btn(10, 50, 22) + img(62, 12, 50, 52)),
  'stats:plain': () => svg(R(0, 0, 120, 76, '#F4F7FB', 6) + [0, 1, 2, 3].map((i) => R(10 + i * 27, 30, 18, 7, P) + R(10 + i * 27, 41, 20, 2.4, T)).join('')),
  'stats:cards': () => svg(R(0, 0, 120, 76, '#F4F7FB', 6) + [0, 1, 2, 3].map((i) => R(7 + i * 27, 22, 24, 32, '#fff', 3) + R(11 + i * 27, 30, 16, 6, P) + R(11 + i * 27, 41, 16, 2.4, T)).join('')),
  'stats:band': () => svg(R(0, 18, 120, 40, P, 0) + [0, 1, 2, 3].map((i) => R(9 + i * 28, 30, 18, 8, '#fff') + R(9 + i * 28, 42, 20, 2.4, 'rgba(255,255,255,.7)') + (i ? R(4 + i * 28, 28, 0.8, 20, 'rgba(255,255,255,.35)', 0) : '')).join('')),
  'steps:timeline': () => svg(head() + R(37, 26, 1.5, 44, LL, 1) + [0, 1, 2].map((i) => C(38, 30 + i * 16, 4.5, P) + R(48, 27 + i * 16, 30, 3, D) + lines(48, 33 + i * 16, 50, 1)).join('')),
  steps: () => svg(head() + R(22, 37, 76, 1.5, LL, 1) + [0, 1, 2].map((i) => C(22 + i * 38, 38, 5, P) + R(14 + i * 38, 48, 16, 3, D) + lines(12 + i * 38, 55, 20, 2)).join('')),
  'testimonials:cards': () => svg(R(0, 0, 120, 76, '#F4F7FB', 6) + head() + [0, 1, 2].map((i) => R(8 + i * 36, 26, 32, 40, '#fff', 3) + R(12 + i * 36, 30, 14, 2.4, A) + lines(12 + i * 36, 36, 24, 3) + C(16 + i * 36, 58, 3, P) + R(22 + i * 36, 57, 12, 2.4, D)).join('')),
  'testimonials:single': () => svg(R(0, 0, 120, 76, '#F4F7FB', 6) + R(48, 14, 24, 3, A) + R(18, 24, 84, 4, D) + R(24, 32, 72, 4, D) + R(36, 40, 48, 4, D) + C(60, 54, 4, P) + R(48, 61, 24, 2.4, T)),
  pricing: () => svg(head() + [0, 1, 2].map((i) => R(8 + i * 36, 26 - (i === 1 ? 3 : 0), 32, 44 + (i === 1 ? 3 : 0), i === 1 ? '#E6EEFA' : '#F4F7FB', 3) + R(12 + i * 36, 30, 14, 3, D) + R(12 + i * 36, 37, 18, 6, P) + lines(12 + i * 36, 48, 22, 2) + btn(12 + i * 36, 59, 24, i === 1 ? P : L)).join('')),
  'faq:stacked': () => svg(head() + [0, 1, 2, 3].map((i) => R(20, 27 + i * 11, 80, 8, '#F4F7FB', 2) + R(24, 30 + i * 11, 40, 2.4, D) + R(93, 30 + i * 11, 3, 2.4, P)).join('')),
  'faq:split': () => svg(R(8, 18, 34, 5, D) + lines(8, 28, 32, 3) + btn(8, 46, 20) + [0, 1, 2, 3].map((i) => R(50, 12 + i * 14, 62, 10, '#F4F7FB', 2) + R(54, 16 + i * 14, 34, 2.4, D)).join('')),
  'cta:banner': () => svg(`<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${P}"/><stop offset="1" stop-color="${D}"/></linearGradient></defs>` + R(8, 18, 104, 40, 'url(#g)', 6) + R(16, 30, 44, 5, '#fff') + R(16, 39, 34, 2.4, 'rgba(255,255,255,.7)') + btn(84, 34, 20, '#fff')),
  'cta:band': () => svg(R(0, 16, 120, 44, P, 0) + R(30, 26, 60, 5, '#fff') + R(38, 35, 44, 2.4, 'rgba(255,255,255,.7)') + btn(48, 44, 24, '#fff')),
  'gallery:grid': () => svg(head() + img(8, 26, 32, 40) + img(44, 26, 32, 40) + img(80, 26, 32, 40)),
  'gallery:wide': () => svg(head() + img(8, 26, 50, 40) + img(62, 26, 50, 40)),
  team: () => svg(head() + [0, 1, 2].map((i) => C(26 + i * 34, 40, 9, '#DCE6F5') + C(26 + i * 34, 37, 3.5, '#9DB4DB') + R(16 + i * 34, 54, 20, 3, D) + R(19 + i * 34, 60, 14, 2.4, T)).join('')),
  logos: () => svg(R(0, 0, 120, 76, '#F4F7FB', 6) + R(40, 24, 40, 3, T) + [0, 1, 2, 3, 4].map((i) => R(8 + i * 22, 36, 16, 6, L)).join('')),
  'lead_form:card': () => svg(R(0, 0, 120, 76, '#F4F7FB', 6) + R(38, 8, 44, 4, D) + R(30, 17, 60, 54, '#fff', 4) + R(36, 23, 48, 6, LL) + R(36, 32, 48, 6, LL) + R(36, 41, 48, 6, LL) + btn(36, 53, 48)),
  'lead_form:split-text': () => svg(R(0, 0, 120, 76, '#F4F7FB', 6) + R(8, 18, 40, 5, D) + lines(8, 28, 40, 3) + R(62, 10, 50, 56, '#fff', 4) + R(67, 16, 40, 6, LL) + R(67, 25, 40, 6, LL) + R(67, 34, 40, 6, LL) + btn(67, 47, 40)),
  location: () => svg(R(8, 22, 36, 5, D) + lines(8, 32, 38, 3) + R(56, 10, 56, 56, '#E8F0E6', 4) + `<path d="M56 30h56M56 48h56M74 10v56M94 10v56" stroke="#D2DDCF" stroke-width="1.2"/>` + C(84, 36, 5, '#DC2626') + C(84, 36, 2, '#fff')),
  video: () => svg(R(18, 8, 84, 60, D, 5) + C(60, 38, 11, 'rgba(255,255,255,.9)') + `<path d="M56 32 L67 38 L56 44Z" fill="${P}"/>`),
  countdown: () => svg(R(0, 0, 120, 76, D, 6) + R(10, 20, 40, 5, '#fff') + lines(10, 30, 36, 2, 5, '#64748B') + [0, 1, 2, 3].map((i) => R(56 + i * 14, 24, 11, 26, 'rgba(255,255,255,.14)', 2) + R(58 + i * 14, 31, 7, 6, '#fff')).join('')),
  text: () => svg(R(20, 14, 50, 5, D) + lines(20, 26, 80, 6)),
  'footer:columns': () => svg(R(0, 34, 120, 42, D, 0) + R(8, 42, 26, 4, '#fff') + lines(8, 50, 34, 2, 5, '#475569') + [0, 1].map((i) => R(70 + i * 22, 42, 14, 2.4, '#94A3B8') + R(70 + i * 22, 48, 16, 2.4, '#475569') + R(70 + i * 22, 54, 12, 2.4, '#475569')).join('') + R(8, 67, 104, 1, '#1E293B', 0)),
  'footer:simple': () => svg(R(0, 48, 120, 28, D, 0) + R(8, 60, 20, 4, '#fff') + navLinks(46, 61, '#94A3B8') + R(92, 61, 20, 2.4, '#475569')),
  'footer:centered': () => svg(R(0, 30, 120, 46, D, 0) + R(46, 40, 28, 4, '#fff') + R(30, 48, 60, 2.4, '#475569') + navLinks(41, 56, '#94A3B8') + R(40, 66, 40, 2, '#475569')),
};

function blockThumb(type, variant) {
  const fn = THUMBS[`${type}:${variant}`] || THUMBS[type] || THUMBS[`${type}:${Object.keys(THUMBS).find((k) => k.startsWith(`${type}:`)) || ''}`];
  return fn ? fn() : svg(R(20, 30, 80, 5, D) + lines(20, 40, 80, 3));
}

const CATEGORY = {
  navbar: 'Header',
  hero: 'Hero',
  features: 'Features',
  media_text: 'Content',
  text: 'Content',
  steps: 'Content',
  stats: 'Stats & logos',
  logos: 'Stats & logos',
  testimonials: 'Testimonials & team',
  team: 'Testimonials & team',
  pricing: 'Pricing',
  faq: 'FAQ',
  cta: 'Call to action',
  countdown: 'Call to action',
  gallery: 'Media',
  video: 'Media',
  location: 'Media',
  lead_form: 'Forms',
  footer: 'Footer',
};
const CATEGORY_ORDER = ['Header', 'Hero', 'Features', 'Content', 'Stats & logos', 'Testimonials & team', 'Pricing', 'FAQ', 'Call to action', 'Media', 'Forms', 'Footer'];

module.exports = { blockThumb, CATEGORY, CATEGORY_ORDER };
