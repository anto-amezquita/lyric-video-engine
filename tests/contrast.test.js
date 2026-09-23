import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

/**
 * Contrast is a token decision, so it is checked against the tokens rather than
 * eyeballed in a screenshot. Reads src/styles/tokens.css directly, so changing
 * a token value to something illegible fails `npm test`.
 */
const css = readFileSync(
  fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url)),
  'utf8',
)

function tokens() {
  const map = new Map()
  for (const [, name, value] of css.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm)) {
    map.set(name, value.trim())
  }
  return map
}

/** Resolve `var(--x)` chains down to a literal hex value. */
function resolve(name, map, seen = new Set()) {
  assert.ok(map.has(name), `token ${name} is not defined`)
  assert.ok(!seen.has(name), `token ${name} resolves in a circle`)
  seen.add(name)
  const value = map.get(name)
  const reference = value.match(/^var\((--[\w-]+)\)$/)
  return reference ? resolve(reference[1], map, seen) : value
}

function relativeLuminance(hex) {
  const channels = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
  const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

function contrast(a, b) {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].toSorted((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const SURFACES = ['--background', '--surface', '--surface-elevated']
const TEXT = ['--text-primary', '--text-secondary', '--text-muted', '--action-primary']

test('every token resolves to a hex value', () => {
  const map = tokens()
  for (const name of [...TEXT, ...SURFACES, '--border-strong', '--action-primary-text']) {
    assert.match(resolve(name, map), /^#[0-9a-f]{6}$/i, `${name} should resolve to a hex value`)
  }
})

test('text clears WCAG AA (4.5:1) on every surface it can land on', () => {
  const map = tokens()
  for (const text of TEXT) {
    for (const surface of SURFACES) {
      const ratio = contrast(resolve(text, map), resolve(surface, map))
      assert.ok(ratio >= 4.5, `${text} on ${surface} is ${ratio.toFixed(2)}:1, needs 4.5:1`)
    }
  }
})

test('UI component boundaries clear 3:1 (WCAG 1.4.11)', () => {
  const map = tokens()
  for (const surface of SURFACES) {
    const ratio = contrast(resolve('--border-strong', map), resolve(surface, map))
    assert.ok(ratio >= 3, `--border-strong on ${surface} is ${ratio.toFixed(2)}:1, needs 3:1`)
  }
})

test('the primary button label is legible on the accent it sits on', () => {
  const map = tokens()
  const ratio = contrast(resolve('--action-primary-text', map), resolve('--action-primary', map))
  assert.ok(ratio >= 4.5, `button label is ${ratio.toFixed(2)}:1, needs 4.5:1`)
})
