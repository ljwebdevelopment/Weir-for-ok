/**
 * Christopher Wier for Oklahoma House District 4
 * Campaign Website – main.js
 *
 * Handles:
 *  - Sticky / transparent navigation
 *  - Mobile hamburger menu
 *  - Form validation, submission, success/error states
 *  - Google Sheets integration via Google Apps Script Web App
 *  - Scroll-reveal animations
 */

'use strict';

/* ================================================================
   GOOGLE APPS SCRIPT  WEB APP URL
   ================================================================
   After you deploy your Google Apps Script as a Web App
   (see google-apps-script.js for full instructions),
   paste the deployment URL here.

   Example:
     const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycb.../exec';

   Until you paste the URL, forms will show a friendly error message
   and tell the user to email wiercampaign@gmail.com.
================================================================ */
const SCRIPT_URL = ''; // ← PASTE YOUR WEB APP URL HERE

/* ================================================================
   NAVIGATION
================================================================ */
const header   = document.getElementById('site-header');
const hamburger = document.getElementById('hamburger');
const navMenu  = document.getElementById('nav-menu');

function setHeaderState() {
  if (window.scrollY > 60) {
    header.classList.remove('is-transparent');
    header.classList.add('is-scrolled');
  } else {
    header.classList.remove('is-scrolled');
    header.classList.add('is-transparent');
  }
}

// Initialize immediately so there's no flash
setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });

// Hamburger toggle
hamburger.addEventListener('click', () => {
  const expanded = hamburger.getAttribute('aria-expanded') === 'true';
  hamburger.setAttribute('aria-expanded', String(!expanded));
  navMenu.classList.toggle('is-open', !expanded);
  document.body.style.overflow = !expanded ? 'hidden' : '';
});

// Close mobile menu when a link is clicked
navMenu.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', closeMenu);
});

// Close menu on outside click
document.addEventListener('click', e => {
  if (navMenu.classList.contains('is-open') && !header.contains(e.target)) {
    closeMenu();
  }
});

// Close menu on Escape key
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
   SCROLL-REVEAL  (light — uses IntersectionObserver)
================================================================ */
function initReveal() {
  const targets = document.querySelectorAll(
    '.issue-card, .plan-text-col, .about-text-col, .donate-text'
  );
  targets.forEach(el => el.classList.add('reveal'));

  if (!('IntersectionObserver' in window)) {
    // Fallback for very old browsers
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
}
initReveal();

/* ================================================================
   FORM UTILITIES
================================================================ */

/** Validate all required fields. Returns true if form is valid. */
function validateForm(form) {
  let valid = true;

  form.querySelectorAll('[required]').forEach(field => {
    const val = field.value.trim();
    let fieldValid = val.length > 0;

    if (field.type === 'email' && fieldValid) {
      fieldValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    }
    if (field.tagName === 'SELECT' && fieldValid) {
      fieldValid = val !== '';
    }

    field.classList.toggle('invalid', !fieldValid);
    if (!fieldValid) valid = false;
  });

  return valid;
}

/** Set a form's submit button into loading / idle state. */
function setSubmitState(btn, loading) {
  const label   = btn.querySelector('.btn-label');
  const spinner = btn.querySelector('.btn-spinner');
  btn.disabled  = loading;
  label.hidden  = loading;
  spinner.hidden = !loading;
}

/** Show a feedback element and hide the other. */
function showFeedback(successEl, errorEl, type) {
  successEl.hidden = (type !== 'success');
  errorEl.hidden   = (type !== 'error');
  const target = type === 'success' ? successEl : errorEl;
  target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Submit form data to Google Apps Script.
 * Uses Content-Type: text/plain to avoid preflight CORS issues.
 * The response is opaque (no-cors mode) but the data reaches the sheet.
 */
async function submitToSheet(payload) {
  if (!SCRIPT_URL) {
    // No URL configured yet — treat as an error so user knows
    throw new Error('Google Script URL not configured');
  }

  await fetch(SCRIPT_URL, {
    method:  'POST',
    mode:    'no-cors', // Required for Apps Script; response will be opaque
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body:    JSON.stringify(payload),
  });
  // With no-cors, we can't inspect the response.
  // If fetch() didn't throw, the request was dispatched successfully.
}

/* ================================================================
   FORM: VOLUNTEER
================================================================ */
(function setupVolunteerForm() {
  const form    = document.getElementById('volunteer-form');
  const btn     = document.getElementById('v-submit');
  const success = document.getElementById('v-success');
  const error   = document.getElementById('v-error');
  if (!form) return;

  let busy = false;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (busy) return;

    // Reset feedback
    success.hidden = true;
    error.hidden   = true;

    // Remove stale invalid states
    form.querySelectorAll('.invalid').forEach(f => f.classList.remove('invalid'));

    if (!validateForm(form)) {
      const firstInvalid = form.querySelector('.invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    busy = true;
    setSubmitState(btn, true);

    const payload = {
      timestamp:  new Date().toISOString(),
      formType:   'Volunteer',
      name:       form.querySelector('[name="name"]').value.trim(),
      email:      form.querySelector('[name="email"]').value.trim(),
      phone:      form.querySelector('[name="phone"]').value.trim(),
      city:       form.querySelector('[name="city"]').value.trim(),
      howHelp:    form.querySelector('[name="howHelp"]').value,
      message:    form.querySelector('[name="message"]').value.trim(),
      sourcePage: window.location.href,
    };

    try {
      await submitToSheet(payload);
      setSubmitState(btn, false);
      showFeedback(success, error, 'success');
      form.reset();
    } catch (err) {
      console.error('Volunteer form error:', err);
      setSubmitState(btn, false);
      showFeedback(success, error, 'error');
      busy = false;
    }
  });

  // Clear invalid state on user input
  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input', () => field.classList.remove('invalid'));
    field.addEventListener('change', () => field.classList.remove('invalid'));
  });
})();

/* ================================================================
   FORM: CONTACT
================================================================ */
(function setupContactForm() {
  const form    = document.getElementById('contact-form');
  const btn     = document.getElementById('c-submit');
  const success = document.getElementById('c-success');
  const error   = document.getElementById('c-error');
  if (!form) return;

  let busy = false;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (busy) return;

    success.hidden = true;
    error.hidden   = true;
    form.querySelectorAll('.invalid').forEach(f => f.classList.remove('invalid'));

    if (!validateForm(form)) {
      const firstInvalid = form.querySelector('.invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    busy = true;
    setSubmitState(btn, true);

    const payload = {
      timestamp:  new Date().toISOString(),
      formType:   'Contact',
      name:       form.querySelector('[name="name"]').value.trim(),
      email:      form.querySelector('[name="email"]').value.trim(),
      phone:      form.querySelector('[name="phone"]').value.trim(),
      city:       '',        // contact form doesn't have city field
      howHelp:    '',        // contact form doesn't have this field
      message:    form.querySelector('[name="message"]').value.trim(),
      sourcePage: window.location.href,
    };

    try {
      await submitToSheet(payload);
      setSubmitState(btn, false);
      showFeedback(success, error, 'success');
      form.reset();
    } catch (err) {
      console.error('Contact form error:', err);
      setSubmitState(btn, false);
      showFeedback(success, error, 'error');
      busy = false;
    }
  });

  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input',  () => field.classList.remove('invalid'));
    field.addEventListener('change', () => field.classList.remove('invalid'));
  });
})();

/* ================================================================
   SMOOTH SCROLL  (for browsers that don't support CSS scroll-behavior)
================================================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const id = this.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const headerH = header.getBoundingClientRect().height;
    const top = target.getBoundingClientRect().top + window.scrollY - headerH;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});
