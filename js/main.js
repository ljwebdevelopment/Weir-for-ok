/**
 * ================================================================
 *  Christopher Wier for Oklahoma House District 4
 *  Campaign Website — main.js
 * ================================================================
 *
 *  ARCHITECTURE OVERVIEW
 *  ---------------------
 *  All three campaign forms (Volunteer, Contact, Newsletter) route
 *  through a single shared utility layer:
 *
 *    submitToSheet(payload)     — sends data to Google Apps Script
 *    validateForm(form)         — highlights required fields
 *    setSubmitState(btn, bool)  — loading / idle toggle
 *    showFeedback(ok, err, typ) — success / error message toggle
 *    registerForm(config)       — wires up any form with one call
 *
 *  To connect a new form in the future:
 *    1. Add the <form> to index.html with the standard markup.
 *    2. Call registerForm({ ... }) at the bottom of this file.
 *    3. No other changes needed.
 *
 *  WHERE THE ENDPOINT IS CONFIGURED
 *  ----------------------------------
 *  Line 40 below — SCRIPT_URL.
 *  After deploying the Google Apps Script Web App, paste the URL there.
 *  The script file is: google-apps-script.js
 *
 *  SECRETS
 *  -------
 *  The Apps Script Web App URL is a public endpoint (no credentials
 *  embedded). The Sheet ID lives only inside the Apps Script, not here.
 *
 *  GOOGLE SHEET
 *  ------------
 *  Sheet ID  : 1AX3oePb47PTTJhsb0GTEOsPcU46dhdQ15fAnlWGeZmk
 *  Tab name  : wier
 *  Columns   : Timestamp | Form Type | Name | Email | Phone |
 *              City | How They Want To Help | Message | Source Page
 * ================================================================
 */

'use strict';

/* ================================================================
   ENDPOINT CONFIGURATION
   ================================================================
   Paste your Google Apps Script Web App URL here.
   How to get it: follow the steps in google-apps-script.js, then
   Deploy → New Deployment → Web App → copy the URL.
================================================================ */
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwlANadMTv-zAS_WsyyUhtPdDYlLhKojs1-iOGA9CkEMYpvR2auoDTF0kosJSN6Y6sh/exec';

/* ================================================================
   FORM SERVICE  (shared utilities used by every form)
================================================================ */

/**
 * POST a payload to the Google Apps Script Web App.
 *
 * Uses Content-Type: text/plain to avoid a CORS preflight request
 * (Apps Script does not respond to OPTIONS). With mode: 'no-cors'
 * the response is opaque — we cannot read it — but the data is
 * written to the sheet if the script received the request.
 *
 * @param {Object} payload  - Data to send (see column mapping above)
 * @throws {Error}          - On network failure or missing URL
 */
async function submitToSheet(payload) {
  if (!SCRIPT_URL) {
    throw new Error('SCRIPT_URL is not configured in main.js');
  }

  await fetch(SCRIPT_URL, {
    method:  'POST',
    mode:    'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body:    JSON.stringify(payload),
  });
  // no-cors → response is opaque; absence of a thrown error = success
}

/**
 * Validate all [required] fields in a form.
 * Adds/removes the 'invalid' CSS class on each field.
 *
 * @param  {HTMLFormElement} form
 * @returns {boolean} true if all required fields pass
 */
function validateForm(form) {
  let valid = true;

  form.querySelectorAll('[required]').forEach(field => {
    const val = field.value.trim();
    let ok = val.length > 0;

    if (field.type === 'email' && ok) {
      ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    }
    if (field.tagName === 'SELECT' && ok) {
      ok = val !== '';
    }

    field.classList.toggle('invalid', !ok);
    if (!ok) valid = false;
  });

  return valid;
}

/**
 * Toggle a submit button between idle and loading states.
 *
 * @param {HTMLButtonElement} btn
 * @param {boolean}           loading
 */
function setSubmitState(btn, loading) {
  btn.disabled = loading;
  const label   = btn.querySelector('.btn-label');
  const spinner = btn.querySelector('.btn-spinner');
  if (label)   label.hidden   = loading;
  if (spinner) spinner.hidden = !loading;
}

/**
 * Show the success or error feedback element, hide the other.
 *
 * @param {HTMLElement} successEl
 * @param {HTMLElement} errorEl
 * @param {'success'|'error'} type
 */
function showFeedback(successEl, errorEl, type) {
  if (successEl) successEl.hidden = (type !== 'success');
  if (errorEl)   errorEl.hidden   = (type !== 'error');
  const target = type === 'success' ? successEl : errorEl;
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Build the standard payload object sent to the sheet.
 * All fields are optional except timestamp, formType, and sourcePage
 * which are populated automatically.
 *
 * @param {string}  formType  - e.g. 'Volunteer', 'Contact', 'Newsletter'
 * @param {Object}  fields    - Key/value pairs from the form
 * @returns {Object}
 */
function buildPayload(formType, fields) {
  return {
    timestamp:  new Date().toISOString(),   // auto
    formType,                               // auto
    name:       fields.name    || '',
    email:      fields.email   || '',
    phone:      fields.phone   || '',
    city:       fields.city    || '',
    howHelp:    fields.howHelp || '',
    message:    fields.message || '',
    sourcePage: window.location.href,       // auto
  };
}

/**
 * Wire up a campaign form with one call.
 * This is the single entry point for adding any new form.
 *
 * @param {Object} config
 * @param {string}   config.formId        - id of the <form> element
 * @param {string}   config.submitId      - id of the submit <button>
 * @param {string}   config.successId     - id of the success feedback element
 * @param {string}   config.errorId       - id of the error feedback element
 * @param {string}   config.formType      - value written to "Form Type" column
 * @param {Function} config.getFields     - (form) => { name, email, ... }
 */
function registerForm({ formId, submitId, successId, errorId, formType, getFields }) {
  const form    = document.getElementById(formId);
  const btn     = document.getElementById(submitId);
  const success = document.getElementById(successId);
  const error   = document.getElementById(errorId);

  if (!form || !btn) return; // element not on this page — silently skip

  let busy = false; // prevents duplicate submissions on double-click

  // Clear invalid state when user starts correcting a field
  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input',  () => field.classList.remove('invalid'));
    field.addEventListener('change', () => field.classList.remove('invalid'));
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (busy) return; // guard against double-click

    // Reset any previous feedback
    if (success) success.hidden = true;
    if (error)   error.hidden   = true;
    form.querySelectorAll('.invalid').forEach(f => f.classList.remove('invalid'));

    // Client-side validation
    if (!validateForm(form)) {
      const first = form.querySelector('.invalid');
      if (first) first.focus();
      return;
    }

    // Lock form while submitting
    busy = true;
    setSubmitState(btn, true);

    try {
      const payload = buildPayload(formType, getFields(form));
      await submitToSheet(payload);

      setSubmitState(btn, false);
      showFeedback(success, error, 'success');
      form.reset();
      // keep busy=true after success — prevents re-submission of same data
    } catch (err) {
      console.error(`[${formType} form] Submission error:`, err);
      setSubmitState(btn, false);
      showFeedback(success, error, 'error');
      busy = false; // allow retry on network error
    }
  });
}

/* ================================================================
   FORM REGISTRATIONS
   ================================================================
   Add one registerForm() call per form. That's the only change
   needed when a new campaign form is added to the HTML.
================================================================ */

// --- Volunteer / Join the Team ---
registerForm({
  formId:    'volunteer-form',
  submitId:  'v-submit',
  successId: 'v-success',
  errorId:   'v-error',
  formType:  'Volunteer',
  getFields: form => ({
    name:    form.querySelector('[name="name"]')?.value.trim(),
    email:   form.querySelector('[name="email"]')?.value.trim(),
    phone:   form.querySelector('[name="phone"]')?.value.trim(),
    city:    form.querySelector('[name="city"]')?.value.trim(),
    howHelp: form.querySelector('[name="howHelp"]')?.value,
    message: form.querySelector('[name="message"]')?.value.trim(),
  }),
});

// --- Contact ---
registerForm({
  formId:    'contact-form',
  submitId:  'c-submit',
  successId: 'c-success',
  errorId:   'c-error',
  formType:  'Contact',
  getFields: form => ({
    name:    form.querySelector('[name="name"]')?.value.trim(),
    email:   form.querySelector('[name="email"]')?.value.trim(),
    phone:   form.querySelector('[name="phone"]')?.value.trim(),
    message: form.querySelector('[name="message"]')?.value.trim(),
  }),
});

// --- Newsletter Signup ---
registerForm({
  formId:    'newsletter-form',
  submitId:  'nl-submit',
  successId: 'nl-success',
  errorId:   'nl-error',
  formType:  'Newsletter',
  getFields: form => ({
    name:  form.querySelector('[name="name"]')?.value.trim(),
    email: form.querySelector('[name="email"]')?.value.trim(),
  }),
});

/* ================================================================
   NAVIGATION
================================================================ */
const header    = document.getElementById('site-header');
const hamburger = document.getElementById('hamburger');
const navMenu   = document.getElementById('nav-menu');

function setHeaderState() {
  const scrolled = window.scrollY > 60;
  header.classList.toggle('is-scrolled',     scrolled);
  header.classList.toggle('is-transparent', !scrolled);
}

setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });

hamburger.addEventListener('click', () => {
  const open = hamburger.getAttribute('aria-expanded') !== 'true';
  hamburger.setAttribute('aria-expanded', String(open));
  navMenu.classList.toggle('is-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

navMenu.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', closeMenu);
});

document.addEventListener('click', e => {
  if (navMenu.classList.contains('is-open') && !header.contains(e.target)) {
    closeMenu();
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
    closeMenu();
    hamburger.focus();
  }
});

function closeMenu() {
  hamburger.setAttribute('aria-expanded', 'false');
  navMenu.classList.remove('is-open');
  document.body.style.overflow = '';
}

/* ================================================================
   SMOOTH SCROLL  (offset accounts for fixed nav height)
================================================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const id = this.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const navH = header.getBoundingClientRect().height;
    const top  = target.getBoundingClientRect().top + window.scrollY - navH;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ================================================================
   SCROLL-REVEAL  (IntersectionObserver, graceful fallback)
================================================================ */
(function initReveal() {
  const targets = document.querySelectorAll(
    '.issue-card, .plan-text-col, .about-text-col, .donate-text, .newsletter-text'
  );
  targets.forEach(el => el.classList.add('reveal'));

  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(el => observer.observe(el));
})();
