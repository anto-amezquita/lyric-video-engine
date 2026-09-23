import { useEffect, useRef, useState } from 'react'
import { formatTime } from '../lib/time.js'

/**
 * Playback controls.
 *
 * Subscribes to the clock directly and keeps its own readout state at roughly
 * 10Hz, so a moving playhead never re-renders the lyric table.
 */
export function Transport({ engine, disabled }) {
  const { subscribe, duration, isPlaying, toggle, seek, nudge } = engine
  const [time, setTime] = useState(0)
  const scrubbingRef = useRef(false)

  useEffect(
    () =>
      subscribe((current) => {
        if (scrubbingRef.current) return
        setTime((previous) =>
          Math.floor(current * 10) === Math.floor(previous * 10) ? previous : current,
        )
      }),
    [subscribe],
  )

  return (
    <div className="transport">
      <div className="transport__row">
        <button
          type="button"
          className="btn btn--icon"
          onClick={toggle}
          disabled={disabled}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause (K)' : 'Play (K)'}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>
        <button
          type="button"
          className="btn btn--icon"
          onClick={() => nudge(-2)}
          disabled={disabled}
          title="Back 2s (←)"
          aria-label="Back two seconds"
        >
          ↺
        </button>
        <button
          type="button"
          className="btn btn--icon"
          onClick={() => nudge(2)}
          disabled={disabled}
          title="Forward 2s (→)"
          aria-label="Forward two seconds"
        >
          ↻
        </button>
        <span className="transport__time">
          {formatTime(time)} / {formatTime(duration)}
        </span>
      </div>

      <input
        className="transport__scrub"
        type="range"
        min={0}
        max={Math.max(duration, 0.01)}
        step={0.01}
        value={Math.min(time, duration || 0)}
        disabled={disabled}
        aria-label="Seek"
        onPointerDown={() => {
          scrubbingRef.current = true
        }}
        onPointerUp={() => {
          scrubbingRef.current = false
        }}
        onChange={(event) => {
          const next = Number(event.target.value)
          setTime(next)
          seek(next)
        }}
      />
    </div>
  )
}
