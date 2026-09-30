/**
 * Lyric typefaces the Look panel offers.
 *
 * Both ship a single 400 weight from Google Fonts (see `index.html`), so the
 * canvas always asks for 400 — asking for 700 would make the browser
 * synthesize a fake bold. Adding a face means adding it here and to the
 * Google Fonts link in `index.html`; nothing else needs to know.
 */
export const FONT_FAMILIES = ['Permanent Marker', 'Lobster']

/** The face every song had before the choice existed, so old projects look identical. */
export const DEFAULT_FONT_FAMILY = 'Permanent Marker'

/** The family a style asks for, or the default when it is missing or not one we ship. */
export function resolveFontFamily(style) {
  return FONT_FAMILIES.includes(style?.fontFamily) ? style.fontFamily : DEFAULT_FONT_FAMILY
}
