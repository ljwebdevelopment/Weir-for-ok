'use strict';

/* ================================================================
   Gallery page — nav hamburger + lightbox
================================================================ */

// ---- Navigation hamburger (same pattern as main.js) ----
const header    = document.getElementById('site-header');
const hamburger = document.getElementById('hamburger');
const navMenu   = document.getElementById('nav-menu');

hamburger.addEventListener('click', () => {
  const open = hamburger.getAttribute('aria-expanded') !== 'true';
  hamburger.setAttribute('aria-expanded', String(open));
  navMenu.classList.toggle('is-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

navMenu.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.setAttribute('aria-expanded', 'false');
    navMenu.classList.remove('is-open');
    document.body.style.overflow = '';
  });
});

document.addEventListener('click', e => {
  if (navMenu.classList.contains('is-open') && !header.contains(e.target)) {
    hamburger.setAttribute('aria-expanded', 'false');
    navMenu.classList.remove('is-open');
    document.body.style.overflow = '';
  }
});

// ---- Lightbox ----
const allPhotos = Array.from(document.querySelectorAll('.photo-item img'));
let currentIndex = 0;

// Build lightbox DOM
const overlay = document.createElement('div');
overlay.className = 'lightbox-overlay';
overlay.setAttribute('role', 'dialog');
overlay.setAttribute('aria-modal', 'true');
overlay.setAttribute('aria-label', 'Photo viewer');
overlay.hidden = true;

overlay.innerHTML = `
  <div class="lightbox-img-wrap">
    <img src="" alt="" id="lightbox-img">
  </div>
  <button class="lightbox-close" aria-label="Close photo viewer">&#x2715;</button>
  <button class="lightbox-btn lightbox-prev" aria-label="Previous photo">&#x2039;</button>
  <button class="lightbox-btn lightbox-next" aria-label="Next photo">&#x203A;</button>
`;
document.body.appendChild(overlay);

const lbImg   = overlay.querySelector('#lightbox-img');
const lbClose = overlay.querySelector('.lightbox-close');
const lbPrev  = overlay.querySelector('.lightbox-prev');
const lbNext  = overlay.querySelector('.lightbox-next');

function openLightbox(index) {
  currentIndex = ((index % allPhotos.length) + allPhotos.length) % allPhotos.length;
  const img = allPhotos[currentIndex];
  lbImg.src = img.src;
  lbImg.alt = img.alt;
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  lbClose.focus();
}

function closeLightbox() {
  overlay.hidden = true;
  document.body.style.overflow = '';
  allPhotos[currentIndex].closest('.photo-item').focus();
}

function navigate(dir) {
  openLightbox(currentIndex + dir);
}

// Open on photo click
document.querySelectorAll('.photo-item').forEach((item, i) => {
  item.setAttribute('tabindex', '0');
  item.setAttribute('role', 'button');
  item.setAttribute('aria-label', `View photo: ${allPhotos[i].alt}`);
  item.addEventListener('click', () => openLightbox(i));
  item.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); }
  });
});

lbClose.addEventListener('click', closeLightbox);
lbPrev.addEventListener('click',  e => { e.stopPropagation(); navigate(-1); });
lbNext.addEventListener('click',  e => { e.stopPropagation(); navigate(1);  });

// Close on overlay background click (but not on the image itself)
overlay.addEventListener('click', e => {
  if (e.target === overlay || e.target.classList.contains('lightbox-img-wrap')) {
    closeLightbox();
  }
});

// Keyboard navigation
document.addEventListener('keydown', e => {
  if (overlay.hidden) return;
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowLeft')   navigate(-1);
  if (e.key === 'ArrowRight')  navigate(1);
});
