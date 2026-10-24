# Gallery regression checks

Run `npm ci && npm run build` and serve `public/` over HTTP. The browser has
no third-party JavaScript dependencies. Check both native JPEG XL support
and the WebP fallback when testing delivery.

- Scroll vertically with a wheel/trackpad from anywhere on the page. The
  gallery must stay free-flowing without snapping to an image afterwards.
- Start a mouse drag, release outside the gallery, then hover and scroll.
  The image must not follow an unpressed mouse. Repeat after switching tabs
  or windows during a drag. Wheel input must cancel any stale pointer hold.
- Drag while the wheel glide is still running. Only the current drag should
  own movement. Releasing the mouse must stop dragging.
- Use left/right arrows repeatedly through both loop seams. Resize between
  desktop and narrow widths, then repeat. All three copies must have equal
  geometry after each resize and all 13 photos must remain accessible.
- Turn on reduced motion before loading. Arrows and vertical wheel input
  must still move the gallery, immediately and without easing.
- Open an image, close with Escape or click, and reopen. A JXL-capable
  browser should request JXL in the enlarged view too. Other browsers must
  load the WebP fallback. Scrolling must resume after close.
- Inspect dark/light themes and narrow/desktop sizes. Preserve corner text,
  wide gaps, image scaling, caption placement and the existing footer.
- In Network, check actual responsive widths against rendered image width
  and display pixel density. Only the initial real image is eager; loop
  copies should share cached image responses.

Build checks: generated manifest must contain Monroe (8), test (3), and
`test2` (2), no placeholders; preserve original PNGs and metadata. Existing
exports are never overwritten. Missing JXL generation now fails the build
rather than silently deploying WebP only. `npm audit` should be clean.

Physical Safari/trackpad verification is still required for hardware-specific
input behavior; synthetic Chromium events do not prove that hardware path.
