# Gallery regression checks

Serve `public/` over HTTP (`npm run dev`) and test in a browser. This repo has no build step and no dependencies to install. Check both native JPEG XL support and the WebP fallback when testing delivery.

## Checklist
- Scroll vertically with a wheel/trackpad from anywhere on the page. The gallery must stay free-flowing without snapping to an image afterwards.
- Start a mouse drag, release outside the gallery, then hover and scroll. The image must not follow an unpressed mouse. Repeat after switching tabs or windows during a drag. Wheel input must cancel any stale pointer hold.
- Drag while the wheel glide is still running. Only the current drag should own movement. Releasing the mouse must stop dragging.
- On a touch screen, horizontal drags move the strip (no snapping); vertical swipes keep their native behaviour (rubber-banding, pull-to-refresh).
- Use left/right arrows repeatedly through both loop seams. Resize between desktop and narrow widths, then repeat. All three copies must have equal geometry after each resize and every photo must remain accessible.
- Turn on reduced motion before loading. Arrows and vertical wheel input must still move the gallery, immediately and without easing.
- Open an image, close with Escape or click, and reopen. A JXL-capable browser should request JXL in the enlarged view too. Other browsers must load the WebP fallback. Scrolling must resume after close.
- Inspect dark/light themes and narrow/desktop sizes. Preserve corner text, wide gaps, image scaling, caption placement and the existing footer.
- In Network, check actual responsive widths against rendered image width and display pixel density. Only the initial real image is eager; loop copies should share cached image responses.

## Pipeline checks
The automated tests in the `originals` repo run before every sync: the generated manifest lists every project folder in `originals` with all its images, no placeholders; exports are sRGB with metadata stripped; a missing JPEG XL export fails the sync instead of silently shipping WebP only.

Physical Safari/trackpad verification is still required for hardware-specific input behavior; synthetic Chromium events do not prove that hardware path.
