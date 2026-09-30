/**
 * Colour helpers for the canvas renderer.
 *
 * These live outside `renderFrame.js` because that file is DOM-only and can't
 * be reached by `node --test`, while the maths here is worth pinning: the
 * edge fades are built from the picked background colour, and the Look panel's
 * contrast warning depends on the luminance maths below.
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

/** A colour at a given alpha, for the progress track and the edge fades. */
export function withAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
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
