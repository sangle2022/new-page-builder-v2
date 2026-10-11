// Full-page templates from the original builder, offered next to the V2
// templates. They use Bootstrap/Tailwind classes, so pages created from them
// have settings.legacyAssets = true (the canvas and published page load those
// stylesheets). websiteLayouts are section blocks, not pages, so they stay in
// the builder's block panel only.

const SETS = [
  () => import('./Templates'),
  () => import('./LegacyTemplates'),
  () => import('./SalesTemplates'),
  () => import('./CampaignTemplates'),
  () => import('./PortfolioTemplates'),
  () => import('./FuturisticTemplates'),
  () => import('./FestivalTemplates'),
  () => import('./BlogTemplates'),
];

const text = (html) =>
  String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

let cache = null;

export async function loadClassicTemplates() {
  if (cache) return cache;
  const mods = await Promise.all(SETS.map((load) => load().catch(() => ({ default: [] }))));
  const seen = new Set();
  cache = [];
  mods.forEach((mod) =>
    (mod.default || []).forEach((t) => {
      if (!t || !t.id || !t.content || seen.has(t.id)) return;
      seen.add(t.id);
      const name = text(t.label) || String(t.id).replace(/[-_]/g, ' ');
      cache.push({
        key: `classic-${t.id}`,
        id: `classic-${t.id}`,
        kind: 'classic',
        name: name.charAt(0).toUpperCase() + name.slice(1),
        category: 'Classic',
        group: t.category || 'Templates',
        description: `Classic template · ${t.category || 'Templates'}`,
        html: t.content,
      });
    }),
  );
  return cache;
}

export const isClassicKey = (key) => String(key || '').startsWith('classic-');

export async function getClassicTemplate(key) {
  return (await loadClassicTemplates()).find((t) => t.key === key) || null;
}

// Standalone HTML for previewing a classic template in an iframe.
export function classicPreviewDoc(html) {
  const base = process.env.PUBLIC_URL || '.';
  return (
    '<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">' +
    `<link rel="stylesheet" href="${base}/css/bootstrap.min.css"><script src="${base}/js/tailwind.js"></script>` +
    `</head><body>${html}</body></html>`
  );
}
