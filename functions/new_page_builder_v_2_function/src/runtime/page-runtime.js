/* Page Builder V2 - published page runtime.
 * Served at /api/public/runtime.js and loaded by every published page.
 * Reads window.__PB = { pageId, api, preview, captchaSiteKey, captcha, pixelId }.
 * No dependencies; works in all evergreen browsers. */
(function () {
  'use strict';

  var PB = window.__PB || {};
  var API = PB.api || '';
  var STORE_KEY = 'pb_track_' + PB.pageId;

  // ---------- tracking: channel, UTM, referrer ----------
  function readTracking() {
    var stored = null;
    try {
      stored = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null');
    } catch (e) {
      stored = null;
    }
    var params = new URLSearchParams(location.search);
    var keys = ['ch', 'tag', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    var fromUrl = {};
    var hasUrl = false;
    keys.forEach(function (k) {
      var v = params.get(k);
      if (v) {
        fromUrl[k] = v.slice(0, 200);
        hasUrl = true;
      }
    });
    var embedded = false;
    try {
      embedded = window.self !== window.top;
    } catch (e) {
      embedded = true;
    }
    // First touch in this session wins unless the URL carries new campaign data.
    var t = hasUrl || !stored ? fromUrl : stored;
    t.referrer = (stored && stored.referrer) || document.referrer || '';
    t.landingUrl = (stored && stored.landingUrl) || location.href;
    t.embedded = embedded || (stored && stored.embedded) || false;
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(t));
    } catch (e) {
      /* storage blocked */
    }
    return t;
  }
  var tracking = readTracking();

  function post(path, body) {
    return fetch(API + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
      credentials: 'omit',
    }).then(function (res) {
      return res
        .json()
        .catch(function () {
          return {};
        })
        .then(function (json) {
          if (!res.ok || json.success === false) {
            var err = new Error((json && json.message) || 'Something went wrong. Please try again.');
            err.details = json && json.details;
            throw err;
          }
          return json.data;
        });
    });
  }

  function sendView() {
    if (PB.preview || !PB.pageId) return;
    var k = 'pb_viewed_' + PB.pageId;
    try {
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, '1');
    } catch (e) {
      /* count anyway */
    }
    post('/pages/' + PB.pageId + '/view', { tracking: tracking }).catch(function () {});
  }

  // ---------- Meta pixel ----------
  function pixel(event) {
    if (window.fbq && !PB.preview) {
      try {
        window.fbq('track', event);
      } catch (e) {
        /* ignore */
      }
    }
  }

  // ---------- countdown ----------
  function initCountdowns() {
    var nodes = document.querySelectorAll('[data-pb-countdown]');
    if (!nodes.length) return;
    function tick() {
      nodes.forEach(function (n) {
        var target = new Date(n.getAttribute('data-pb-countdown')).getTime();
        var diff = Math.max(0, isNaN(target) ? 0 : target - Date.now());
        var parts = {
          d: Math.floor(diff / 86400000),
          h: Math.floor((diff / 3600000) % 24),
          m: Math.floor((diff / 60000) % 60),
          s: Math.floor((diff / 1000) % 60),
        };
        Object.keys(parts).forEach(function (p) {
          var el = n.querySelector('[data-pb-countdown-part="' + p + '"]');
          if (el) el.textContent = String(parts[p]).padStart(2, '0');
        });
      });
    }
    tick();
    setInterval(tick, 1000);
  }

  // ---------- forms ----------
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function fieldValue(form, field) {
    var name = field.getAttribute('data-name');
    var type = field.getAttribute('data-type');
    if (type === 'checkbox') {
      return Array.prototype.slice
        .call(field.querySelectorAll('input[type=checkbox]:checked'))
        .map(function (i) {
          return i.value;
        });
    }
    if (type === 'radio') {
      var r = field.querySelector('input[type=radio]:checked');
      return r ? r.value : '';
    }
    if (type === 'consent') {
      var c = field.querySelector('input[type=checkbox]');
      return c && c.checked ? 'yes' : '';
    }
    var input = field.querySelector('input, select, textarea');
    return input ? String(input.value || '').trim() : '';
  }

  function setError(field, message) {
    var old = field.querySelector('.pb-field__error');
    if (old) old.remove();
    field.classList.toggle('is-invalid', !!message);
    if (message) field.appendChild(el('div', 'pb-field__error', message));
  }

  function validateField(field, otpTokens) {
    var type = field.getAttribute('data-type');
    var label = field.getAttribute('data-label') || 'This field';
    var required = field.getAttribute('data-required') === 'true';
    var v = fieldValue(null, field);
    var empty = Array.isArray(v) ? !v.length : !v;
    var msg = '';
    if (required && empty) msg = type === 'consent' ? 'Please accept to continue' : label + ' is required';
    else if (!empty && type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = 'Enter a valid email address';
    else if (!empty && type === 'tel' && v.replace(/\D/g, '').length < 10) msg = 'Enter a valid 10 digit mobile number';
    else if (!empty && type === 'pincode' && !/^\d{6}$/.test(v)) msg = 'Enter a 6 digit pincode';
    else if (!empty && type === 'tel' && field.getAttribute('data-otp') === 'true' && !otpTokens[field.getAttribute('data-name')]) {
      msg = 'Please verify this number with the OTP';
    }
    setError(field, msg);
    return !msg;
  }

  function initForm(form) {
    var fields = function (scope) {
      return Array.prototype.slice.call((scope || form).querySelectorAll('[data-pb-field]'));
    };
    var steps = Array.prototype.slice.call(form.querySelectorAll('.pb-form-step'));
    var multi = form.getAttribute('data-pb-steps') === 'true' && steps.length > 1;
    var current = 0;
    var leadToken = null;
    var otpTokens = {};
    var captchaWidget = null;
    var submitBtn = form.querySelector('.pb-form-submit') || form.querySelector('[type=submit]');
    var actions = form.querySelector('.pb-form-actions') || (submitBtn && submitBtn.parentNode) || form;
    var message = el('div', 'pb-form-message pb-form-message--error');
    message.style.display = 'none';
    actions.parentNode.insertBefore(message, actions.nextSibling);
    var submitLabel = submitBtn ? submitBtn.textContent : 'Submit';

    function showMessage(text) {
      message.textContent = text || '';
      message.style.display = text ? 'block' : 'none';
    }

    function busy(on, label) {
      if (!submitBtn) return;
      submitBtn.disabled = on;
      submitBtn.textContent = on ? label || 'Please wait…' : multi && current < steps.length - 1 ? 'Next' : submitLabel;
    }

    // --- multi-step navigation ---
    var progress;
    var backBtn;
    function renderStep() {
      steps.forEach(function (s, i) {
        s.classList.toggle('is-active', i === current);
      });
      if (progress) {
        Array.prototype.forEach.call(progress.children, function (bar, i) {
          bar.classList.toggle('is-done', i <= current);
        });
      }
      if (backBtn) backBtn.style.display = current > 0 ? '' : 'none';
      if (submitBtn) submitBtn.textContent = current < steps.length - 1 ? 'Next' : submitLabel;
      updateCaptchaVisibility();
    }
    if (multi) {
      progress = el('div', 'pb-form-progress');
      steps.forEach(function () {
        progress.appendChild(el('span'));
      });
      form.insertBefore(progress, form.firstChild);
      backBtn = el('button', 'pb-btn pb-btn--outline', 'Back');
      backBtn.type = 'button';
      backBtn.addEventListener('click', function () {
        current = Math.max(0, current - 1);
        showMessage('');
        renderStep();
      });
      actions.insertBefore(backBtn, actions.firstChild);
      renderStep();
    }

    // --- OTP ---
    fields().forEach(function (field) {
      if (field.getAttribute('data-type') !== 'tel' || field.getAttribute('data-otp') !== 'true') return;
      var name = field.getAttribute('data-name');
      var input = field.querySelector('input');
      var box = el('div', 'pb-otp');
      var code = el('input');
      code.type = 'text';
      code.inputMode = 'numeric';
      code.maxLength = 8;
      code.placeholder = 'Enter OTP';
      code.style.display = 'none';
      var btn = el('button', 'pb-btn pb-btn--outline', 'Send OTP');
      btn.type = 'button';
      var status = el('div', 'pb-otp-status');
      box.appendChild(code);
      box.appendChild(btn);
      field.appendChild(box);
      field.appendChild(status);
      var sent = false;
      input.addEventListener('input', function () {
        if (otpTokens[name]) {
          delete otpTokens[name];
          status.textContent = 'Number changed. Please verify again.';
          status.classList.remove('is-ok');
        }
        sent = false;
        code.style.display = 'none';
        btn.textContent = 'Send OTP';
        btn.disabled = false;
      });
      btn.addEventListener('click', function () {
        var phone = input.value;
        if (phone.replace(/\D/g, '').length < 10) {
          setError(field, 'Enter a valid 10 digit mobile number');
          return;
        }
        btn.disabled = true;
        if (!sent) {
          if (PB.preview) {
            sent = true;
            code.style.display = '';
            btn.textContent = 'Verify';
            btn.disabled = false;
            status.textContent = 'Preview: any 4-6 digit code is accepted.';
            return;
          }
          post('/otp/send', { phone: phone, pageId: PB.pageId })
            .then(function (r) {
              sent = true;
              code.style.display = '';
              code.focus();
              btn.textContent = 'Verify';
              status.textContent = (r && r.hint) || 'We sent a code to your number.';
            })
            .catch(function (e) {
              status.textContent = e.message;
            })
            .then(function () {
              btn.disabled = false;
            });
        } else {
          if (PB.preview) {
            otpTokens[name] = 'preview';
            status.textContent = 'Number verified ✓';
            status.classList.add('is-ok');
            box.style.display = 'none';
            setError(field, '');
            return;
          }
          post('/otp/verify', { phone: phone, code: code.value, pageId: PB.pageId })
            .then(function (r) {
              otpTokens[name] = r.otpToken;
              status.textContent = 'Number verified ✓';
              status.classList.add('is-ok');
              box.style.display = 'none';
              setError(field, '');
            })
            .catch(function (e) {
              status.textContent = e.message;
              btn.disabled = false;
            });
        }
      });
    });

    // --- pincode autofill ---
    fields().forEach(function (field) {
      if (field.getAttribute('data-type') !== 'pincode') return;
      var input = field.querySelector('input');
      input.addEventListener('input', function () {
        var pin = input.value.replace(/\D/g, '').slice(0, 6);
        if (input.value !== pin) input.value = pin;
        if (pin.length !== 6 || PB.preview) return;
        fetch(API + '/pincode/' + pin)
          .then(function (r) {
            return r.json();
          })
          .then(function (json) {
            var d = json && json.data;
            if (!d) {
              setError(field, 'We could not find this pincode');
              return;
            }
            setError(field, '');
            var fill = function (re, value) {
              fields().forEach(function (f) {
                if (!re.test(f.getAttribute('data-name')) || !value) return;
                var c = f.querySelector('input, select');
                if (!c) return;
                if (c.tagName === 'SELECT' && d.areas && re.source.indexOf('area') !== -1) {
                  c.innerHTML = '';
                  d.areas.forEach(function (a) {
                    var o = el('option', '', a);
                    o.value = a;
                    c.appendChild(o);
                  });
                } else if (!c.value) {
                  c.value = value;
                }
              });
            };
            fill(/city|district/, d.city);
            fill(/state/, d.state);
            fill(/area|locality/, d.areas && d.areas[0]);
          })
          .catch(function () {});
      });
    });

    // --- captcha ---
    var wantsCaptcha = (PB.captcha || form.getAttribute('data-pb-captcha') === 'true') && PB.captchaSiteKey;
    var captchaBox = null;
    function updateCaptchaVisibility() {
      if (captchaBox) captchaBox.style.display = !multi || current === 0 ? '' : 'none';
    }
    if (wantsCaptcha && !PB.preview) {
      captchaBox = el('div', 'pb-captcha');
      captchaBox.style.margin = '16px 0 0';
      actions.parentNode.insertBefore(captchaBox, actions);
      var renderCaptcha = function () {
        if (window.grecaptcha && window.grecaptcha.render) {
          captchaWidget = window.grecaptcha.render(captchaBox, { sitekey: PB.captchaSiteKey });
        } else {
          setTimeout(renderCaptcha, 300);
        }
      };
      renderCaptcha();
      updateCaptchaVisibility();
    }
    function captchaToken() {
      if (captchaWidget === null || !window.grecaptcha) return null;
      return window.grecaptcha.getResponse(captchaWidget);
    }

    // --- submit ---
    function collect(scopeFields) {
      var data = {};
      scopeFields.forEach(function (f) {
        data[f.getAttribute('data-name')] = fieldValue(form, f);
      });
      return data;
    }

    function success() {
      pixel('Lead');
      var redirect = form.getAttribute('data-pb-redirect');
      if (redirect && !PB.preview) {
        location.href = redirect;
        return;
      }
      var box = el('div', 'pb-form-success');
      box.appendChild(el('div', 'pb-form-success__icon', '✓'));
      box.appendChild(el('h3', 'pb-h', PB.preview ? 'Preview: form not submitted' : 'Thank you!'));
      box.appendChild(el('p', 'pb-muted', form.getAttribute('data-pb-success') || "We've received your details."));
      form.parentNode.replaceChild(box, form);
    }

    function handleError(e) {
      showMessage(e.message);
      var d = e.details || {};
      if (d.fields) {
        fields().forEach(function (f) {
          if (d.fields.indexOf(f.getAttribute('data-name')) !== -1) setError(f, e.message);
        });
      }
      if (d.captcha && captchaWidget !== null && window.grecaptcha) window.grecaptcha.reset(captchaWidget);
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      showMessage('');
      var scope = multi ? fields(steps[current]) : fields();
      var valid = scope.map(function (f) {
        return validateField(f, otpTokens);
      });
      if (valid.indexOf(false) !== -1) {
        var first = form.querySelector('.is-invalid input, .is-invalid select, .is-invalid textarea');
        if (first) first.focus();
        return;
      }
      var isLast = !multi || current === steps.length - 1;
      var needsCaptcha = wantsCaptcha && !PB.preview && !leadToken;
      if (needsCaptcha && (!multi || current === 0) && !captchaToken()) {
        showMessage('Please complete the captcha');
        return;
      }

      if (PB.preview) {
        if (isLast) success();
        else {
          current += 1;
          renderStep();
        }
        return;
      }

      var body = {
        fields: collect(isLast ? fields() : scope),
        step: multi ? current + 1 : null,
        partial: !isLast,
        leadToken: leadToken,
        captchaToken: needsCaptcha ? captchaToken() : null,
        otpTokens: otpTokens,
        tracking: tracking,
      };

      if (!isLast && !PB.partialCapture) {
        current += 1;
        renderStep();
        return;
      }

      busy(true, isLast ? 'Submitting…' : 'Saving…');
      post('/pages/' + PB.pageId + '/leads', body)
        .then(function (r) {
          if (r && r.leadToken) leadToken = r.leadToken;
          if (isLast) {
            success();
          } else {
            if (current === 0) pixel('InitiateCheckout');
            current += 1;
            busy(false);
            renderStep();
          }
        })
        .catch(function (e) {
          busy(false);
          handleError(e);
        });
    });

    fields().forEach(function (f) {
      f.addEventListener('change', function () {
        if (f.classList.contains('is-invalid')) validateField(f, otpTokens);
      });
    });
  }

  // ---------- scroll reveal animations ----------
  var REVEAL =
    '.pb-section-head,.pb-grid>*,.pb-stats>*,.pb-split>*,.pb-gallery>*,.pb-faq>*,' +
    '.pb-anim-fade-up,.pb-anim-fade-in,.pb-anim-zoom-in,.pb-anim-slide-left,.pb-anim-slide-right';
  function initReveal() {
    window.__PB_REVEAL = true;
    var root = document.documentElement;
    if (!root.classList.contains('pb-js')) return;
    var nodes = document.querySelectorAll(REVEAL);
    if (!('IntersectionObserver' in window)) {
      root.classList.remove('pb-js');
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('pb-in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    Array.prototype.forEach.call(nodes, function (n) {
      io.observe(n);
    });
  }

  function init() {
    initReveal();
    sendView();
    initCountdowns();
    Array.prototype.forEach.call(document.querySelectorAll('form[data-pb-form]'), initForm);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
