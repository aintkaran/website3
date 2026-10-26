# aintkaran portfolio

The live photography portfolio at https://aintkaran.vercel.app/.

## Two-repository setup

- `aintkaran/originals` holds source photos, human-written metadata and the image-sync workflow.
- `aintkaran/website3` (this repo) holds the static front end and generated public exports.
- The Vercel project is named `website`, but its connected source is `aintkaran/website3`, branch `main`. Vercel serves `public/` without a build or image-processing step.
- `website3` is the production repository name, not a trial deployment. The legacy `aintkaran/website` repo is not this pipeline's source.

## Editing guide

| Change | Location |
| --- | --- |
| Add, replace, remove or order photos | Project folders and `meta.json` in `originals` |
| Bio, contact and social links | `public/config/site.json`, plus matching initial HTML in `public/index.html` |
| Gallery behavior and zoom | `public/js/gallery.js` |
| Layout, colors and type | `public/css/` |
| Search and social metadata | `public/index.html`, `public/robots.txt`, `public/sitemap.xml` |
| Hosting headers and redirects | `vercel.json` |

The sync generates the project exports, project `meta.json` files, `manifest.json` and `.sync/state.json`. Do not hand-edit generated content. See `public/assets/projects/README.md` and the `originals` README.

## Front end

A horizontal looping gallery, with mouse/trackpad, touch and keyboard controls. The opening photo is `pulse/1-_MG_6955`; image order is otherwise driven by the manifest. Clicking a photo opens it from the clicked thumbnail and closes back to that thumbnail, with 300 ms ease-out zoom transitions and a reduced-motion alternative. Mobile vertical gestures remain native.

Type is TikTok Sans, 12 px, weight 300, with automatic optical sizing. Flexoki light/dark colors follow the system. Titles, captions and credits remain hidden while editorial copy is unfinished. EXIF is a separate visually hidden field, not a caption.

JPEG XL sources have WebP fallbacks. The pipeline exports widths up to 600/1200/2400 without upscaling, at quality 90. It skips HEIC/HEIF; convert those before upload. Current gallery inventory is derived from the manifest, not maintained here as a fixed count.

## Search, sharing and measurement

The initial HTML contains the existing bio, contact and social links. JavaScript refreshes those from `site.json` without duplication; keep both versions in sync when editing. The gallery itself still depends on JavaScript.

Canonical URL, social metadata, ProfilePage/Person JSON-LD, robots and sitemap use the main address. Social preview tags currently use the opening Pulse photo; update both tags if that asset is deleted. The sitemap currently lists only the homepage. Linked project pages and reviewed photo descriptions remain future editorial work. Search Console verification is not established by these files alone, and indexing is not guaranteed.

Vercel Analytics and Speed Insights scripts are included. No Meta Pixel, GA4 or tag manager has been added. Check the Vercel dashboards for current collection/settings rather than inferring them from a script tag.

## Local checks and deployment

Run `npm run dev` to serve `public/` locally through `npx serve` (Node 18+; the first run may download serve). There is no site build step or automated test suite here. Follow `tests/README.md` for regression checks. Pipeline tests live in `originals`.

Commits to `main` trigger Vercel. Confirm both the deployment's Ready/Production state and the live main URL; a successful source commit alone is not a deployment check. The old `website3-aintkaran.vercel.app` host redirects to the main address.
