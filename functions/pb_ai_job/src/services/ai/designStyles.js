'use strict';

// Design styles for AI page generation. Each style is a complete art
// direction: the layouts it uses per section type, colour mode, corner
// radius, fonts, where the lead form sits, background rhythm and a little
// finishing CSS. Gemini writes the content; the style decides the structure,
// so pages made from the same kind of brief still look clearly different.

const STYLES = {
  'saas-dark': {
    label: 'SaaS dark',
    brief:
      'Dark, high-tech product look like modern SaaS sites. Huge confident headline, a wide product/hero image under it, glowing gradient accents, bento feature grid, numbers that prove value. Short punchy copy.',
    theme: { mode: 'dark', radius: '16px', font: 'Inter', headingFont: 'Outfit' },
    variants: {
      navbar: ['dark'], hero: ['showcase', 'minimal'], features: ['bento', 'numbered'], stats: ['cards'], steps: ['timeline'],
      testimonials: ['cards'], faq: ['split'], cta: ['band'], media_text: ['image-right', 'image-left'], gallery: ['wide'], lead_form: ['split-text'], footer: ['columns'],
    },
    formInHero: false,
    css: '.pb-hero .pb-h1{background:linear-gradient(180deg,#fff 30%,color-mix(in srgb,var(--pb-accent) 70%,#fff));-webkit-background-clip:text;background-clip:text;color:transparent}.pb-card{box-shadow:0 0 0 1px rgba(255,255,255,.06),0 20px 50px rgba(0,0,0,.35)}',
  },
  editorial: {
    label: 'Editorial',
    brief:
      'Calm, editorial magazine look. Elegant serif headlines, generous white space, thin rules instead of heavy cards, story-led copy with one big pull quote. Few colours, lots of breathing room.',
    theme: { mode: 'light', radius: '4px', font: 'Inter', headingFont: 'Playfair Display' },
    variants: {
      navbar: ['centered'], hero: ['split-image', 'minimal'], features: ['list', 'numbered'], stats: ['plain'], steps: ['timeline'],
      testimonials: ['single'], faq: ['split'], cta: ['banner'], media_text: ['image-left', 'image-right'], gallery: ['wide'], lead_form: ['split-text'], footer: ['simple'],
    },
    formInHero: false,
    backgrounds: ['light', 'alt'],
    css: '.pb-h1,.pb-h2{font-weight:600;letter-spacing:-.01em}.pb-eyebrow{background:none;padding:0;letter-spacing:.2em}.pb-card{box-shadow:none}.pb-media{box-shadow:none}.pb-btn--primary{box-shadow:none}',
  },
  'bold-gradient': {
    label: 'Bold gradient',
    brief:
      'Loud, energetic campaign look. Big moving gradients, chunky rounded shapes, the lead form right in the hero, a bold stats band and a strong closing call to action. Urgent, upbeat copy.',
    theme: { radius: '24px', font: 'Poppins', headingFont: 'Poppins' },
    variants: {
      navbar: ['simple'], hero: ['split-form'], features: ['cards', 'bento'], stats: ['band'], steps: ['cards'],
      testimonials: ['cards'], faq: ['stacked'], cta: ['band'], media_text: ['image-right', 'image-left'], gallery: ['grid'], footer: ['centered'],
    },
    formInHero: true,
    heroBackground: 'gradient',
    css: '.pb-section--gradient{background-size:200% 200%;animation:pb-gradient-move 12s ease infinite}.pb-h1{font-weight:800;letter-spacing:-.035em}',
  },
  minimal: {
    label: 'Clean minimal',
    brief:
      'Ultra-clean minimal look. One oversized headline with no hero image, plenty of white space, numbered features, a simple timeline, subtle borders instead of shadows. Plain, precise copy.',
    theme: { mode: 'light', radius: '10px', font: 'DM Sans', headingFont: 'DM Sans' },
    variants: {
      navbar: ['simple'], hero: ['minimal'], features: ['numbered', 'list'], stats: ['plain'], steps: ['timeline'],
      testimonials: ['single', 'cards'], faq: ['stacked'], cta: ['banner'], media_text: ['image-right', 'image-left'], gallery: ['wide'], lead_form: ['card'], footer: ['simple'],
    },
    formInHero: false,
    backgrounds: ['light', 'alt'],
    css: '.pb-card{box-shadow:none}.pb-grid>.pb-card:hover{box-shadow:none;border-color:var(--pb-primary)}.pb-media{box-shadow:none;border:1px solid var(--pb-border)}.pb-h1,.pb-h2{letter-spacing:-.035em}',
  },
  corporate: {
    label: 'Corporate trust',
    brief:
      'Trustworthy, established corporate look (banks, insurance, B2B). Lead form in the hero, credibility first: logos, hard numbers, clear process, testimonials with roles, disciplined layout.',
    theme: { mode: 'light', radius: '8px', font: 'Lato', headingFont: 'Merriweather' },
    variants: {
      navbar: ['simple'], hero: ['split-form'], features: ['cards', 'icons'], stats: ['band'], steps: ['cards'],
      testimonials: ['cards'], faq: ['split'], cta: ['banner'], media_text: ['image-left', 'image-right'], gallery: ['grid'], footer: ['columns'],
    },
    formInHero: true,
    heroBackground: 'gradient',
    css: '.pb-h1{font-weight:700;letter-spacing:-.01em}.pb-h2{font-weight:700;letter-spacing:-.005em}',
  },
  playful: {
    label: 'Playful',
    brief:
      'Friendly, playful consumer look. Very rounded shapes, bright accent colour, floating hero image, warm conversational copy with emoji icons, colourful cards.',
    theme: { mode: 'light', radius: '28px', font: 'Poppins', headingFont: 'Poppins' },
    variants: {
      navbar: ['simple'], hero: ['split-image', 'centered'], features: ['cards', 'bento'], stats: ['cards'], steps: ['cards'],
      testimonials: ['cards'], faq: ['stacked'], cta: ['banner'], media_text: ['image-right', 'image-left'], gallery: ['grid'], lead_form: ['card'], footer: ['centered'],
    },
    formInHero: false,
    css: '.pb-hero .pb-media{animation:pb-float 6s ease-in-out infinite}.pb-icon{border-radius:999px}.pb-h1{letter-spacing:-.03em}.pb-btn{border-radius:999px}',
  },
  luxury: {
    label: 'Luxury',
    brief:
      'Premium luxury look (real estate, hospitality, jewellery). Dark backdrop with gold or champagne accent, full-bleed photography, refined serif headlines, spacious layout, understated copy.',
    theme: { mode: 'dark', radius: '2px', font: 'Lato', headingFont: 'Playfair Display' },
    variants: {
      navbar: ['centered'], hero: ['background-image'], features: ['list', 'icons'], stats: ['plain'], steps: ['timeline'],
      testimonials: ['single'], faq: ['stacked'], cta: ['band'], media_text: ['image-left', 'image-right'], gallery: ['wide'], lead_form: ['split-text'], footer: ['centered'],
    },
    formInHero: false,
    backgrounds: ['light', 'alt', 'dark'],
    css: '.pb-h1,.pb-h2{font-weight:500;letter-spacing:0}.pb-eyebrow{background:none;padding:0;letter-spacing:.26em;color:var(--pb-accent)}.pb-btn{text-transform:uppercase;letter-spacing:.14em;font-size:14px}.pb-btn--primary{box-shadow:none}',
  },
  glass: {
    label: 'Glass & glow',
    brief:
      'Futuristic glassmorphism look. Deep gradient backdrops, frosted translucent cards, soft neon glow, lead form floating in the hero, bento features. Sleek modern copy.',
    theme: { mode: 'dark', radius: '20px', font: 'Outfit', headingFont: 'Outfit' },
    variants: {
      navbar: ['dark'], hero: ['split-form'], features: ['bento', 'cards'], stats: ['cards'], steps: ['timeline'],
      testimonials: ['cards'], faq: ['split'], cta: ['band'], media_text: ['image-right', 'image-left'], gallery: ['wide'], footer: ['simple'],
    },
    formInHero: true,
    heroBackground: 'gradient',
    css: '.pb-card,.pb-faq details{background:rgba(255,255,255,.05);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-color:rgba(255,255,255,.12)}.pb-section:not(.pb-section--gradient):not(.pb-section--primary){background-image:radial-gradient(700px 360px at 85% 0%,color-mix(in srgb,var(--pb-primary) 22%,transparent),transparent 65%)}',
  },
};

const KEYS = Object.keys(STYLES);

// The chosen style, or a random one ("auto").
function pick(key) {
  if (key && STYLES[key]) return { key, ...STYLES[key] };
  const k = KEYS[Math.floor(Math.random() * KEYS.length)];
  return { key: k, ...STYLES[k] };
}

// Text for the prompt: the art direction and the layouts to use.
function promptFor(style) {
  const layouts = Object.entries(style.variants)
    .map(([type, v]) => `${type}: ${v.join(' or ')}`)
    .join('; ');
  return (
    `Design direction "${style.label}": ${style.brief}\n` +
    `Use these layouts: ${layouts}.\n` +
    (style.formInHero ? 'Put the lead form in the hero (variant "split-form").' : 'Do NOT put the form in the hero; add a lead_form section after the main content.')
  );
}

// Enforce the style on the model's spec (the model sometimes ignores parts of
// the direction). Keeps exactly one lead form.
function apply(spec, style) {
  const sections = spec.sections.map((s) => ({ ...s }));
  const seen = {};
  const hero = sections.find((s) => s.type === 'hero');

  if (hero && !style.formInHero && hero.variant === 'split-form') {
    // Move the hero's form into its own section near the end.
    if (!sections.some((s) => s.type === 'lead_form')) {
      const form = {
        type: 'lead_form',
        heading: hero.formTitle || 'Get in touch',
        subheading: hero.formSubtitle || '',
        formTitle: hero.formTitle || 'Get in touch',
        formSubtitle: hero.formSubtitle,
        formFields: hero.formFields,
        formSteps: hero.formSteps,
        formSubmitLabel: hero.formSubmitLabel,
        successMessage: hero.successMessage,
        items: [],
      };
      const at = ['faq', 'cta', 'footer'].map((t) => sections.findIndex((s) => s.type === t)).filter((i) => i > 0);
      sections.splice(at.length ? Math.min(...at) : sections.length, 0, form);
    }
    hero.ctaLabel = hero.ctaLabel || hero.formSubmitLabel || 'Get started';
    hero.ctaHref = '#lead-form';
    hero.variant = style.variants.hero[0];
  }

  if (hero && style.formInHero && hero.variant !== 'split-form') {
    // Pull an existing lead form up into the hero.
    const formAt = sections.findIndex((s) => s.type === 'lead_form');
    if (formAt > -1 && Array.isArray(sections[formAt].formFields) && sections[formAt].formFields.length) {
      const f = sections[formAt];
      Object.assign(hero, {
        variant: 'split-form',
        formTitle: f.formTitle || f.heading,
        formSubtitle: f.formSubtitle || f.subheading,
        formFields: f.formFields,
        formSteps: f.formSteps,
        formSubmitLabel: f.formSubmitLabel,
        successMessage: f.successMessage,
      });
      sections.splice(formAt, 1);
    }
  }

  sections.forEach((s) => {
    const allowed = style.variants[s.type];
    const isHeroForm = s.type === 'hero' && s.variant === 'split-form';
    if (allowed && !isHeroForm && !allowed.includes(s.variant)) {
      // Alternate between the style's layouts when a type repeats.
      seen[s.type] = (seen[s.type] || 0) + 1;
      s.variant = allowed[(seen[s.type] - 1) % allowed.length];
      if (s.type === 'hero' && s.variant === 'split-form') s.variant = 'split-image';
    }
    if (style.backgrounds && s.background && !style.backgrounds.includes(s.background) && !['hero', 'cta', 'stats', 'footer', 'navbar'].includes(s.type)) {
      s.background = style.backgrounds[0];
    }
  });
  if (hero && style.heroBackground && !['background-image'].includes(hero.variant)) hero.background = style.heroBackground;

  const theme = { ...spec.theme, ...style.theme };
  return { ...spec, sections, theme };
}

const list = () => KEYS.map((key) => ({ key, label: STYLES[key].label, description: STYLES[key].brief.split('.')[0] }));

module.exports = { STYLES, pick, promptFor, apply, list };
