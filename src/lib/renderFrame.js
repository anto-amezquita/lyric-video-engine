/**
 * 9:16 canvas renderer.
 *
 * Layout is computed once per text/style change and reused every frame; the
 * draw pass only moves a single eased scroll value. Emphasis (opacity, scale)
 * falls out of each line's distance from the focal point, so one eased number
 * animates the whole stack.
 *
 * Colours come from `style` — every one is picked per song. The background
 * is a solid fill of the picked colour, and the top and bottom edge fades are
 * that same colour going from opaque to transparent.
 */
import { withAlpha } from './color.js'
import { resolveFontFamily } from './fonts.js'

export const VIDEO_WIDTH = 1080
export const VIDEO_HEIGHT = 1920

const PADDING_X = 96
const FOCAL_Y = VIDEO_HEIGHT * 0.46
const FALLOFF = 300
const EDGE_FADE = 420

/** Second line of the end card, under the song title. */
export const END_CARD_CREDIT = 'Written by AMEZ'

export function baseFontSize(style) {
  return Math.round(140 * (style.fontScale ?? 1))
}

/* Every lyric face ships a single 400 weight (see fonts.js); 700 would fake a bolder. */
function fontSpec(style, size) {
  return `400 ${size}px "${resolveFontFamily(style)}", system-ui, sans-serif`
}

/** Load the display face before first paint, so no frame renders in a fallback. */
export function ensureFontLoaded(style) {
  if (!document.fonts?.load) return Promise.resolve()
  return document.fonts.load(fontSpec(style, baseFontSize(style))).catch(() => {})
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
 *
 * When a `title` is given, the end card (title over the credit) is wrapped and
 * measured here too, so drawing it costs nothing per frame.
 */
export function computeLayout(lines, style, title = null) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const size = baseFontSize(style)
  ctx.font = fontSpec(style, size)

  const maxWidth = VIDEO_WIDTH - PADDING_X * 2
  const rowHeight = size * 1.1
  const blockGap = size * 0.5

  let y = 0
  const blocks = lines.map((line) => {
    const rows = wrap(ctx, line.text, maxWidth)
    const height = rows.length * rowHeight
    const block = { id: line.id, rows, top: y, height, center: y + height / 2 }
    y += height + blockGap
    return block
  })

  let card = null
  if (title) {
    const creditSize = Math.round(size * 0.5)
    const creditRowHeight = creditSize * 1.0
    ctx.font = fontSpec(style, creditSize)
    const titleRows = wrap(ctx, `${title} ©`, maxWidth)
    const creditRows = wrap(ctx, END_CARD_CREDIT, maxWidth)
    const titleHeight = titleRows.length * creditRowHeight
    const gap = size * 0.1
    const creditHeight = creditRows.length * creditRowHeight
    card = {
      titleRows,
      creditRows,
      creditSize,
      creditRowHeight,
      titleHeight,
      gap,
      height: titleHeight + gap + creditHeight,
    }
  }

  return { blocks, size, rowHeight, card, totalHeight: Math.max(0, y - blockGap) }
}

/** Mutable easing state, owned by the preview component and reset on load. */
export function createAnimState() {
  return { scroll: null, lastFrame: null }
}

/*
 * The background is a solid fill of the picked colour and never changes per
 * frame, so it is painted once into an offscreen canvas and reused. Cached
 * against the colour it was painted with, so picking a new background
 * repaints it exactly once.
 */
let backgroundBitmap = null
let backgroundKey = null

function getBackgroundBitmap(backgroundColor) {
  if (backgroundBitmap && backgroundKey === backgroundColor) return backgroundBitmap

  const canvas = document.createElement('canvas')
  canvas.width = VIDEO_WIDTH
  canvas.height = VIDEO_HEIGHT
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT)

  backgroundBitmap = canvas
  backgroundKey = backgroundColor
  return backgroundBitmap
}

function paintBackground(ctx, style) {
  ctx.drawImage(getBackgroundBitmap(style.background ?? '#191512'), 0, 0)
}

/*
 * The fades are the picked background colour itself, fully opaque at the
 * frame edge and transparent toward the lyrics. Both ends share the same RGB
 * (only alpha changes), so the fade never passes through a grey fringe.
 */
function paintEdgeFades(ctx, style) {
  const background = style.background ?? '#191512'
  const opaque = withAlpha(background, 1)
  const clear = withAlpha(background, 0)

  const top = ctx.createLinearGradient(0, 0, 0, EDGE_FADE)
  top.addColorStop(0, opaque)
  top.addColorStop(1, clear)
  ctx.fillStyle = top
  ctx.fillRect(0, 0, VIDEO_WIDTH, EDGE_FADE)

  const bottom = ctx.createLinearGradient(0, VIDEO_HEIGHT, 0, VIDEO_HEIGHT - EDGE_FADE)
  bottom.addColorStop(0, opaque)
  bottom.addColorStop(1, clear)
  ctx.fillStyle = bottom
  ctx.fillRect(0, VIDEO_HEIGHT - EDGE_FADE, VIDEO_WIDTH, EDGE_FADE)
}

/*
 * The end card: song title over the credit, centred on the same focal point as
 * the lyrics and aligned the way they are. `opacity` comes from
 * `endCardOpacity`, which is 0 until the last lyric has left the frame.
 */
function paintEndCard(ctx, layout, style, opacity) {
  const { card } = layout
  if (!card || opacity <= 0) return

  const centered = style.align === 'center'
  const x = centered ? VIDEO_WIDTH / 2 : PADDING_X
  const top = FOCAL_Y - card.height / 2
  const creditTop = top + card.titleHeight + card.gap

  ctx.save()
  ctx.textAlign = centered ? 'center' : 'left'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = style.text ?? '#faf8f5'

  ctx.globalAlpha = opacity
  ctx.font = fontSpec(style, card.creditSize)
  card.titleRows.forEach((row, i) =>
    ctx.fillText(row, x, top + card.creditRowHeight * (i + 0.5)),
  )

  card.creditRows.forEach((row, i) =>
    ctx.fillText(row, x, creditTop + card.creditRowHeight * (i + 0.5)),
  )
  ctx.restore()
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
  endCard = 0,
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
    ctx.font = fontSpec(style, size)
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
  paintEndCard(ctx, layout, style, endCard)
  paintEdgeFades(ctx, style)
  if (style.showProgress) paintProgress(ctx, progress, style)
}
