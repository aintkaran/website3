# Site text and links

`site.json` supplies the bio and its linked phrase, copyright, location, contact links and social links in display order. The runtime reads it when initializing the gallery.

The same approved bio/contact/social content is also present in `public/index.html` so it is available before JavaScript. When changing those fields, update that initial HTML too. The gallery replaces the initial text/links rather than appending duplicates.

Search titles, descriptions, canonical/social metadata and JSON-LD live in `public/index.html`, not in this config. Do not add placeholder captions or new claims as a technical SEO change.

Commit to `main`, then verify Vercel's production deployment and https://aintkaran.vercel.app/. Check desktop and mobile, bio line breaks, the non-breaking Vitamin Studios link, and footer link order.
