# Gallery regression checks

Serve `public/` over HTTP (`npm run dev`) and test in a browser. This repo has no build step or automated test suite. The dev command uses npx serve and may download it on first use. Check both native JPEG XL support and the WebP fallback when testing delivery.

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

## SEO and current-design checks
- Verify the opening image is pulse/1-_MG_6955 without changing the loop order.
- Click an off-centre image: zoom must start from that exact thumbnail and return to it, with 300 ms ease-out transitions in both directions.
- Keep TikTok Sans at 12 px/300 with optical sizing auto, selectable title/bio and click-through corner padding.
- Check the initial HTML contains the approved bio and contact/social links. After JS initializes, count one bio link, three contacts and four socials, without duplicate text.
- Fetch both social-preview image URLs and check that they return an actual image. Check canonical, robots and sitemap use aintkaran.vercel.app. A valid sitemap is not proof of indexing.
- Keep titles/captions/credits hidden until reviewed. Do not invent alt text or credentials.

## Pipeline checks
The automated tests in the `originals` repo run before every sync: the generated manifest lists every project folder in `originals` with all its images, no placeholders; exports are sRGB with metadata stripped; missing outputs are regenerated. A photo that fails processing is skipped with a warning; other photos can still publish. Review warnings as well as the workflow result.

Physical Safari/trackpad verification is still required for hardware-specific input behavior; synthetic Chromium events do not prove that hardware path.
