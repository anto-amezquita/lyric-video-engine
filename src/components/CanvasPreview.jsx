import { useEffect, useMemo, useRef, useState } from 'react'
import {
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
  computeLayout,
  createAnimState,
  ensureFontLoaded,
  renderFrame,
} from '../lib/renderFrame.js'
import { resolveFontFamily } from '../lib/fonts.js'
import { buildCueList, endCardOpacity, resolveFrame, songTitle } from '../state/project.js'

/**
 * The 9:16 preview, and the surface the exporter records.
 *
 * It reads `audio.currentTime` every animation frame, resolves the active line
 * and the stack's visibility from the cue list, and draws. Nothing here goes through React state, so the
 * editor next to it stays responsive at 60fps.
 */
export function CanvasPreview({
  canvasRef,
  lines,
  lyricsName,
  style,
  duration,
  engine,
  capture,
  onActiveIndexChange,
}) {
  const animRef = useRef(createAnimState())
  /*
   * Which family has finished loading, not just whether one has. Switching
   * typeface changes this once the new face arrives, which re-measures the
   * layout — wrapping in the fallback face would otherwise stick.
   */
  const [loadedFamily, setLoadedFamily] = useState(null)

  useEffect(() => {
    let cancelled = false
    const family = resolveFontFamily(style)
    ensureFontLoaded(style).then(() => !cancelled && setLoadedFamily(family))
    return () => {
      cancelled = true
    }
  }, [style])

  /* Wrapping is measured once per text/style change, not per frame. */
  const textKey = useMemo(() => lines.map((line) => line.text).join('\n'), [lines])
  const title = songTitle(lyricsName)
  const layout = useMemo(
    () => computeLayout(lines, style, title),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [textKey, style, loadedFamily, lines.length, title],
  )

  const cues = useMemo(() => buildCueList(lines), [lines])

  useEffect(() => {
    animRef.current = createAnimState()
  }, [textKey])

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return undefined

    let lastReported = null
    return engine.subscribe((time, now) => {
      const { activeIndex, focusIndex, opacity } = resolveFrame(cues, time)
      if (activeIndex !== lastReported) {
        lastReported = activeIndex
        onActiveIndexChange(activeIndex)
      }
      renderFrame({
        ctx,
        layout,
        style,
        focusIndex,
        opacity,
        progress: duration ? time / duration : 0,
        endCard: endCardOpacity(cues, time),
        anim: animRef.current,
        now,
      })
    })
  }, [canvasRef, cues, layout, style, duration, engine, onActiveIndexChange])

  return (
    <div className="preview">
      <div className="preview__frame">
        {capture && (
          <span className="preview__badge" data-state={capture}>
            {capture === 'paused' ? 'PAUSED' : 'REC'}
          </span>
        )}
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
