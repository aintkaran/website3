# Fonts

## Active type

The site uses TikTok Sans through `public/css/fonts.css`, with version-pinned Fontsource 5.3.0 WOFF2 subsets served from jsDelivr. The CSS declares weight 300-900 and optical-size support. The current page-wide settings in `public/css/caption.css` are 12 px, weight 300, with `font-optical-sizing: auto`.

The font's license source is linked in `public/css/fonts.css`: https://github.com/tiktok/TikTokSans/blob/main/OFL.txt . Keep those source/license references with future font changes.

## Retained legacy file

`ABCArealSuperfamilyVariable.woff2` remains in this folder from the earlier ABC Areal setup. The current CSS does not load it. It has not been deleted or relicensed as part of the documentation update; retaining it is not a claim that public redistribution is permitted. Check the foundry's terms before reusing or redistributing it: https://abcdinamo.com/licenses .

Font loading and page styling are separate: edit `fonts.css` for font sources, `caption.css` for shared typography variables and `style.css` for layout. Check real desktop/mobile rendering after changes.
