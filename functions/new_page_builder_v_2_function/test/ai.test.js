// Offline test of the AI services with a stubbed Gemini client.
const path = require('path');
const FN = path.join(__dirname, '..', 'src');
process.env.GEMINI_API_KEY = 'test';
const mock = require('./mockCatalyst');
const gemini = require(path.join(FN, 'services/ai/gemini.client'));
const capp = mock.makeApp(null);
const user = { name: 'Alice', email: 'a@x.com', role: 'marketing' };
const assert = (c, m) => {
  if (!c) {
    console.error('FAIL:', m);
    process.exitCode = 1;
  } else console.log('ok -', m);
};

(async () => {
  // ---- page generation ----
  gemini.generateJson = async () => ({
    data: {
      name: 'Smile Dental',
      title: 'Smile Dental Clinic',
      description: 'Painless dental care',
      slug: 'smile-dental',
      theme: { primary: '#0E7490', accent: 'not-a-colour', font: 'Poppins' },
      sections: [
        { type: 'navbar', brandName: 'Smile' },
        { type: 'hero', variant: 'split-image', heading: 'Painless dental care', imagePrompt: 'dentist with smiling patient' },
        { type: 'features', items: [{ icon: '🦷', title: 'Implants', text: 'x' }] },
        { type: 'lead_form', formFields: [{ label: 'Name', type: 'text', required: true }, { label: 'Mobile', type: 'tel', required: true }] },
        { type: 'lead_form', formFields: [{ label: 'Dup', type: 'text' }] },
        { type: 'footer', brandName: 'Smile' },
      ],
    },
    usage: { inputTokens: 10, outputTokens: 20 },
    model: 'stub',
  });
  const gen = require(path.join(FN, 'services/ai/pageGeneration.service'));
  const page = await gen.generate(capp, user, { prompt: 'Landing page for a dental clinic in Pune', otp: true });
  assert(page.html.includes('data-pb-section="hero"') && page.imagePrompts === 1, 'generated html with image placeholder');
  assert(page.theme.primary === '#0E7490' && page.theme.accent === '#F59E0B', 'theme cleaned');
  assert((page.html.match(/data-pb-form=/g) || []).length === 1, 'single form kept');
  assert(page.formConfig.some((f) => f.type === 'consent') && page.formConfig.find((f) => f.type === 'tel').otp, 'consent added + otp');
  assert(mock.tables.AIGenerations.length === 1 && mock.tables.AIGenerations[0].Kind === 'page_generate', 'AI call logged');

  // ---- page modification ----
  const mod = require(path.join(FN, 'services/ai/pageModification.service'));
  const heroId = page.html.match(/data-pb-section="hero" data-pb-id="(\w+)"/)[1];
  const featId = page.html.match(/data-pb-section="features" data-pb-id="(\w+)"/)[1];
  console.log(mod.outline(page.html));
  const heroEl = mod.extractElement(page.html, heroId);
  assert(heroEl.startsWith('<section') && heroEl.endsWith('</section>') && heroEl.includes('Painless'), 'extract element balanced');
  gemini.generateJson = async (args) => {
    assert(args.prompt.includes(`data-pb-id="${heroId}"`), 'selected element sent to AI');
    return {
      data: {
        summary: 'Changed the headline and added FAQ.',
        operations: [
          { op: 'update_element', target: heroId, html: heroEl.replace('Painless dental care', 'Gentle dentistry for the whole family').replace('<h1', '<h1 onclick="alert(1)"') + '' },
          { op: 'insert_section', section: { type: 'faq', heading: 'FAQ', items: [{ title: 'Q?', text: 'A.' }] }, position: 'after', reference: featId },
          { op: 'remove_element', target: 'doesnotexist' },
          { op: 'update_theme', theme: { primary: '#123456' } },
          { op: 'set_style', target: featId, css: 'padding:10px}body{display:none' },
          { op: 'update_element', target: featId, html: '<section class="pb-section"><script>alert(1)</script><img src="PLACEHOLDER" alt="Smiling kid"></section>' },
        ],
      },
      usage: {},
      model: 'stub',
    };
  };
  const res = await mod.modify(capp, user, { instruction: 'Make the headline warmer and add an FAQ', html: page.html, selectedId: heroId });
  const ops = res.operations;
  assert(ops.length === 5, 'invalid op dropped: ' + ops.map((o) => o.op).join(','));
  assert(!ops[0].html.includes('onclick') && ops[0].html.includes('Gentle'), 'event handler stripped');
  assert(ops[1].html.includes('data-pb-section="faq"') && ops[1].reference === featId, 'insert_section rendered server-side');
  assert(!ops[3].css.includes('}'), 'css cleaned');
  const last = ops[4].html;
  assert(!last.includes('<script') && last.includes(`data-pb-id="${featId}"`) && last.includes('data-pb-image-prompt') && last.includes('placeholder.svg'), 'identity kept, placeholder fixed: ' + last);

  // ---- image reuse ----
  const media = require(path.join(FN, 'services/media.service'));
  const reuse = require(path.join(FN, 'services/ai/imageReuse.service'));
  await media.saveGenerated(capp, user, { buffer: Buffer.from('x'), mimeType: 'image/png', prompt: 'Smiling dentist with a happy patient in a modern clinic', alt: 'dentist', embedding: null });
  let m = await reuse.findSimilar(capp, 'happy patient with smiling dentist in modern clinic');
  assert(m.best && m.best.method !== 'semantic', 'keyword/exact reuse found: ' + (m.best && m.best.method));
  m = await reuse.findSimilar(capp, 'red sports car on a mountain road');
  assert(!m.best, 'no false reuse');

  const imgGen = require(path.join(FN, 'services/ai/imageGeneration.service'));
  gemini.embed = async () => null;
  let generated = 0;
  gemini.generateImage = async () => {
    generated += 1;
    return { buffer: Buffer.from('png'), mimeType: 'image/png', model: 'stub', usage: {} };
  };
  let out = await imgGen.generate(capp, user, { prompt: 'smiling dentist with happy patient, modern clinic', size: '1200x900' });
  assert(out.reused && generated === 0, 'similar prompt reused gallery image');
  out = await imgGen.generate(capp, user, { prompt: 'aerial view of a beach resort', size: '1920x1080' });
  assert(!out.reused && generated === 1 && out.image.aspectRatio === '16:9' && out.image.url.includes('media/ai'), 'new image generated and saved');
  const list = await media.list(capp, { search: 'beach' , semantic: false });
  assert(list.length === 1, 'gallery search finds generated image');
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
