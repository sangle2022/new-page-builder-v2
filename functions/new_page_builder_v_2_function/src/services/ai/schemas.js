'use strict';

// Response schemas for Gemini structured output (OpenAPI 3 subset).
// The model must return JSON in exactly these shapes, which removes most
// parsing and "the AI returned prose" failures.

const { SECTION_TYPES, BACKGROUNDS } = require('../../shared/sectionLibrary');
const { FIELD_TYPES } = require('../../shared/formMarkup');
const { FONTS } = require('../../shared/pageStyles');

const S = { type: 'STRING' };
const B = { type: 'BOOLEAN' };
const N = { type: 'NUMBER' };
const arr = (items) => ({ type: 'ARRAY', items });
const obj = (properties, required) => ({ type: 'OBJECT', properties, ...(required ? { required } : {}) });

const THEME = obj({
  primary: { ...S, description: 'Brand colour as #RRGGBB' },
  accent: { ...S, description: 'Accent colour as #RRGGBB' },
  dark: { ...S, description: 'Very dark text/section colour as #RRGGBB' },
  font: { ...S, enum: Object.keys(FONTS), description: 'Body font' },
  headingFont: { ...S, enum: Object.keys(FONTS), description: 'Heading font' },
});

const FORM_FIELD = obj(
  {
    label: S,
    type: { ...S, enum: FIELD_TYPES },
    required: B,
    options: arr(S),
    width: { ...S, enum: ['full', 'half'] },
    step: { ...N, description: 'Step number for multi-step forms, starting at 1' },
    otp: { ...B, description: 'Verify this mobile number by OTP (tel fields only)' },
    placeholder: S,
  },
  ['label', 'type'],
);

const ITEM = obj({
  icon: { ...S, description: 'A single emoji' },
  title: S,
  text: S,
  value: S,
  label: S,
  author: S,
  role: S,
  price: S,
  period: S,
  features: arr(S),
  featured: B,
  href: S,
  imagePrompt: { ...S, description: 'Photo description when this item shows an image (gallery, team)' },
});

const SECTION = obj(
  {
    type: { ...S, enum: SECTION_TYPES },
    variant: S,
    background: { ...S, enum: BACKGROUNDS },
    anchorId: S,
    eyebrow: S,
    heading: S,
    subheading: S,
    body: S,
    ctaLabel: S,
    ctaHref: S,
    secondaryCtaLabel: S,
    secondaryCtaHref: S,
    imagePrompt: { ...S, description: 'Detailed description of the photo for this section' },
    imageAlt: S,
    items: arr(ITEM),
    formTitle: S,
    formSubtitle: S,
    formFields: arr(FORM_FIELD),
    formSteps: arr(S),
    formSubmitLabel: S,
    successMessage: S,
    brandName: S,
    legal: S,
    address: S,
    videoUrl: S,
    targetDate: { ...S, description: 'YYYY-MM-DD for countdown sections' },
  },
  ['type'],
);

const PAGE = obj(
  {
    name: { ...S, description: 'Short internal page name' },
    title: { ...S, description: 'SEO title, max 60 characters' },
    description: { ...S, description: 'SEO meta description, max 155 characters' },
    slug: { ...S, description: 'URL slug, lowercase words separated by hyphens' },
    theme: THEME,
    sections: arr(SECTION),
  },
  ['name', 'title', 'description', 'theme', 'sections'],
);

const OP_TYPES = [
  'update_element', 'insert_section', 'remove_element', 'move_section', 'update_theme', 'set_style', 'update_settings',
  'add_css', 'add_class', 'remove_class', 'set_attribute',
  'add_field', 'update_field', 'remove_field', 'update_form', 'set_image',
];

const MODIFY = obj(
  {
    summary: { ...S, description: 'One or two sentences telling the user what was changed' },
    operations: arr(
      obj(
        {
          op: { ...S, enum: OP_TYPES },
          target: { ...S, description: 'data-pb-id of the element the operation applies to' },
          html: { ...S, description: 'update_element: the complete new outer HTML of the target element' },
          section: SECTION,
          position: { ...S, enum: ['before', 'after', 'start', 'end'] },
          reference: { ...S, description: 'data-pb-id of the section to insert/move relative to' },
          theme: THEME,
          css: {
            ...S,
            description:
              'set_style: CSS declarations, e.g. "padding:40px 0;background:#F8FAFC". add_css: complete CSS rules (may include @keyframes and @media), e.g. "[data-pb-id=\\"s1\\"] .pb-card:hover{transform:rotate(-1deg)}"',
          },
          classes: { ...arr(S), description: 'add_class/remove_class: CSS class names' },
          attributes: obj({ href: S, target: S, title: S, alt: S, rel: S }),
          fieldName: { ...S, description: 'update_field/remove_field: data-name of the form field; add_field: insert after this field (optional)' },
          field: FORM_FIELD,
          form: obj({ submitLabel: S, successMessage: S, redirectUrl: S, title: S, subtitle: S }),
          settings: obj({ title: S, description: S }),
          note: { ...S, description: 'Short description of this single operation' },
        },
        ['op'],
      ),
    ),
  },
  ['summary', 'operations'],
);

const REWRITE = obj({ options: arr(S) }, ['options']);

const SEO = obj(
  { title: S, description: S, slug: S, keywords: arr(S), ogImagePrompt: S },
  ['title', 'description', 'slug'],
);

const IMAGE_PROMPT = obj({ prompt: S, tags: arr(S), alt: S }, ['prompt', 'tags', 'alt']);

module.exports = { THEME, SECTION, PAGE, MODIFY, REWRITE, SEO, IMAGE_PROMPT, OP_TYPES, FORM_FIELD };
