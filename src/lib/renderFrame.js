/**
 * 9:16 canvas renderer.
 *
 * Layout is computed once per text/style change and reused every frame; the
 * draw pass only moves a single eased scroll value. Emphasis (opacity, scale)
 * falls out of each line's distance from the focal point, so one eased number
 * animates the whole stack.
 *
 * Colours come from `style` — every one is picked per song. A canvas can't
 * read CSS custom properties, so the maths that derives the gradient and the
 * edge fades from the picked background lives in `src/lib/color.js`, where
 * it can be tested.
 */
import {
  GRADIENT_BOTTOM,
  GRADIENT_TOP,
  backgroundStops,
  shade,
  shadeAlpha,
  withAlpha,
} from './color.js'

export const VIDEO_WIDTH = 1080
export const VIDEO_HEIGHT = 1920

const PADDING_X = 96
const FOCAL_Y = VIDEO_HEIGHT * 0.46
const FALLOFF = 300
const EDGE_FADE = 420

export const CANVAS_FONT = 'Schibsted Grotesk'

export function baseFontSize(style) {
  return Math.round(70 * (style.fontScale ?? 1))
}

function fontSpec(size) {
  return `600 ${size}px "${CANVAS_FONT}", system-ui, sans-serif`
}

/** Load the display face before first paint, so no frame renders in a fallback. */
export function ensureFontLoaded(style) {
  if (!document.fonts?.load) return Promise.resolve()
  return document.fonts.load(fontSpec(baseFontSize(style))).catch(() => {})
}

function wrap(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean)
  if (!words.length) return ['']
  const rows = []
  let current = words[0]
  for (let i = 1; i < words.length; i += 1) {
    const candidate = `${current} ${words[i]}`
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate
    } else {
      rows.push(current)
      current = words[i]
    }
  }
  rows.push(current)
  return rows
}

/**
 * Flow the lyric blocks top to bottom and record each block's centre. Returns
 * positions in canvas pixels, independent of playback time.
 */
export function computeLayout(lines, style) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const size = baseFontSize(style)
  ctx.font = fontSpec(size)

  const maxWidth = VIDEO_WIDTH - PADDING_X * 2
  const rowHeight = size * 1.2
  const blockGap = size * 0.85

  let y = 0
  const blocks = lines.map((line) => {
    const rows = wrap(ctx, line.text, maxWidth)
    const height = rows.length * rowHeight
    const block = { id: line.id, rows, top: y, height, center: y + height / 2 }
    y += height + blockGap
    return block
  })

  return { blocks, size, rowHeight, totalHeight: Math.max(0, y - blockGap) }
}

/** Mutable easing state, owned by the preview component and reset on load. */
export function createAnimState() {
  return { scroll: null, lastFrame: null }
}

/**
 * A small tile of random per-pixel gray noise, tiled across the background
 * at low opacity. The gradient below is dark, large, and low-contrast —
 * exactly the conditions where 8-bit colour visibly bands into discrete
 * steps instead of reading as smooth. A fixed grain dithers it away. Same
 * canvas gets recorded on export (`decisions/0001`), so this fixes both the
 * live preview and the exported file in one place.
 */
function createGrainPattern(ctx) {
  const size = 64
  const noise = document.createElement('canvas')
  noise.width = size
  noise.height = size
  const noiseCtx = noise.getContext('2d')
  const imageData = noiseCtx.createImageData(size, size)
  for (let i = 0; i < imageData.data.length; i += 4) {
    const value = Math.floor(Math.random() * 255)
    imageData.data[i] = value
    imageData.data[i + 1] = value
    imageData.data[i + 2] = value
    imageData.data[i + 3] = 255
  }
  noiseCtx.putImageData(imageData, 0, 0)
  return ctx.createPattern(noise, 'repeat')
}

/*
 * The background never changes per frame — same colours, same grain, every
 * time — so it is painted once into an offscreen canvas and reused, rather
 * than rebuilding the gradient and noise on every one of 30 frames a
 * second. Cheaper, and it also means the dithering only has to be computed
 * once per page load. Cached against the colour it was painted with, so
 * picking a new background repaints it exactly once.
 */
let backgroundBitmap = null
let backgroundKey = null

function getBackgroundBitmap(backgroundColor) {
  if (backgroundBitmap && backgroundKey === backgroundColor) return backgroundBitmap

  const canvas = document.createElement('canvas')
  canvas.width = VIDEO_WIDTH
  canvas.height = VIDEO_HEIGHT
  const ctx = canvas.getContext('2d')

  const stops = backgroundStops(backgroundColor)
  const gradient = ctx.createLinearGradient(0, 0, 0, VIDEO_HEIGHT)
  gradient.addColorStop(0, stops.top)
  gradient.addColorStop(0.5, stops.middle)
  gradient.addColorStop(1, stops.bottom)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT)

  ctx.globalAlpha = 0.025
  ctx.fillStyle = createGrainPattern(ctx)
  ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT)
  ctx.globalAlpha = 1

  backgroundBitmap = canvas
  backgroundKey = backgroundColor
  return backgroundBitmap
}

function paintBackground(ctx, style) {
  ctx.drawImage(getBackgroundBitmap(style.background ?? '#191512'), 0, 0)
}

/*
 * The fades have to match the gradient they sit on, or the top and bottom of
 * the frame reads as a band of the wrong colour — so both ends are derived
 * from the same picked colour as the background stops.
 */
function paintEdgeFades(ctx, style) {
  const background = style.background ?? '#191512'

  const top = ctx.createLinearGradient(0, 0, 0, EDGE_FADE)
  top.addColorStop(0, shade(background, GRADIENT_TOP))
  top.addColorStop(1, shadeAlpha(background, GRADIENT_TOP, 0))
  ctx.fillStyle = top
  ctx.fillRect(0, 0, VIDEO_WIDTH, EDGE_FADE)

  const bottom = ctx.createLinearGradient(0, VIDEO_HEIGHT, 0, VIDEO_HEIGHT - EDGE_FADE)
  bottom.addColorStop(0, shade(background, GRADIENT_BOTTOM))
  bottom.addColorStop(1, shadeAlpha(background, GRADIENT_BOTTOM, 0))
  ctx.fillStyle = bottom
  ctx.fillRect(0, VIDEO_HEIGHT - EDGE_FADE, VIDEO_WIDTH, EDGE_FADE)
}

function paintProgress(ctx, progress, style) {
  const height = 6
  const y = VIDEO_HEIGHT - height
  const foreground = style.text ?? '#faf8f5'
  ctx.fillStyle = withAlpha(foreground, 0.16)
  ctx.fillRect(0, y, VIDEO_WIDTH, height)
  ctx.fillStyle = foreground
  ctx.fillRect(0, y, VIDEO_WIDTH * Math.min(1, Math.max(0, progress)), height)
}

/**
 * Draw one frame.
 *
 * `focusIndex` is the line the stack centres on and `opacity` fades the whole
 * stack — both come from `resolveFrame`. While the stack is fully faded out
 * the scroll snaps instead of easing, so after a gap the next line fades in
 * already in place.
 *
 * The active line needs no colour of its own: it is the one nearest the
 * focal point, so full opacity and scale already single it out.
 */
export function renderFrame({
  ctx,
  layout,
  style,
  focusIndex = 0,
  opacity: stackOpacity = 1,
  progress,
  anim,
  now,
  animate = true,
}) {
  paintBackground(ctx, style)

  const { blocks, size, rowHeight } = layout
  if (blocks.length) {
    const target = blocks[Math.min(focusIndex, blocks.length - 1)].center

    if (anim.scroll == null || !animate || stackOpacity === 0) {
      anim.scroll = target
    } else {
      const dt = anim.lastFrame == null ? 1 / 60 : Math.min(0.1, (now - anim.lastFrame) / 1000)
      anim.scroll += (target - anim.scroll) * (1 - Math.exp(-dt * 9))
    }
    anim.lastFrame = now

    const centered = style.align === 'center'
    ctx.textAlign = centered ? 'center' : 'left'
    ctx.textBaseline = 'middle'
    ctx.font = `600 ${size}px "${CANVAS_FONT}", system-ui, sans-serif`
    const x = centered ? VIDEO_WIDTH / 2 : PADDING_X

    blocks.forEach((block) => {
      if (stackOpacity === 0) return
      const y = block.center - anim.scroll + FOCAL_Y
      if (y < -block.height - 120 || y > VIDEO_HEIGHT + block.height + 120) return

      const emphasis = Math.max(0, 1 - Math.abs(block.center - anim.scroll) / FALLOFF)
      const opacity = 0.13 + 0.87 * emphasis ** 1.7
      const scale = 0.93 + 0.07 * emphasis

      ctx.save()
      ctx.globalAlpha = opacity * stackOpacity
      ctx.translate(x, y)
      ctx.scale(scale, scale)
      ctx.fillStyle = style.text ?? '#faf8f5'

      const firstRowY = -((block.rows.length - 1) * rowHeight) / 2
      block.rows.forEach((row, rowIndex) => {
        ctx.fillText(row, 0, firstRowY + rowIndex * rowHeight)
      })
      ctx.restore()
    })
  }

  ctx.globalAlpha = 1
  paintEdgeFades(ctx, style)
  if (style.showProgress) paintProgress(ctx, progress, style)
}
