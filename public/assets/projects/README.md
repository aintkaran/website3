# Generated project assets

The sync in `aintkaran/originals` generates project folders here. Add or replace photos and edit human metadata in that source repo, not in these generated files.

- `<project>/web/`: optimized WebP and JPEG XL exports.
- `<project>/meta.json`: public metadata and export paths.
- `manifest.json`: ordered project/image data read by the gallery.

Source `meta.json` controls title, caption, credit, alt and ordering. Missing alt currently becomes an empty string; that is not evidence that every photo is decorative. Write and review accurate descriptions before publishing them. No AI alt text is generated. Titles, captions and credits are currently hidden by the front end.

Camera/lens/exposure details are a separate EXIF text field. GPS, serial numbers, owner details and dates are excluded. Exported image files have metadata stripped. JPEG XL sources retain WebP fallbacks on the site.

Deleting a source project removes its public outputs on the next successful sync. The repair workflow can regenerate missing outputs only while the source still exists. It does not restore intentionally deleted source photos.

The homepage's social preview tags reference an export here. When deleting or renaming that photo, update both `og:image` and `twitter:image` in `public/index.html` and verify the replacement returns an image, not a 404.
