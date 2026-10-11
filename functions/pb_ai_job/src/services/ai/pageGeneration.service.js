'use strict';

// AI page builder: brief -> structured page spec (Gemini structured output)
// -> section library HTML. The result is ordinary editable builder content;
// images start as prompt-carrying placeholders that the builder fills one by
// one (keeps each request well inside function time limits).

const config = require('../../config');
const gemini = require('./gemini.client');
const aiLog = require('./aiLog.service');
const prompts = require('./prompts');
const designStyles = require('./designStyles');
const { renderSpec } = require('../../shared/pageDocument');
const { normalizeTheme, normalizeColor } = require('../../shared/theme');
const { formConfigFromHtml, DEFAULT_FIELDS } = require('../../shared/formMarkup');
const { slugify } = require('../../utils/text');
const { badRequest } = require('../../utils/http');


function cleanTheme(theme = {}, primaryOverride) {
  // Accepts #000, #000000, rgb() and common names ("black", "sky blue").
  const out = normalizeTheme(theme);
  const override = normalizeColor(primaryOverride);
  if (override) out.primary = override;
  return out;
}

const hasForm = (sections) =>
  sections.some((s) => s.type === 'lead_form' || (s.type === 'hero' && s.variant === 'split-form'));

// Make the spec safe to render even when the model skips a rule.
function normalizeSpec(spec, input) {
  let sections = Array.isArray(spec.sections) ? spec.sections.filter((s) => s && s.type) : [];
  if (!sections.length) throw badRequest('The AI could not design this page. Please add more detail to your brief.');

  if (!hasForm(sections)) {
    const footerAt = sections.findIndex((s) => s.type === 'footer');
    const form = {
      type: 'lead_form',
      variant: 'split-text',
      heading: 'Talk to our team',
      subheading: 'Share your details and we will get back to you shortly.',
      formTitle: 'Get in touch',
      formFields: DEFAULT_FIELDS,
      formSubmitLabel: 'Submit',
    };
    if (footerAt === -1) sections.push(form);
    else sections.splice(footerAt, 0, form);
  }
  // A page needs only one lead form; keep the first.
  let seenForm = false;
  sections = sections.filter((s) => {
    const isForm = s.type === 'lead_form' || (s.type === 'hero' && s.variant === 'split-form');
    if (!isForm) return true;
    if (!seenForm) {
      seenForm = true;
      return true;
    }
    if (s.type === 'hero') {
      s.variant = 'split-image';
      return true;
    }
    return false;
  });
  sections.forEach((s) => {
    if (Array.isArray(s.formFields) && !s.formFields.some((f) => f.type === 'consent')) {
      s.formFields.push({ label: 'I agree to be contacted about this enquiry', name: 'consent', type: 'consent', required: true });
    }
    if (input.otp && Array.isArray(s.formFields)) {
      s.formFields.forEach((f) => {
        if (f.type === 'tel') f.otp = true;
      });
    }
  });
  return { ...spec, sections, theme: cleanTheme(spec.theme, input.primaryColor) };
}

// The advanced (Pro) model is slow, so it is used only inside the background
// job function (no 30 s limit); web requests use the fast model.
const pageModel = () =>
  process.env.PB_JOB_RUNTIME === '1' && config.gemini.advancedModel ? config.gemini.advancedModel : config.gemini.textModel;

async function generate(capp, user, input = {}) {
  const brief = String(input.prompt || '').trim();
  if (brief.length < 10) throw badRequest('Describe the page you want in a sentence or two');
  if (brief.length > 4000) throw badRequest('Keep the brief under 4000 characters');

  // JSON mode with the format described in the prompt. A strict
  // responseSchema this large makes Gemini repeat itself until it hits the
  // output limit (tested Oct 2026 with 2.5 Flash and 3.x models);
  // normalizeSpec below repairs whatever the model leaves out.
  // A design style (chosen, or random for "auto") sets the layouts and look.
  const style = designStyles.pick(input.designStyle);

  const result = await aiLog.track(capp, user, { kind: 'page_generate', prompt: brief }, () =>
    gemini.generateJson({
      system: prompts.PAGE_SYSTEM,
      prompt: prompts.pagePrompt({ ...input, prompt: brief, designDirection: designStyles.promptFor(style) }),
      temperature: 0.7,
      model: pageModel(),
      ...(pageModel() === config.gemini.advancedModel ? { maxOutputTokens: config.gemini.advancedMaxOutputTokens } : {}),
    }),
  );

  const styled = designStyles.apply(normalizeSpec(result.data || {}, input), style);
  const spec = { ...styled, theme: cleanTheme(styled.theme, input.primaryColor) };
  const rendered = renderSpec(spec);
  const { html, theme } = rendered;
  const css = `${rendered.css}\n${style.css || ''}`;
  const imagePrompts = (html.match(/data-pb-image-prompt="/g) || []).length;
  return {
    name: String(spec.name || input.businessName || 'AI landing page').slice(0, 120),
    title: String(spec.title || spec.name || '').slice(0, 120),
    description: String(spec.description || '').slice(0, 300),
    slug: slugify(spec.slug || spec.name || 'landing-page'),
    theme,
    html,
    css,
    formConfig: formConfigFromHtml(html),
    spec,
    designStyle: style.key,
    imagePrompts,
  };
}

module.exports = { generate, normalizeSpec, cleanTheme };
