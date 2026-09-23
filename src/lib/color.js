/**
 * Colour helpers for the canvas renderer.
 *
 * These live outside `renderFrame.js` because that file is DOM-only and can't
 * be reached by `node --test`, while the maths here is exactly the part worth
 * pinning: the background gradient and the edge fades are all derived from
 * one picked colour, so if the derivation drifts, the fades stop matching the
 * background they're supposed to blend into.
 */

/** `#rgb` or `#rrggbb` -> `{ r, g, b }`. Falls back to black on anything unparseable. */
export function hexToRgb(hex) {
  const raw = String(hex).trim().replace('#', '')
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw
  if (!/^[0-9a-f]{6}$/i.test(full)) return { r: 0, g: 0, b: 0 }
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

/**
 * Scale a colour's brightness. `amount` above 1 lightens toward white,
 * below 1 darkens toward black. Used to derive the gradient's top and
 * bottom stops from the one colour the user picked.
 */
function scaleChannels(hex, amount) {
  const { r, g, b } = hexToRgb(hex)
  const scale = (channel) =>
    Math.round(
      amount >= 1
        ? channel + (255 - channel) * (amount - 1)
        : Math.max(0, Math.min(255, channel * amount)),
    )
  return { r: scale(r), g: scale(g), b: scale(b) }
}

export function shade(hex, amount) {
  const { r, g, b } = scaleChannels(hex, amount)
  return `rgb(${r}, ${g}, ${b})`
}

/** The same shaded colour at a given alpha — the transparent end of an edge fade. */
export function shadeAlpha(hex, amount, alpha) {
  const { r, g, b } = scaleChannels(hex, amount)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** A colour at a given alpha, for the progress track and the edge fades. */
export function withAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * The three gradient stops, derived from the picked background colour.
 * The picked colour is the middle: the frame darkens slightly toward the
 * top and more toward the bottom, the same relationship the original fixed
 * palette had.
 */
export const GRADIENT_TOP = 0.72
export const GRADIENT_BOTTOM = 0.52

export function backgroundStops(hex) {
  return {
    top: shade(hex, GRADIENT_TOP),
    middle: shade(hex, 1),
    bottom: shade(hex, GRADIENT_BOTTOM),
  }
}

/**
 * Relative luminance per WCAG 2.1, and the contrast ratio between two
 * colours. The canvas can't be checked by the stylesheet contrast test, so
 * this is what lets the Look panel warn when picked lyric text would be
 * unreadable on the picked background.
 */
export function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  const channel = (value) => {
    const v = value / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a, b) {
  const lumA = relativeLuminance(a)
  const lumB = relativeLuminance(b)
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)
  return (lighter + 0.05) / (darker + 0.05)
}
