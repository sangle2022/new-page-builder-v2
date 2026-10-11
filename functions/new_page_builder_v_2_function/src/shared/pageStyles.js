'use strict';

// Base stylesheet for every V2 page. It is injected into the GrapesJS canvas
// and into published pages, so pages render identically in both. Sections
// only use these pb-* classes plus CSS variables, which means:
//   - a theme change (AI or manual) is just new :root variables;
//   - AI can restyle by swapping modifier classes instead of writing CSS.
// Page-specific overrides made in the editor are separate GrapesJS rules.

const FONTS = {
  Inter: 'Inter:wght@400;500;600;700;800',
  Poppins: 'Poppins:wght@400;500;600;700;800',
  Montserrat: 'Montserrat:wght@400;500;600;700;800',
  Lato: 'Lato:wght@400;700;900',
  'Playfair Display': 'Playfair+Display:wght@500;600;700;800',
  Merriweather: 'Merriweather:wght@400;700;900',
  'DM Sans': 'DM+Sans:wght@400;500;600;700',
  Outfit: 'Outfit:wght@400;500;600;700;800',
};

function fontLinks(theme = {}) {
  const families = [...new Set([theme.font, theme.headingFont].filter((f) => f && FONTS[f]))];
  if (!families.length) families.push('Inter');
  const q = families.map((f) => `family=${FONTS[f]}`).join('&');
  return `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?${q}&display=swap">`;
}

// Theme variables come from shared/theme.js (also used by the editor canvas).
const { themeVars } = require('./theme');

const BASE_CSS = `
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;font-family:var(--pb-font);color:var(--pb-text);background:var(--pb-bg);line-height:1.6;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}
a{color:var(--pb-primary)}
.pb-section{padding:80px 24px;position:relative}
.pb-section--tight{padding:48px 24px}
.pb-section--alt{background:var(--pb-surface)}
.pb-section--dark{background:var(--pb-dark);color:#fff}
.pb-section--primary{background:var(--pb-primary);color:var(--pb-primary-contrast)}
.pb-section--gradient{background:linear-gradient(135deg,var(--pb-primary) 0%,var(--pb-dark) 100%);color:#fff}
.pb-section--dark .pb-lead,.pb-section--dark .pb-muted,.pb-section--primary .pb-lead,.pb-section--primary .pb-muted,.pb-section--gradient .pb-lead,.pb-section--gradient .pb-muted{color:rgba(255,255,255,.82)}
.pb-container{max-width:1160px;margin:0 auto;width:100%}
.pb-container--narrow{max-width:780px}
.pb-center{text-align:center}
.pb-center .pb-lead{margin-left:auto;margin-right:auto}
.pb-eyebrow{display:inline-block;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--pb-primary);margin-bottom:14px}
.pb-section--dark .pb-eyebrow,.pb-section--primary .pb-eyebrow,.pb-section--gradient .pb-eyebrow{color:var(--pb-accent)}
.pb-h1,.pb-h2,.pb-h3,.pb-h4{font-family:var(--pb-heading-font);line-height:1.15;margin:0 0 16px;letter-spacing:-.02em}
.pb-h1{font-size:clamp(34px,5vw,58px);font-weight:800}
.pb-h2{font-size:clamp(28px,3.4vw,40px);font-weight:700}
.pb-h3{font-size:21px;font-weight:700}
.pb-h4{font-size:17px;font-weight:700}
.pb-lead{font-size:clamp(17px,1.6vw,20px);color:var(--pb-muted);max-width:680px;margin:0 0 28px}
.pb-text{margin:0 0 16px}
.pb-muted{color:var(--pb-muted)}
.pb-section-head{margin-bottom:48px}
.pb-actions{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.pb-center .pb-actions{justify-content:center}
.pb-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:14px 28px;border-radius:var(--pb-radius);font-weight:700;font-size:16px;text-decoration:none;border:2px solid transparent;cursor:pointer;transition:transform .15s ease,box-shadow .15s ease,background .15s;font-family:inherit;line-height:1.2}
.pb-btn:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(0,0,0,.12)}
.pb-btn--primary{background:var(--pb-primary);color:var(--pb-primary-contrast)}
.pb-btn--accent{background:var(--pb-accent);color:#111}
.pb-btn--outline{background:transparent;color:var(--pb-primary);border-color:var(--pb-primary)}
.pb-btn--light{background:#fff;color:var(--pb-primary)}
.pb-btn--ghost{background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.4)}
.pb-btn--lg{padding:18px 34px;font-size:18px}
.pb-btn--block{width:100%}
.pb-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:color-mix(in srgb,var(--pb-primary) 10%,transparent);color:var(--pb-primary);font-size:13px;font-weight:600}
.pb-section--dark .pb-badge,.pb-section--gradient .pb-badge,.pb-section--primary .pb-badge{background:rgba(255,255,255,.14);color:#fff}
.pb-badges{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}
.pb-grid{display:grid;gap:24px}
.pb-grid--2{grid-template-columns:repeat(2,minmax(0,1fr))}
.pb-grid--3{grid-template-columns:repeat(3,minmax(0,1fr))}
.pb-grid--4{grid-template-columns:repeat(4,minmax(0,1fr))}
.pb-card{background:var(--pb-card);border:1px solid var(--pb-border);border-radius:var(--pb-radius);padding:28px;box-shadow:0 1px 2px rgba(15,23,42,.04);color:var(--pb-text)}
.pb-card--hover{transition:transform .2s,box-shadow .2s}
.pb-card--hover:hover{transform:translateY(-4px);box-shadow:0 18px 40px rgba(15,23,42,.10)}
.pb-icon{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:26px;background:color-mix(in srgb,var(--pb-primary) 10%,transparent);margin-bottom:18px}
.pb-split{display:grid;grid-template-columns:1.05fr 1fr;gap:56px;align-items:center}
.pb-split--reverse>:first-child{order:2}
.pb-media{border-radius:calc(var(--pb-radius) + 6px);overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,.18)}
.pb-media img{width:100%;height:100%;object-fit:cover;aspect-ratio:4/3}
.pb-list{list-style:none;padding:0;margin:0 0 24px;display:grid;gap:12px}
.pb-list li{display:flex;gap:12px;align-items:flex-start}
.pb-list li::before{content:"✓";flex:0 0 24px;height:24px;border-radius:999px;background:var(--pb-primary);color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:2px}
.pb-nav{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--pb-bg) 90%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--pb-border);padding:14px 24px}
.pb-nav__inner{max-width:1160px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:24px}
.pb-nav__brand{font-family:var(--pb-heading-font);font-weight:800;font-size:21px;color:var(--pb-text);text-decoration:none}
.pb-nav__links{display:flex;gap:22px;margin-left:auto}
.pb-nav__links a{color:var(--pb-muted);text-decoration:none;font-weight:500;font-size:15px}
.pb-nav__links a:hover{color:var(--pb-primary)}
.pb-nav .pb-btn{padding:10px 18px;font-size:14px}
.pb-hero{padding:96px 24px}
.pb-hero--image{background-size:cover;background-position:center;color:#fff;min-height:620px;display:flex;align-items:center}
.pb-hero--image::before{content:"";position:absolute;inset:0;background:linear-gradient(110deg,rgba(5,15,35,.86) 0%,rgba(5,15,35,.45) 100%)}
.pb-hero--image>.pb-container{position:relative}
.pb-hero--image .pb-lead{color:rgba(255,255,255,.86)}
.pb-hero--image .pb-eyebrow{color:var(--pb-accent)}
.pb-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px}
.pb-stat__value{font-family:var(--pb-heading-font);font-size:clamp(30px,3.6vw,44px);font-weight:800;color:var(--pb-primary);line-height:1.1}
.pb-section--dark .pb-stat__value,.pb-section--primary .pb-stat__value,.pb-section--gradient .pb-stat__value{color:#fff}
.pb-stat__label{color:var(--pb-muted);font-size:15px;margin-top:6px}
.pb-step__num{width:44px;height:44px;border-radius:999px;background:var(--pb-primary);color:var(--pb-primary-contrast);font-weight:800;display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:18px}
.pb-quote{font-size:17px;line-height:1.7;margin:0 0 20px}
.pb-quote::before{content:"“";display:block;font-size:56px;line-height:.6;color:var(--pb-primary);font-family:Georgia,serif;margin-bottom:12px}
.pb-person{display:flex;align-items:center;gap:12px}
.pb-avatar{width:46px;height:46px;border-radius:999px;background:var(--pb-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;flex:0 0 46px;overflow:hidden}
.pb-avatar img{width:100%;height:100%;object-fit:cover}
.pb-stars{color:#F59E0B;letter-spacing:2px;margin-bottom:10px}
.pb-price{font-family:var(--pb-heading-font);font-size:40px;font-weight:800;margin:10px 0 4px}
.pb-plan--featured{border:2px solid var(--pb-primary);box-shadow:0 24px 60px rgba(0,74,173,.18);position:relative}
.pb-plan__tag{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--pb-primary);color:#fff;font-size:12px;font-weight:700;padding:4px 12px;border-radius:999px}
.pb-faq{display:grid;gap:12px}
.pb-faq details{background:var(--pb-card);border:1px solid var(--pb-border);border-radius:var(--pb-radius);padding:18px 22px}
.pb-faq summary{cursor:pointer;font-weight:700;list-style:none;display:flex;justify-content:space-between;gap:12px}
.pb-faq summary::after{content:"+";color:var(--pb-primary);font-size:22px;line-height:1}
.pb-faq details[open] summary::after{content:"−"}
.pb-faq details p{margin:12px 0 0;color:var(--pb-muted)}
.pb-gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.pb-gallery figure{margin:0;border-radius:var(--pb-radius);overflow:hidden;position:relative}
.pb-gallery img{width:100%;aspect-ratio:4/3;object-fit:cover}
.pb-gallery figcaption{position:absolute;left:0;right:0;bottom:0;padding:14px 16px;color:#fff;font-weight:600;background:linear-gradient(transparent,rgba(0,0,0,.65))}
.pb-logos{display:flex;flex-wrap:wrap;justify-content:center;gap:18px 44px;align-items:center}
.pb-logos span{font-family:var(--pb-heading-font);font-weight:800;font-size:20px;color:var(--pb-muted);opacity:.75;letter-spacing:-.02em}
.pb-team img{aspect-ratio:1;object-fit:cover;border-radius:var(--pb-radius);margin-bottom:14px;width:100%}
.pb-cta{border-radius:calc(var(--pb-radius) + 10px);padding:56px;display:flex;flex-wrap:wrap;gap:24px;align-items:center;justify-content:space-between;background:linear-gradient(135deg,var(--pb-primary),var(--pb-dark));color:#fff}
.pb-cta .pb-lead{color:rgba(255,255,255,.85);margin-bottom:0}
.pb-video{position:relative;padding-top:56.25%;border-radius:var(--pb-radius);overflow:hidden;background:#000}
.pb-video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.pb-map iframe{width:100%;height:380px;border:0;border-radius:var(--pb-radius)}
.pb-countdown{display:flex;gap:14px;flex-wrap:wrap}
.pb-countdown__box{min-width:86px;padding:14px 10px;border-radius:var(--pb-radius);background:rgba(255,255,255,.12);text-align:center}
.pb-section:not(.pb-section--dark):not(.pb-section--primary):not(.pb-section--gradient) .pb-countdown__box{background:var(--pb-surface)}
.pb-countdown__value{font-family:var(--pb-heading-font);font-size:34px;font-weight:800;line-height:1.1}
.pb-countdown__label{font-size:12px;text-transform:uppercase;letter-spacing:.08em;opacity:.8}
.pb-footer{background:var(--pb-dark);color:rgba(255,255,255,.8);padding:56px 24px 28px}
.pb-footer a{color:rgba(255,255,255,.8);text-decoration:none}
.pb-footer__grid{display:grid;grid-template-columns:2fr 1fr;gap:32px}
.pb-footer__brand{font-family:var(--pb-heading-font);font-size:22px;font-weight:800;color:#fff;margin-bottom:10px}
.pb-footer__links{display:grid;gap:8px;align-content:start}
.pb-footer__legal{border-top:1px solid rgba(255,255,255,.12);margin-top:36px;padding-top:20px;font-size:14px;color:rgba(255,255,255,.6)}
/* ---------- lead form ---------- */
.pb-form-card{background:var(--pb-card);color:var(--pb-text);border-radius:calc(var(--pb-radius) + 4px);padding:32px;box-shadow:0 24px 60px rgba(15,23,42,.16);border:1px solid var(--pb-border)}
.pb-form-card .pb-h3{margin-bottom:6px}
.pb-form-card__sub{color:var(--pb-muted);margin:0 0 20px;font-size:15px}
.pb-form{display:block}
.pb-form-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 16px}
.pb-form--single .pb-form-fields{grid-template-columns:1fr}
.pb-field{display:flex;flex-direction:column;gap:6px;grid-column:span 2}
.pb-field--half{grid-column:span 1}
.pb-form--single .pb-field,.pb-form--single .pb-field--half{grid-column:span 1}
.pb-field label,.pb-field .pb-field__label{font-size:14px;font-weight:600;color:var(--pb-text)}
.pb-field .pb-req{color:#DC2626;margin-left:2px}
.pb-field input,.pb-field select,.pb-field textarea{width:100%;font:inherit;font-size:15px;padding:12px 14px;border:1.5px solid color-mix(in srgb,var(--pb-text) 18%,transparent);border-radius:calc(var(--pb-radius) - 4px);background:var(--pb-card);color:var(--pb-text);outline:none;transition:border-color .15s,box-shadow .15s}
.pb-field input:focus,.pb-field select:focus,.pb-field textarea:focus{border-color:var(--pb-primary);box-shadow:0 0 0 4px rgba(0,74,173,.12)}
.pb-field textarea{min-height:110px;resize:vertical}
.pb-field__options{display:flex;flex-wrap:wrap;gap:10px 18px}
.pb-field__options label{display:flex;align-items:center;gap:8px;font-weight:500}
.pb-field__options input{width:auto}
.pb-field--consent label{display:flex;gap:10px;align-items:flex-start;font-weight:500;font-size:13.5px;color:var(--pb-muted)}
.pb-field--consent input{width:18px;height:18px;margin-top:2px;flex:0 0 18px}
.pb-field.is-invalid input,.pb-field.is-invalid select,.pb-field.is-invalid textarea{border-color:#DC2626}
.pb-field__error{color:#DC2626;font-size:13px}
.pb-form-step{display:contents}
.pb-form-step__title{grid-column:1/-1;font-weight:700;font-size:16px;margin:4px 0}
.pb-form[data-pb-steps="true"] .pb-form-step{display:none}
.pb-form[data-pb-steps="true"] .pb-form-step.is-active{display:contents}
.pb-form-progress{display:flex;gap:6px;margin-bottom:18px}
.pb-form-progress span{flex:1;height:6px;border-radius:999px;background:var(--pb-border)}
.pb-form-progress span.is-done{background:var(--pb-primary)}
.pb-form-actions{display:flex;gap:10px;margin-top:20px}
.pb-form-actions .pb-btn{flex:1}
.pb-form-message{margin-top:14px;padding:12px 14px;border-radius:10px;font-size:14px}
.pb-form-message--error{background:#FEF2F2;color:#B91C1C}
.pb-form-success{text-align:center;padding:24px 8px}
.pb-form-success__icon{width:64px;height:64px;border-radius:999px;background:#DCFCE7;color:#15803D;font-size:32px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
.pb-form-note{font-size:12.5px;color:var(--pb-muted);text-align:center;margin-top:12px}
.pb-otp{display:flex;gap:8px;margin-top:8px}
.pb-otp input{flex:1}
.pb-otp .pb-btn{padding:10px 14px;font-size:14px}
.pb-otp-status{font-size:13px;color:var(--pb-muted)}
.pb-otp-status.is-ok{color:#15803D;font-weight:600}
/* ---------- modern look ---------- */
.pb-eyebrow{padding:6px 14px;border-radius:999px;background:color-mix(in srgb,var(--pb-primary) 10%,transparent)}
.pb-section--dark .pb-eyebrow,.pb-section--primary .pb-eyebrow,.pb-section--gradient .pb-eyebrow,.pb-hero--image .pb-eyebrow{background:rgba(255,255,255,.12)}
.pb-btn--primary{background:linear-gradient(135deg,var(--pb-primary),color-mix(in srgb,var(--pb-primary) 65%,var(--pb-accent)));box-shadow:0 10px 26px color-mix(in srgb,var(--pb-primary) 32%,transparent)}
.pb-btn--primary:hover{box-shadow:0 16px 34px color-mix(in srgb,var(--pb-primary) 40%,transparent)}
.pb-hero:not([class*="pb-section--"]):not(.pb-hero--image){background:radial-gradient(900px 420px at 88% -8%,color-mix(in srgb,var(--pb-primary) 16%,transparent),transparent 62%),radial-gradient(700px 380px at -8% 108%,color-mix(in srgb,var(--pb-accent) 14%,transparent),transparent 60%),var(--pb-bg)}
.pb-section--gradient{background:radial-gradient(800px 400px at 90% 0%,color-mix(in srgb,var(--pb-accent) 30%,transparent),transparent 60%),linear-gradient(135deg,var(--pb-primary) 0%,var(--pb-dark) 100%)}
.pb-card{border-radius:calc(var(--pb-radius) + 4px);box-shadow:0 1px 2px rgba(15,23,42,.04),0 8px 24px rgba(15,23,42,.05);transition:transform .25s ease,box-shadow .25s ease}
.pb-grid>.pb-card:hover{transform:translateY(-4px);box-shadow:0 20px 44px rgba(15,23,42,.10)}
.pb-icon{background:linear-gradient(135deg,color-mix(in srgb,var(--pb-primary) 14%,transparent),color-mix(in srgb,var(--pb-accent) 14%,transparent))}
.pb-media{transition:transform .5s ease}
.pb-media:hover{transform:scale(1.015)}
/* utilities the AI and users can apply */
.pb-gradient-text{background:linear-gradient(120deg,var(--pb-primary),var(--pb-accent));-webkit-background-clip:text;background-clip:text;color:transparent}
.pb-glass{background:rgba(255,255,255,.14);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.25)}
.pb-shadow-xl{box-shadow:0 30px 70px rgba(15,23,42,.22)}
.pb-rounded-2xl{border-radius:28px}
.pb-hover-lift{transition:transform .25s ease,box-shadow .25s ease}
.pb-hover-lift:hover{transform:translateY(-6px);box-shadow:0 22px 48px rgba(15,23,42,.14)}
.pb-hover-glow{transition:box-shadow .25s ease}
.pb-hover-glow:hover{box-shadow:0 0 0 4px color-mix(in srgb,var(--pb-primary) 18%,transparent),0 18px 40px color-mix(in srgb,var(--pb-primary) 25%,transparent)}
.pb-hover-zoom{overflow:hidden}
.pb-hover-zoom img{transition:transform .6s ease}
.pb-hover-zoom:hover img{transform:scale(1.06)}
@keyframes pb-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes pb-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
@keyframes pb-gradient-move{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
.pb-float{animation:pb-float 5s ease-in-out infinite}
.pb-pulse{animation:pb-pulse 2.4s ease-in-out infinite}
.pb-animated-gradient{background-size:200% 200%;animation:pb-gradient-move 10s ease infinite}
/* scroll reveal: the runtime adds .pb-js to <html> and .pb-in when visible
   (nothing is hidden in the editor or without JavaScript) */
.pb-js .pb-section-head,.pb-js .pb-grid>*,.pb-js .pb-stats>*,.pb-js .pb-split>*,.pb-js .pb-gallery>*,.pb-js .pb-faq>*,
.pb-js .pb-anim-fade-up,.pb-js .pb-anim-fade-in,.pb-js .pb-anim-zoom-in,.pb-js .pb-anim-slide-left,.pb-js .pb-anim-slide-right{opacity:0;transition:opacity .75s ease,transform .75s cubic-bezier(.2,.7,.2,1)}
.pb-js .pb-section-head,.pb-js .pb-grid>*,.pb-js .pb-stats>*,.pb-js .pb-split>*,.pb-js .pb-gallery>*,.pb-js .pb-faq>*,.pb-js .pb-anim-fade-up{transform:translateY(26px)}
.pb-js .pb-anim-zoom-in{transform:scale(.94)}
.pb-js .pb-anim-slide-left{transform:translateX(-40px)}
.pb-js .pb-anim-slide-right{transform:translateX(40px)}
.pb-js .pb-in{opacity:1;transform:none}
.pb-js .pb-grid>:nth-child(2),.pb-js .pb-stats>:nth-child(2),.pb-js .pb-split>:nth-child(2),.pb-js .pb-gallery>:nth-child(2){transition-delay:.08s}
.pb-js .pb-grid>:nth-child(3),.pb-js .pb-stats>:nth-child(3),.pb-js .pb-gallery>:nth-child(3){transition-delay:.16s}
.pb-js .pb-grid>:nth-child(4),.pb-js .pb-stats>:nth-child(4),.pb-js .pb-gallery>:nth-child(4){transition-delay:.24s}
.pb-delay-1{transition-delay:.1s!important;animation-delay:.1s}
.pb-delay-2{transition-delay:.2s!important;animation-delay:.2s}
.pb-delay-3{transition-delay:.3s!important;animation-delay:.3s}
@media (prefers-reduced-motion:reduce){
  .pb-js *{opacity:1!important;transform:none!important;animation:none!important;transition:none!important}
}
/* ---------- layout variants ---------- */
.pb-nav--centered .pb-nav__inner{flex-direction:column;gap:10px}
.pb-nav--centered .pb-nav__links{margin-left:0}
.pb-nav--dark{background:var(--pb-dark);border-bottom-color:rgba(255,255,255,.08)}
.pb-nav--dark .pb-nav__brand{color:#fff}
.pb-nav--dark .pb-nav__links a{color:rgba(255,255,255,.72)}
.pb-nav--dark .pb-nav__links a:hover{color:#fff}
.pb-bento{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
.pb-bento>:first-child{grid-column:span 2;grid-row:span 2;display:flex;flex-direction:column;justify-content:flex-end;min-height:280px;background:linear-gradient(140deg,color-mix(in srgb,var(--pb-primary) 14%,var(--pb-card)),var(--pb-card))}
.pb-bento>:first-child .pb-h3{font-size:26px}
.pb-quote--hero{font-size:clamp(20px,2.4vw,28px);font-family:var(--pb-heading-font);font-weight:600;line-height:1.45;letter-spacing:-.01em;margin:8px 0 24px}
.pb-quote--hero::before{margin:0 auto 12px}
.pb-faq-split{display:grid;grid-template-columns:1fr 1.4fr;gap:56px;align-items:start}
.pb-gallery--wide{grid-template-columns:repeat(2,minmax(0,1fr))}
.pb-gallery--wide img{aspect-ratio:16/10}
.pb-stats>.pb-card{padding:28px 18px}
.pb-footer__row{display:flex;flex-wrap:wrap;align-items:center;gap:16px 32px}
.pb-footer--simple{padding:28px 24px}
.pb-footer--simple .pb-footer__brand{margin:0}
.pb-footer--simple .pb-footer__links{display:flex;flex-wrap:wrap;gap:20px}
.pb-footer--simple .pb-footer__legal{border:0;margin:0 0 0 auto;padding:0}
.pb-footer--centered{text-align:center}
.pb-footer--centered .pb-footer__links{display:flex;justify-content:center;flex-wrap:wrap;gap:12px 24px;margin:18px 0 0}
/* hero: minimal (oversized type on a soft grid) */
.pb-hero--minimal{text-align:center;padding:128px 24px 112px;overflow:hidden}
.pb-hero--minimal::before{content:"";position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(color-mix(in srgb,var(--pb-text) 7%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--pb-text) 7%,transparent) 1px,transparent 1px);background-size:56px 56px;-webkit-mask-image:radial-gradient(ellipse 70% 62% at 50% 38%,#000 25%,transparent 75%);mask-image:radial-gradient(ellipse 70% 62% at 50% 38%,#000 25%,transparent 75%)}
.pb-hero--minimal>.pb-container{position:relative;max-width:1000px}
.pb-hero--minimal .pb-h1{font-size:clamp(42px,7vw,88px);letter-spacing:-.045em;line-height:1.02;margin-bottom:22px}
.pb-hero--minimal .pb-lead{margin-left:auto;margin-right:auto;font-size:clamp(18px,1.8vw,22px)}
.pb-hero--minimal .pb-actions,.pb-hero--minimal .pb-badges{justify-content:center}
/* hero: showcase (copy above a framed wide image) */
.pb-hero--showcase{padding-bottom:72px;overflow:hidden}
.pb-showcase__copy{max-width:820px;margin:0 auto 56px;text-align:center}
.pb-showcase__copy .pb-lead{margin-left:auto;margin-right:auto}
.pb-showcase__copy .pb-actions,.pb-showcase__copy .pb-badges{justify-content:center}
.pb-showcase{position:relative;max-width:1080px;margin:0 auto}
.pb-showcase::before{content:"";position:absolute;inset:10% 8% -4%;background:linear-gradient(120deg,var(--pb-primary),var(--pb-accent));filter:blur(70px);opacity:.38;pointer-events:none}
.pb-showcase .pb-media{position:relative;padding:10px;background:var(--pb-card);border:1px solid var(--pb-border)}
.pb-showcase .pb-media img{aspect-ratio:16/9;border-radius:calc(var(--pb-radius) + 2px)}
/* features: list and numbered */
.pb-feature-list{display:grid;grid-template-columns:1fr 1.3fr;gap:64px;align-items:start}
.pb-feature-list__head{position:sticky;top:110px}
.pb-feature-list__head .pb-section-head{margin-bottom:24px}
.pb-feature-row{display:flex;gap:20px;padding:26px 0;border-bottom:1px solid var(--pb-border)}
.pb-feature-row:first-child{padding-top:0}
.pb-feature-row:last-child{border-bottom:0}
.pb-feature-row .pb-icon{flex:0 0 52px;margin:0}
.pb-feature-row .pb-h3{margin-bottom:6px}
.pb-feature-row .pb-text{margin:0}
.pb-num-card{padding-top:22px;border-top:2px solid var(--pb-border);transition:border-color .25s}
.pb-num-card:hover{border-top-color:var(--pb-primary)}
.pb-num{font-family:var(--pb-heading-font);font-size:clamp(40px,4.4vw,60px);font-weight:800;line-height:1;margin-bottom:18px;letter-spacing:-.04em;background:linear-gradient(120deg,var(--pb-primary),var(--pb-accent));-webkit-background-clip:text;background-clip:text;color:transparent}
.pb-section--dark .pb-num,.pb-section--primary .pb-num,.pb-section--gradient .pb-num{background:none;color:#fff}
/* stats: band */
.pb-stats--band{gap:0}
.pb-stats--band>div{padding:6px 24px;border-left:1px solid color-mix(in srgb,currentColor 22%,transparent)}
.pb-stats--band>div:first-child{border-left:0}
.pb-stats--band .pb-stat__value{font-size:clamp(36px,4.6vw,60px);letter-spacing:-.03em}
.pb-section--dark .pb-stat__label,.pb-section--primary .pb-stat__label,.pb-section--gradient .pb-stat__label{color:rgba(255,255,255,.8)}
/* steps: timeline */
.pb-timeline{position:relative;display:grid;gap:36px}
.pb-timeline::before{content:"";position:absolute;left:21px;top:10px;bottom:10px;width:2px;background:linear-gradient(var(--pb-primary),color-mix(in srgb,var(--pb-accent) 50%,transparent))}
.pb-timeline__item{display:flex;gap:24px;align-items:flex-start;position:relative}
.pb-timeline__item .pb-step__num{flex:0 0 44px;margin:0}
.pb-timeline__item .pb-h3{margin-bottom:6px}
.pb-timeline__item .pb-text{margin:0}
/* ---------- responsive ---------- */
@media (max-width:960px){
  .pb-grid--4,.pb-stats{grid-template-columns:repeat(2,minmax(0,1fr))}
  .pb-grid--3,.pb-gallery{grid-template-columns:repeat(2,minmax(0,1fr))}
  .pb-split{grid-template-columns:1fr;gap:36px}
  .pb-split--reverse>:first-child{order:0}
  .pb-bento,.pb-faq-split,.pb-feature-list{grid-template-columns:1fr}
  .pb-feature-list{gap:28px}
  .pb-feature-list__head{position:static}
  .pb-bento>:first-child{grid-column:auto;grid-row:auto;min-height:0}
}
@media (max-width:640px){
  .pb-section{padding:56px 18px}
  .pb-hero{padding:64px 18px}
  .pb-grid--2,.pb-grid--3,.pb-grid--4,.pb-gallery,.pb-gallery--wide{grid-template-columns:1fr}
  .pb-footer--simple .pb-footer__legal{margin:0}
  .pb-stats{grid-template-columns:repeat(2,minmax(0,1fr))}
  .pb-stats--band>div{border-left:0;padding:10px 8px}
  .pb-hero--minimal{padding:84px 18px 72px}
  .pb-nav__links{display:none}
  .pb-form-fields{grid-template-columns:1fr}
  .pb-field,.pb-field--half{grid-column:span 1}
  .pb-cta{padding:32px 24px}
  .pb-footer__grid{grid-template-columns:1fr}
  .pb-form-card{padding:22px}
}
`;

module.exports = { BASE_CSS, FONTS, fontLinks, themeVars };
