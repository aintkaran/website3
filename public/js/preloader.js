/*
 * Preloader: Scritto rolling-word entrance, revealed when the opening assets
 * are ready. Word sequence chosen by Karan over iMessage on 2026-10-27:
 * Design, Photography, Product, aintkaran.
 *
 * Scritto (@scritto/core v0.1.0, MIT, https://github.com/JaceThings/Scritto),
 * vendored at js/vendor/scritto.js so the site has no runtime CDN dependency.
 *
 * Gating: the words roll while the font and the opening photo load, and the
 * overlay reveals as soon as both are ready - the loader fills real wait
 * time, it never adds to it. When everything is cached the ready promise
 * settles almost immediately and the visitor is straight in (MIN_SHOW_MS
 * only prevents a sub-frame flash). MAX_WAIT_MS is the hard cap. Reduced
 * motion or an unsupported browser: no animation, straight in. The inline
 * failsafe in index.html hides the overlay if this module never runs.
 */
import './vendor/scritto.js';

const WORDS = ['Design', 'Photography', 'Product', 'aintkaran'];
const STEP_MS = 750;      // gap between rolls; Scritto's roll is 550ms
const MIN_SHOW_MS = 400;  // floor, so a cached load never flash-bangs
const MAX_WAIT_MS = 3200; // hard cap: the preloader can never outlast this

const el = document.getElementById('preloader');
const text = document.createElement('scritto-text');
if (el) {
  const fallback = el.querySelector('.pl-fallback');
  if (fallback) fallback.remove(); // static first word shown until JS runs
  el.append(text);
}

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const capable =
  'Intl' in window && 'Segmenter' in Intl &&
  typeof document.body.animate === 'function' &&
  CSS.supports('transition-timing-function: linear(0, 1)');

function reveal() {
  if (!el || el.dataset.done) return;
  el.dataset.done = '1';
  el.classList.add('done');
  el.addEventListener('transitionend', () => el.remove(), { once: true });
  setTimeout(() => el.remove(), 600); // if transitionend never fires
}

/* Ready = the variable font has settled AND the opening photo (the only
   eager image; gallery.js marks it fetchPriority=high) has finished. The
   remaining photos stay lazy - we never gate on the whole gallery. */
const fontReady = document.fonts ? document.fonts.ready : Promise.resolve();
const openingImageReady = new Promise((resolve) => {
  const done = () => { clearTimeout(timer); resolve(); };
  const timer = setTimeout(done, MAX_WAIT_MS); // a missing image must not hold us
  const watch = (img) => {
    if (img.complete && img.naturalWidth > 0) return done();
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  };
  /* gallery.js builds the track from the manifest after this module runs,
     so watch for the first image to appear rather than query once. */
  const first = document.querySelector('#track img');
  if (first) return watch(first);
  const track = document.getElementById('track');
  if (!track) return done();
  const mo = new MutationObserver(() => {
    const img = track.querySelector('img');
    if (img) { mo.disconnect(); watch(img); }
  });
  mo.observe(track, { childList: true, subtree: true });
});
const ready = Promise.all([fontReady, openingImageReady]);

if (!el || reduce || !capable) {
  reveal();
} else {
  const started = performance.now();
  text.value = WORDS[0]; // first word without motion
  const timers = [];
  let t = STEP_MS;
  for (let i = 1; i < WORDS.length; i++) {
    const w = WORDS[i];
    timers.push(setTimeout(() => text.update(w), t)); // rolls only what changes
    t += STEP_MS;
  }
  ready.then(() => {
    const wait = Math.max(0, MIN_SHOW_MS - (performance.now() - started));
    setTimeout(reveal, wait);
  });
  setTimeout(reveal, MAX_WAIT_MS); // belt and braces
}
