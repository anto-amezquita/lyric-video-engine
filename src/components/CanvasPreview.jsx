import { useEffect, useMemo, useRef, useState } from 'react'
import {
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
  computeLayout,
  createAnimState,
  ensureFontLoaded,
  renderFrame,
} from '../lib/renderFrame.js'
import { buildCueList, findActiveIndex } from '../state/project.js'

/**
 * The 9:16 preview, and the surface the exporter records.
 *
 * It reads `audio.currentTime` every animation frame, finds the active line in
 * the cue list, and draws. Nothing here goes through React state, so the
 * editor next to it stays responsive at 60fps.
 */
export function CanvasPreview({
  canvasRef,
  lines,
  offsetMs,
  style,
  duration,
  engine,
  recording,
  onActiveIndexChange,
}) {
  const animRef = useRef(createAnimState())
  const [fontReady, setFontReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ensureFontLoaded(style).then(() => !cancelled && setFontReady(true))
    return () => {
      cancelled = true
    }
  }, [style])

  /* Wrapping is measured once per text/style change, not per frame. */
  const textKey = useMemo(() => lines.map((line) => line.text).join('\n'), [lines])
  const layout = useMemo(
    () => computeLayout(lines, style),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [textKey, style, fontReady, lines.length],
  )

  const cues = useMemo(() => buildCueList(lines, offsetMs), [lines, offsetMs])

  useEffect(() => {
    animRef.current = createAnimState()
  }, [textKey])

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return undefined

    let lastReported = null
    return engine.subscribe((time, now) => {
      const activeIndex = findActiveIndex(cues, time)
      if (activeIndex !== lastReported) {
        lastReported = activeIndex
        onActiveIndexChange(activeIndex)
      }
      renderFrame({
        ctx,
        layout,
        style,
        activeIndex,
        progress: duration ? time / duration : 0,
        anim: animRef.current,
        now,
      })
    })
  }, [canvasRef, cues, layout, style, duration, engine, onActiveIndexChange])

  return (
    <div className="preview">
      <div className="preview__frame">
        {recording && <span className="preview__badge">REC</span>}
        <canvas
          ref={canvasRef}
          className="preview__canvas"
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          role="img"
          aria-label="Vertical lyric video preview"
        />
      </div>
      <p className="hint">1080 × 1920 · 9:16 · 30fps</p>
    </div>
  )
}
