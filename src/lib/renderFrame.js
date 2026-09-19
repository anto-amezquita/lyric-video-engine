/**
 * 9:16 canvas renderer.
 *
 * Layout is computed once per text/style change and reused every frame; the
 * draw pass only moves a single eased scroll value. Emphasis (opacity, scale)
 * falls out of each line's distance from the focal point, so one eased number
 * animates the whole stack.
 */

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
    const text = style.uppercase ? line.text.toUpperCase() : line.text
    const rows = wrap(ctx, text, maxWidth)
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

function paintBackground(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, 0, VIDEO_HEIGHT)
  gradient.addColorStop(0, '#12100e')
  gradient.addColorStop(0.5, '#191512')
  gradient.addColorStop(1, '#0d0b09')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT)
}

function paintEdgeFades(ctx) {
  const top = ctx.createLinearGradient(0, 0, 0, EDGE_FADE)
  top.addColorStop(0, 'rgba(18,16,14,1)')
  top.addColorStop(1, 'rgba(18,16,14,0)')
  ctx.fillStyle = top
  ctx.fillRect(0, 0, VIDEO_WIDTH, EDGE_FADE)

  const bottom = ctx.createLinearGradient(0, VIDEO_HEIGHT, 0, VIDEO_HEIGHT - EDGE_FADE)
  bottom.addColorStop(0, 'rgba(13,11,9,1)')
  bottom.addColorStop(1, 'rgba(13,11,9,0)')
  ctx.fillStyle = bottom
  ctx.fillRect(0, VIDEO_HEIGHT - EDGE_FADE, VIDEO_WIDTH, EDGE_FADE)
}

function paintProgress(ctx, progress) {
  const height = 6
  const y = VIDEO_HEIGHT - height
  ctx.fillStyle = 'rgba(207,199,186,0.16)'
  ctx.fillRect(0, y, VIDEO_WIDTH, height)
  ctx.fillStyle = '#2aa898'
  ctx.fillRect(0, y, VIDEO_WIDTH * Math.min(1, Math.max(0, progress)), height)
}

/**
 * Draw one frame.
 *
 * `focusIndex` is the line the stack centres on and `opacity` fades the whole
 * stack — both come from `resolveFrame`. While the stack is fully faded out
 * the scroll snaps instead of easing, so after a gap the next line fades in
 * already in place.
 */
export function renderFrame({
  ctx,
  layout,
  style,
  activeIndex,
  focusIndex = 0,
  opacity: stackOpacity = 1,
  progress,
  anim,
  now,
  animate = true,
}) {
  paintBackground(ctx)

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

    blocks.forEach((block, index) => {
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
      ctx.fillStyle =
        style.accentActive && index === activeIndex && emphasis > 0.7 ? '#2aa898' : '#faf8f5'

      const firstRowY = -((block.rows.length - 1) * rowHeight) / 2
      block.rows.forEach((row, rowIndex) => {
        ctx.fillText(row, 0, firstRowY + rowIndex * rowHeight)
      })
      ctx.restore()
    })
  }

  ctx.globalAlpha = 1
  paintEdgeFades(ctx)
  if (style.showProgress) paintProgress(ctx, progress)
}
