'use strict';

// Templates: 10 system templates (shared/templates.js, rendered on demand)
// plus templates users save from their own pages (Templates table + Stratus).
// Also produces the builder's section blocks from the same section library.

const db = require('../utils/db');
const storage = require('./storage.service');
const pages = require('./page.service');
const systemTemplates = require('../shared/templates');
const { renderSpec } = require('../shared/pageDocument');
const { renderSection, SECTION_TYPES, VARIANTS } = require('../shared/sectionLibrary');
const { formConfigFromHtml } = require('../shared/formMarkup');
const { blockThumb, CATEGORY, CATEGORY_ORDER } = require('./blockThumbs');
const { badRequest, notFound, forbidden } = require('../utils/http');
const { can, P } = require('../config/roles');

const T = 'Templates';

const CATEGORIES = [
  'Real Estate', 'Product Launch', 'Event Registration', 'Webinar', 'Corporate', 'Healthcare',
  'Education', 'Lead Generation', 'Banking & Finance', 'Service Business', 'Promotional Campaign',
];

const userKey = (id) => ({ project: `templates/${id}/project.json`, render: `templates/${id}/render.json` });

async function list(capp) {
  const system = systemTemplates.list().map((t) => ({ ...t, id: t.key, kind: 'system', thumbnailUrl: null }));
  let custom = [];
  try {
    const rows = await db.select(capp, T, '', 'ORDER BY CREATEDTIME DESC LIMIT 200');
    custom = rows.map((r) => ({
      id: r.ROWID,
      key: `user-${r.ROWID}`,
      kind: 'custom',
      name: r.Name,
      category: r.Category || 'Saved',
      description: r.Description || '',
      thumbnailUrl: r.ThumbnailUrl || null,
      createdBy: r.CreatedByName || '',
      createdTime: r.CREATEDTIME,
    }));
  } catch (e) {
    console.warn('[templates] Templates table not available', e.message);
  }
  return { categories: CATEGORIES, templates: [...system, ...custom] };
}

// Content for creating a page from a template.
async function load(capp, key) {
  const sys = systemTemplates.get(key);
  if (sys) {
    const { html, css, theme } = renderSpec(sys);
    return { name: sys.name, templateKey: sys.key, html, css, theme, project: null, formConfig: formConfigFromHtml(html) };
  }
  const id = String(key).replace(/^user-/, '');
  if (!db.isRowId(id)) throw notFound('Template not found');
  const row = await db.selectOne(capp, T, `ROWID = ${db.q(id)}`);
  if (!row) throw notFound('Template not found');
  const [project, render] = await Promise.all([storage.getJson(capp, row.ProjectKey), storage.getJson(capp, row.HtmlKey)]);
  const html = (render && render.html) || '';
  return {
    name: row.Name,
    templateKey: `user-${row.ROWID}`,
    html,
    css: (render && render.css) || '',
    theme: render && render.theme,
    project,
    formConfig: formConfigFromHtml(html),
  };
}

async function preview(capp, key) {
  const t = await load(capp, key);
  return t;
}

async function saveFromPage(capp, user, pageId, { name, category, description }) {
  if (!String(name || '').trim()) throw badRequest('Give the template a name');
  const doc = await pages.getDocument(capp, pageId);
  const row = await db.table(capp, T).insertRow({
    Name: String(name).trim().slice(0, 200),
    Category: CATEGORIES.includes(category) ? category : 'Saved',
    Description: String(description || '').slice(0, 1000),
    ThumbnailUrl: doc.page.thumbnailUrl || null,
    CreatedByName: user.name,
  });
  const keys = userKey(row.ROWID);
  await Promise.all([
    storage.putJson(capp, keys.project, doc.project || {}),
    storage.putJson(capp, keys.render, { html: doc.html, css: doc.css, theme: doc.page.settings.theme }),
  ]);
  await db.table(capp, T).updateRow({ ROWID: row.ROWID, ProjectKey: keys.project, HtmlKey: keys.render });
  return { id: row.ROWID, key: `user-${row.ROWID}`, name: row.Name };
}

async function remove(capp, user, id) {
  if (!db.isRowId(id)) throw notFound('Template not found');
  const row = await db.selectOne(capp, T, `ROWID = ${db.q(id)}`);
  if (!row) throw notFound('Template not found');
  if (!can(user.role, P.TEMPLATE_MANAGE) && row.CreatedByName !== user.name) throw forbidden();
  await storage.deletePath(capp, `templates/${id}/`);
  await db.table(capp, T).deleteRow(id);
  return { id };
}

// ---- builder blocks: one sample per section type/variant ----
const SAMPLE = {
  navbar: { brandName: 'Brand', items: [{ title: 'Features', href: '#features' }, { title: 'Pricing', href: '#pricing' }, { title: 'FAQ', href: '#faq' }], ctaLabel: 'Get started' },
  hero: { eyebrow: 'New', heading: 'A clear headline that states your offer', subheading: 'One or two sentences on who it is for and the main benefit.', ctaLabel: 'Get started', secondaryCtaLabel: 'Learn more', imagePrompt: 'professional team working together in a bright modern office', formTitle: 'Get a call back', formFields: null },
  features: { heading: 'Why choose us', subheading: 'Three reasons customers pick us.', items: [{ icon: '⚡', title: 'Fast', text: 'Explain the benefit in one line.' }, { icon: '🛡️', title: 'Reliable', text: 'Explain the benefit in one line.' }, { icon: '💬', title: 'Supported', text: 'Explain the benefit in one line.' }] },
  media_text: { eyebrow: 'About', heading: 'Tell your story', body: 'Describe what makes you different and why it matters to the customer.', items: [{ title: 'First proof point' }, { title: 'Second proof point' }], imagePrompt: 'friendly customer service representative smiling at a desk', ctaLabel: 'Talk to us' },
  stats: { items: [{ value: '10k+', label: 'Customers' }, { value: '4.8/5', label: 'Rating' }, { value: '24x7', label: 'Support' }, { value: '15 yrs', label: 'Experience' }] },
  steps: { heading: 'How it works', items: [{ title: 'Tell us what you need', text: 'Fill in a short form.' }, { title: 'Get a plan', text: 'We call you within a day.' }, { title: 'Get results', text: 'We take care of the rest.' }] },
  testimonials: { heading: 'What customers say', items: [{ text: 'A short, specific quote about the result they got.', author: 'Customer name', role: 'City' }, { text: 'Another quote that handles a common objection.', author: 'Customer name', role: 'Company' }, { text: 'A third quote about the experience.', author: 'Customer name', role: 'Role' }] },
  pricing: { heading: 'Simple pricing', items: [{ title: 'Starter', price: '₹999', period: 'per month', features: ['Feature one', 'Feature two'] }, { title: 'Growth', price: '₹2,499', period: 'per month', features: ['Everything in Starter', 'Feature three'], featured: true }, { title: 'Enterprise', price: 'Custom', period: 'talk to us', features: ['Everything in Growth', 'Dedicated manager'] }] },
  faq: { heading: 'Frequently asked questions', items: [{ title: 'First question?', text: 'Answer.' }, { title: 'Second question?', text: 'Answer.' }, { title: 'Third question?', text: 'Answer.' }] },
  cta: { heading: 'Ready to get started?', subheading: 'Join thousands of happy customers.', ctaLabel: 'Get started' },
  gallery: { heading: 'Gallery', items: [{ title: 'Photo one', imagePrompt: 'modern interior with natural light' }, { title: 'Photo two', imagePrompt: 'happy customers using a product outdoors' }, { title: 'Photo three', imagePrompt: 'close up of premium product on a clean background' }] },
  team: { heading: 'Meet the team', items: [{ title: 'Name Surname', label: 'Founder', imagePrompt: 'professional headshot of a smiling business woman' }, { title: 'Name Surname', label: 'Head of Sales', imagePrompt: 'professional headshot of a smiling business man' }, { title: 'Name Surname', label: 'Customer Success', imagePrompt: 'professional headshot of a young professional' }] },
  logos: { heading: 'Trusted by leading companies', items: [{ title: 'Acme' }, { title: 'Globex' }, { title: 'Initech' }, { title: 'Umbrella' }, { title: 'Stark' }] },
  lead_form: { heading: 'Talk to our team', subheading: 'Share your details and we will call you back.', body: 'We usually respond within one working day.', items: [{ title: 'No spam, ever' }, { title: 'Free consultation' }], formTitle: 'Get in touch' },
  location: { heading: 'Visit us', address: 'Connaught Place, New Delhi', body: 'Open Monday to Saturday, 10 am to 7 pm.', items: [{ title: '5 min from the metro station' }] },
  video: { heading: 'See it in action' },
  countdown: { heading: 'Offer ends soon', subheading: 'Register before the timer runs out.', ctaLabel: 'Claim offer' },
  text: { heading: 'A section heading', body: 'Write a paragraph here. Use this block for terms, disclaimers or a longer story.' },
  footer: { brandName: 'Brand', body: 'One line about the business.', items: [{ title: 'Privacy policy' }, { title: 'Terms' }, { title: 'Contact' }] },
};

const LABELS = {
  navbar: 'Header', hero: 'Hero', features: 'Features', media_text: 'Image + text', stats: 'Stats',
  steps: 'How it works', testimonials: 'Testimonials', pricing: 'Pricing', faq: 'FAQ', cta: 'Call to action',
  gallery: 'Gallery', team: 'Team', logos: 'Logo strip', lead_form: 'Lead form', location: 'Location / map',
  video: 'Video', countdown: 'Countdown', text: 'Text', footer: 'Footer',
};

function blocks() {
  const out = [];
  SECTION_TYPES.forEach((type) => {
    const variants = VARIANTS[type] || [null];
    variants.forEach((variant) => {
      const spec = { type, ...SAMPLE[type] };
      if (variant) spec.variant = variant;
      Object.keys(spec).forEach((k) => spec[k] === null && delete spec[k]);
      out.push({
        id: `pb-${type}${variant ? `-${variant}` : ''}`,
        type,
        variant,
        label: `${LABELS[type]}${variant ? ` · ${variant.replace(/-/g, ' ')}` : ''}`,
        category: CATEGORY[type] || 'Sections',
        media: blockThumb(type, variant),
        html: renderSection(spec),
      });
    });
  });
  // Group like the block panel shows them: Header first, Footer last.
  return out.sort((x, y) => CATEGORY_ORDER.indexOf(x.category) - CATEGORY_ORDER.indexOf(y.category));
}

module.exports = { CATEGORIES, list, load, preview, saveFromPage, remove, blocks };
