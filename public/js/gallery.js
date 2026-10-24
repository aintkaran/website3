/*
 * Gallery engine.
 * - Config: public/config/site.json holds ALL site text and links.
 * - Content: public/assets/projects/manifest.json (GENERATED at build by
 *   scripts/build-manifest.mjs from the project folders). Adding a project =
 *   drop image exports in a folder; captions live in that folder's meta.json.
 *   No code changes.
 * - Layout: every figure gets an explicit pixel size up front, computed from
 *   the export's real aspect ratio and the viewport - the strip's geometry is
 *   stable from the first frame and does not shift as images load.
 * - Motion: wheel/trackpad scrolls horizontally with a light easing glide;
 *   mouse drag, touch swipe, arrow keys. Wheel input maps ~1:1 to travel
 *   (SCROLL_SPEED) and the strip stops exactly where the input stops - no
 *   snap-to-centre, so scrolling stays free-flowing. A touch drag anywhere
 *   on the page (a gentle swipe up works too) feeds the same destination and
 *   the same glide, so the phone feels exactly like the wheel on desktop.
 * - No snap: the strip rests wherever it is left. Arrow keys still glide to
 *   the next/previous image, and the strip starts on the first image, but
 *   wheel, drag and touch never pull back to a centre.
 * - Scale: the centred image is full size; every image away from centre sits
 *   at NEIGHBOUR scale, and scrolling scales the leaving image down and the
 *   arriving one up with scroll progress.
 * - Closed loop: the strip is three identical copies of the image set. Cross a
 *   copy boundary and the scroll position is re-normalized by exactly one copy
 *   width, which renders identical content - the last image rolls into the
 *   first in both directions, with neighbours always previewing either side.
 * - Caption: one static title + caption block centred directly underneath
 *   the focused image; it swaps text (and repositions) with no animation
 *   whenever the centred image changes.
 * - Click an image to zoom the full-size export.
 * - prefers-reduced-motion: immediate scrolling without easing.
 * - Alt text and editorial captions come from separate manifest fields.
 */
(function () {
'use strict';
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const vp = $('#viewport'), track = $('#track'), dlg = $('#zoom');
const base = s => 'assets/projects/' + encodeURIComponent(s) + '/web/';
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.textContent = h; return e; };
const NEIGHBOUR = 0.6; /* scale of every image away from centre */
const SCROLL_SPEED = 1.0; /* wheel delta multiplier: 1 = native travel per notch of the wheel */
const GLIDE = 0.16; /* easing step: fraction of the remaining distance per frame */
const FLING_MAX = 6; /* touch swipe: cap on the post-release float, in image slots */
const FLING_MS = 280; /* flick velocity (px/ms) times this = float distance in px */
const FLING_MIN_V = 0.25; /* px/ms; releases slower than this rest exactly where they end */
const CAPTION_OFFSET = 40; /* px between the bottom of the tallest image and its title */

/* The box an image of pixel size w x h renders in: centred image height vs
   the width cap that keeps both neighbours visible. Must echo the media
   query split in style.css. */
const fitBox = (w, h) => {
  const mobile = innerWidth <= 640;
  const maxH = mobile ? innerHeight * 0.40 : Math.min(innerHeight * 0.52, 540);
  const maxW = mobile ? innerWidth * 0.62 : Math.min(innerWidth * 0.52, 780);
  const s = Math.min(maxH / h, maxW / w);
  return [Math.round(w * s), Math.round(h * s)];
};
/* Vertical slot for the static title + caption: just below where the
   TALLEST image would end, so it never tracks the active image's height. */
const captionTop = () => {
  const maxH = innerWidth <= 640 ? innerHeight * 0.40 : Math.min(innerHeight * 0.52, 540);
  const floor = innerHeight - (innerWidth <= 640 ? 110 : 84);
  return Math.min(innerHeight / 2 + maxH / 2 + CAPTION_OFFSET, floor);
};

async function loadJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

async function init() {
  const [site, projects] = await Promise.all([
    loadJSON('config/site.json'),
    loadJSON('assets/projects/manifest.json')
  ]);

  /* ---- Site text and links ---- */
  /* Bio: plain text, except the optional site.bioLink span of text, which
     becomes a real link (currently Vitamin Studios). */
  const bio = $('#bio');
  if (site.bioLink && site.bio.includes(site.bioLink.text)) {
    const [pre, post] = site.bio.split(site.bioLink.text);
    const a = el('a', '', site.bioLink.text);
    a.href = site.bioLink.url;
    a.target = '_blank';
    a.rel = 'noopener';
    bio.append(pre, a, post || '');
  } else {
    bio.textContent = site.bio;
  }
  $('#copyright').textContent = site.copyright;
  $('#loc').textContent = site.location || '';
  (site.contact || []).forEach(function (c) {
    const a = el('a', '', c.label);
    a.href = c.url;
    $('#contact').append(a);
  });
  (site.social || []).forEach(function (s) {
    const a = el('a', '', s.label);
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'me noopener';
    $('#socials').append(a);
  });

  /* ---- Projects (from the generated manifest) ---- */
  const items = [];
  for (const m of projects) for (const i of m.images) items.push({ m, i });
  items.forEach((it, n) => {
    const { m, i } = it, b = base(m.slug) + encodeURIComponent(i.file), f = el('figure');
    /* Responsive widths this image actually has (from the manifest); older
       manifests without `sizes` had the full 600/1200/2400 set. */
    const ws = i.sizes && i.sizes.length ? i.sizes : [600, 1200, 2400];
    const pic = el('picture'), img = el('img');
    /* JPEG XL first where supported; WebP remains the native fallback. */
    const js = i.jxlSizes || (i.jxl ? ws : []);
    if (js.length) {
      const sj = el('source');
      sj.type = 'image/jxl';
      sj.srcset = js.map((w) => `${b}-${w}.jxl ${w}w`).join(', ');
      sj.sizes = fitBox(i.width, i.height)[0] + 'px';
      pic.append(sj);
    }
    const src = el('source');
    src.type = 'image/webp';
    src.srcset = ws.map((w) => `${b}-${w}.webp ${w}w`).join(', ');
    src.sizes = fitBox(i.width, i.height)[0] + 'px';
    /* <img> fallback (browsers that do neither JXL nor WebP-in-<picture>):
       a hand-made 1200 JPG when one exists, otherwise the WebP nearest 1200. */
    img.src = i.jpg ? `${b}-1200.jpg` : `${b}-${ws.includes(1200) ? 1200 : ws[ws.length - 1]}.webp`;
    img.alt = i.alt || '';
    img.width = i.width;
    img.height = i.height;
    img.loading = 'lazy';
    if (n === 0) img.fetchPriority = 'high';
    img.decoding = 'async';
    img.draggable = false;
    img.dataset.full = `${b}-${ws[ws.length - 1]}.webp`;
    if (js.length) img.dataset.fullJxl = `${b}-${js[js.length - 1]}.jxl`;
    pic.append(src, img);
    f.append(pic);
    it.fig = f;
    it.size = () => fitBox(i.width, i.height);
  });

  /* Explicit geometry before the figures enter the DOM: no layout shift as
     images load, and the loop's copy width never changes under the scroll
     position. */
  const restyle = () => items.forEach(it => {
    const [w, h] = it.size();
    it.fig.style.width = w + 'px';
    const im = it.fig.querySelector('img');
    im.style.width = w + 'px';
    im.style.height = h + 'px';
  });
  restyle();

  /* Three seamless copies - [clone][real][clone] - so the closed loop can
     re-normalize the scroll position across a copy boundary invisibly. */
  const real = items.map(x => x.fig);
  /* Only the initial image is eager. Native lazy loading warms nearby
     figures, and repeated loop copies share the browser's image cache. */
  const clone = f => {
    const c = f.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    c.querySelector('img').fetchPriority = 'auto';
    return c;
  };
  const figs = [];
  real.forEach(f => { const c = clone(f); track.append(c); figs.push(c); });
  real.forEach(f => { track.append(f); figs.push(f); });
  real.forEach(f => { const c = clone(f); track.append(c); figs.push(c); });

  if (!items.length) { $('#caption').textContent = 'No images yet'; return; }
  real[0].querySelector('img').loading = 'eager';
  const resizeFigures = () => {
    figs.forEach((f, k) => {
      const [w, h] = items[k % items.length].size();
      f.style.width = w + 'px';
      const img = f.querySelector('img');
      img.style.width = w + 'px';
      img.style.height = h + 'px';
      f.querySelectorAll('source').forEach(s => { s.sizes = w + 'px'; });
    });
  };
  wire(items, figs, resizeFigures);
}

function wire(items, figs, restyle) {
  const N = items.length;
  const max = () => vp.scrollWidth - vp.clientWidth;
  const clamp = v => Math.max(0, Math.min(max(), v));
  const centreOf = f => f.offsetLeft + f.offsetWidth / 2 - vp.clientWidth / 2;
  /* One copy's width: positions exactly this far apart render identical
     content, so the loop can jump by it without any visible change. */
  let copyWidth = 0;
  const loopW = () => copyWidth;
  let target = 0, raf = 0, down = null, moved = 0, cur = 0, suppressClick = false;
  let cs = [], shown = -1, settling = false;
  const measure = () => {
    cs = figs.map(f => f.offsetLeft + f.offsetWidth / 2);
    copyWidth = figs[N].offsetLeft - figs[0].offsetLeft;
  };
  measure();

  /* One animation owner. No watchdog timers survive a resize or drag.
     Time-based easing has the same feel on 60Hz and 120Hz displays. */
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  const kick = () => {
    if (reduce) { vp.scrollLeft = target; return; }
    if (raf) return;
    let last = 0;
    const step = now => {
      const dt = last ? Math.min(now - last, 64) : 1000 / 60;
      last = now;
      const d = target - vp.scrollLeft;
      if (Math.abs(d) < 0.5) { vp.scrollLeft = target; raf = 0; return; }
      const before = vp.scrollLeft;
      vp.scrollLeft += d * (1 - Math.pow(1 - GLIDE, dt / (1000 / 60)));
      // Some engines round scrollLeft: do not spin forever below one pixel.
      if (vp.scrollLeft === before) vp.scrollLeft = target;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };

  /* Keep the scroll position inside the middle copy's band. Content one copy
     width away is identical, so the jump itself is invisible. */
  const keepLoop = () => {
    const W = loopW();
    if (W <= 0) return;
    const s = vp.scrollLeft;
    let d = 0;
    if (s < W) d = W; else if (s >= 2 * W) d = -W;
    if (d) {
      vp.scrollLeft = s + d;
      target += d;
      if (down) { down.s += d; down.t0 += d; }
    }
  };

  /* Scale every image by its distance from the viewport centre in slot
     units: 1.0 at the centre, NEIGHBOUR one slot away, smoothly interpolated
     with scroll progress, so the leaving image shrinks while the arriving
     one grows. */
  const applyScale = () => {
    if (cs.length !== figs.length) measure();
    const c = vp.scrollLeft + vp.clientWidth / 2;
    for (let k = 0; k < figs.length; k++) {
      const fc = cs[k];
      const pitch = fc >= c
        ? (k > 0 ? fc - cs[k - 1] : cs[k + 1] - fc)
        : (k < figs.length - 1 ? cs[k + 1] - fc : fc - cs[k - 1]);
      const t = pitch > 0 ? Math.min(1, Math.abs(fc - c) / pitch) : 1;
      /* Shrink toward the edge nearest the centre image: a scaled-down
         neighbour keeps the same slice visible next to the centre image
         instead of pulling away from it, so the side previews survive on
         narrow screens too. The origin flips at the centre, where the
         scale is 1, so the flip itself is invisible. */
      figs[k].style.transformOrigin = fc >= c ? '0% 50%' : '100% 50%';
      figs[k].style.transform = 'scale(' + (1 - (1 - NEIGHBOUR) * t).toFixed(4) + ')';
    }
  };

  /* Nearest figure index to an absolute scroll-coordinate centre. */
  const nearestAt = c => {
    let b = 0, bd = Infinity;
    for (let i = 0; i < figs.length; i++) {
      const d = Math.abs(cs[i] - c);
      if (d < bd) { bd = d; b = i; }
    }
    return b;
  };
  const nearest = bias => nearestAt(vp.scrollLeft + vp.clientWidth / 2 + (bias || 0));
  /* Arrow keys still travel image to image. */
  const goto = i => {
    cur = Math.max(0, Math.min(figs.length - 1, i));
    target = clamp(centreOf(figs[cur]));
    kick();
  };

  /* One static title + caption block, centred under the gallery at a fixed
     vertical position. Text swaps instantly; the block itself never moves. */
  const placeCaption = () => { $('#nowshowing').style.top = captionTop() + 'px'; };
  placeCaption();
  addEventListener('resize', placeCaption);
  const show = r => {
    if (r === shown) return;
    shown = r;
    const { i } = items[r];
    $('#title').textContent = i.title || '';
    const cap = $('#caption');
    cap.textContent = i.caption || '';
    if (i.credit) cap.append(el('span', 'credit', ' ' + i.credit));
  };

  /* Wheel / trackpad anywhere on the page drives the strip (not just while
     hovering it). The zoom dialog keeps its own behaviour. Input goes
     straight into the destination; the light glide follows it and stops
     there. Nothing pulls the strip toward an image afterwards. */
  addEventListener('wheel', e => {
    if (dlg.open || e.ctrlKey) return; /* ctrl+wheel = browser zoom */
    endDrag(); /* Trackpad input must never inherit a stale pointer hold. */
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (!d) return;
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? vp.clientWidth : 1;
    target = clamp((raf ? target : vp.scrollLeft) + d * unit * SCROLL_SPEED);
    kick();
  }, { passive: false });

  vp.addEventListener('scroll', () => {
    if (settling) { applyScale(); return; }
    keepLoop();
    if (!raf) target = vp.scrollLeft;
    const n = nearest(0);
    cur = n;
    show(n % N);
    applyScale();
  }, { passive: true });

  /* Resize: everything happens synchronously in the resize event, so the
     browser never paints a half-updated frame. Stop any glide, remember the
     relative position through the strip, resize every figure, re-measure,
     and restore that same relative position in the same step (no easing, no
     re-centring - the free scroll position survives the resize). The scroll
     event browsers fire for the layout change is ignored via `settling`. */
  addEventListener('resize', () => {
    const M = max();
    const ratio = M > 0 ? vp.scrollLeft / M : 0;
    settling = true;
    stop();
    restyle();
    measure();
    vp.scrollLeft = target = clamp(ratio * max());
    cur = nearest(0);
    shown = -1; /* force the caption block to reposition at the new size */
    show(cur % N);
    applyScale();
    requestAnimationFrame(() => requestAnimationFrame(() => { settling = false; }));
  });

  /* Mouse drag on the strip: direct 1:1 manipulation. The strip stays
     exactly where it is released. */
  vp.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch' || !e.isPrimary || e.button !== 0) return;
    stop();
    target = vp.scrollLeft;
    down = { x: e.clientX, y: e.clientY, s: vp.scrollLeft, t0: vp.scrollLeft, id: e.pointerId };
    moved = 0;
    suppressClick = false;
  });

  /* Touch: a HORIZONTAL drag anywhere on the page drives the strip, like
     the wheel. Vertical swipes stay native - body is touch-action: pan-y,
     so pull-to-refresh and rubber-banding keep working - and the script
     never moves the strip for them. On release a fast flick keeps
     floating with velocity momentum (capped at FLING_MAX slots), eased
     out by the same GLIDE as the wheel; a slow swipe simply rests where
     it ends. No snap: the strip never pulls toward an image. */
  document.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch' || !e.isPrimary || dlg.open) return;
    stop();
    target = vp.scrollLeft;
    down = { x: e.clientX, y: e.clientY, s: vp.scrollLeft, t0: vp.scrollLeft, id: e.pointerId, touch: true };
    moved = 0;
    suppressClick = false;
    vp.dataset.touched = '1';
  }, { passive: true });

  /* Native touch events mirror the pointer path above: every iOS version
     fires them, even where pointer events misbehave. When both fire (modern
     iOS: pointerdown then touchstart) the touch path takes over (its anchor
     replaces the pointer one) and the pointermove handler then ignores the
     gesture (id mismatch) - both compute the same destination anyway.
     preventDefault on the move (horizontal gestures only; vertical stays
     native for pull-to-refresh) stops old Safari, which has no touch-action
     support, from hijacking a horizontal drag. Two-finger gestures (pinch)
     are left to the browser. */
  document.addEventListener('touchstart', e => {
    if (dlg.open || e.touches.length !== 1) return;
    const t = e.touches[0];
    stop();
    target = vp.scrollLeft;
    down = { x: t.clientX, y: t.clientY, s: vp.scrollLeft, t0: vp.scrollLeft, id: 'touch', touch: true };
    moved = 0;
    suppressClick = false;
    vp.dataset.touched = '1';
  }, { passive: true });
  /* Recent drag samples, for flick velocity at release. */
  const sample = dx => {
    if (!down) return;
    (down.sp = down.sp || []).push([performance.now(), dx]);
    if (down.sp.length > 5) down.sp.shift();
  };
  document.addEventListener('touchmove', e => {
    if (!down || down.id !== 'touch') return;
    if (e.touches.length !== 1) { endDrag(); return; }
    const t = e.touches[0];
    const dx = t.clientX - down.x, dy = t.clientY - down.y;
    moved = Math.max(moved, Math.abs(dx), Math.abs(dy));
    /* Axis ownership, decided once past the tap slop: vertical stays
       native (pull-to-refresh); only horizontal drives the strip. */
    if (!down.axis) {
      if (moved <= 8) return;
      down.axis = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
      if (down.axis === 'v') { endDrag(); return; }
    }
    if (down.axis !== 'h') return;
    e.preventDefault();
    sample(dx);
    vp.classList.add('drag');
    target = clamp(down.t0 - dx);
    kick();
  }, { passive: false });
  /* Lazy wrappers: endDrag is declared further below (const, TDZ). */
  document.addEventListener('touchend', () => endDrag());
  document.addEventListener('touchcancel', () => endDrag());
  document.addEventListener('pointermove', e => {
    if (!down || !down.touch || e.pointerId !== down.id) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    moved = Math.max(moved, Math.abs(dx), Math.abs(dy));
    if (!down.axis) {
      if (moved <= 8) return;
      down.axis = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
      if (down.axis === 'v') { endDrag(); return; }
    }
    if (down.axis !== 'h') return;
    sample(dx);
    vp.classList.add('drag');
    target = clamp(down.t0 - dx);
    kick();
  }, { passive: true });
  /* A drag that ends over a link must not activate it. */
  document.addEventListener('click', e => {
    if (!suppressClick) return;
    suppressClick = false;
    e.preventDefault();
    e.stopPropagation();
  }, true);
  vp.addEventListener('pointermove', e => {
    if (!down || down.touch || e.pointerId !== down.id) return;
    if (e.pointerType === 'mouse' && !(e.buttons & 1)) { endDrag(); return; }
    moved = Math.abs(e.clientX - down.x);
    if (moved > 4) {
      /* Capture only once it is a real drag, so a plain click still reaches
         the img (click-to-zoom). */
      if (!down.captured) { try { vp.setPointerCapture(down.id); down.captured = true; } catch (_) {} }
      vp.classList.add('drag');
      target = clamp(down.s - (e.clientX - down.x));
      vp.scrollLeft = target;
    }
  });
  const endDrag = () => {
    if (!down) return;
    const id = down.id, wasTouch = !!down.touch, axis = down.axis, sp = down.sp;
    down = null;
    if (moved > 4) suppressClick = true;
    if (id !== 'touch' && vp.hasPointerCapture(id)) vp.releasePointerCapture(id);
    vp.classList.remove('drag');
    /* Touch fling, horizontal gestures only, purely velocity-based: a
       fast flick keeps floating after the finger lifts (a couple of image
       slots for a good flick, capped at FLING_MAX), a slow or held release
       rests exactly where it ends - small swipes stay precise and no image
       becomes unreachable. The usual GLIDE easing takes the strip there;
       it never snaps to an image. Mouse drags and vertical touches (native
       scroll/refresh) are exempt. */
    if (wasTouch && axis === 'h') {
      let v = 0;
      if (sp && sp.length > 1) {
        const a = sp[0], b = sp[sp.length - 1];
        if (b[0] > a[0] && performance.now() - b[0] < 90) v = (b[1] - a[1]) / (b[0] - a[0]);
      }
      if (Math.abs(v) >= FLING_MIN_V) {
        const slot = loopW() / N;
        const extra = Math.min(Math.abs(v) * FLING_MS, FLING_MAX * slot);
        /* the strip travels opposite the finger, same as during the drag */
        target = clamp(target - Math.sign(v) * extra);
        kick();
      }
    }
  };
  vp.addEventListener('pointerup', endDrag);
  vp.addEventListener('pointercancel', endDrag);
  addEventListener('pointercancel', endDrag);
  vp.addEventListener('lostpointercapture', endDrag);
  addEventListener('pointerup', endDrag);
  addEventListener('blur', endDrag);
  document.addEventListener('visibilitychange', () => { if (document.hidden) endDrag(); });
  vp.addEventListener('pointerleave', () => { if (down && !down.captured) endDrag(); });

  addEventListener('keydown', e => {
    if (dlg.open || e.altKey || e.ctrlKey || e.metaKey || e.target.closest('input, textarea, select, [contenteditable]')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); goto(cur + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goto(cur - 1); }
  });

  // Safari's native image drag must not take over the gallery pointer.
  track.addEventListener('dragstart', e => e.preventDefault());

  /* Click an image to zoom the full-size export */
  track.addEventListener('click', e => {
    if (moved > 4 || e.target.tagName !== 'IMG') return;
    stop();
    target = vp.scrollLeft;
    const zoomSource = $('#zoomsource');
    zoomSource.srcset = e.target.dataset.fullJxl || '';
    $('#zoomimg').src = e.target.dataset.full;
    $('#zoomimg').alt = e.target.alt;
    dlg.showModal();
  });
  dlg.addEventListener('click', () => dlg.close());
  dlg.addEventListener('close', () => {
    $('#zoomsource').removeAttribute('srcset');
    $('#zoomimg').removeAttribute('src');
  });

  /* Start with the first image centred. Geometry is explicit, so this is
     exact from the first frame. */
  const centreFirst = () => {
    if (figs.length && !vp.dataset.touched) {
      vp.scrollLeft = target = clamp(centreOf(figs[N]));
      applyScale();
    }
  };
  requestAnimationFrame(centreFirst);
  vp.addEventListener('pointerdown', () => { vp.dataset.touched = '1'; }, { once: true });
  addEventListener('wheel', () => { vp.dataset.touched = '1'; }, { once: true, passive: true });

  vp.dispatchEvent(new Event('scroll'));
}

init().catch(err => {
  const c = $('#caption');
  if (c) c.textContent = 'gallery failed to load';
  console.error(err);
});
})();
