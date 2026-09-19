import { memo, useEffect, useRef, useState } from 'react'
import { formatTime, parseTime } from '../lib/time.js'
import { effectiveTime } from '../state/project.js'

/**
 * One editable lyric line.
 *
 * Text and timestamp are separate fields over the same object: typing in one
 * cannot disturb the other, and neither can change the line's position.
 */
const LineRow = memo(function LineRow({
  line,
  index,
  isCursor,
  isActive,
  offsetMs,
  dispatch,
  onSeek,
  onStamp,
}) {
  const [draft, setDraft] = useState(null)
  const shown = draft ?? (line.time == null ? '' : formatTime(line.time))

  const commit = () => {
    if (draft == null) return
    if (draft.trim() === '') dispatch({ type: 'set-time', id: line.id, time: null })
    else {
      const parsed = parseTime(draft)
      if (parsed != null) dispatch({ type: 'set-time', id: line.id, time: parsed })
    }
    setDraft(null)
  }

  return (
    <div
      className="line"
      data-cursor={isCursor}
      data-active={isActive}
      onFocusCapture={() => dispatch({ type: 'set-cursor', cursor: index })}
    >
      <span className="line__index">{index + 1}</span>

      <input
        className="line__time input--mono"
        data-unset={line.time == null}
        value={shown}
        placeholder="—"
        aria-label={`Timestamp for line ${index + 1}`}
        title={
          line.time != null && offsetMs !== 0
            ? `Plays at ${formatTime(effectiveTime(line, offsetMs))} with the current offset`
            : 'Timestamp — type m:ss.cc or seconds'
        }
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onDoubleClick={() => line.time != null && onSeek(line.time)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
          if (event.key === 'Escape') setDraft(null)
        }}
      />

      <input
        className="line__text"
        value={line.text}
        placeholder="Empty line"
        aria-label={`Text for line ${index + 1}`}
        onChange={(event) => dispatch({ type: 'set-text', id: line.id, text: event.target.value })}
      />

      <span className="line__actions">
        <button
          type="button"
          className="line__action"
          title="Stamp this line at the playhead"
          aria-label={`Stamp line ${index + 1} at the playhead`}
          onClick={() => onStamp(index)}
        >
          ◉
        </button>
        <button
          type="button"
          className="line__action"
          title="Insert a line below"
          aria-label={`Insert a line below line ${index + 1}`}
          onClick={() => dispatch({ type: 'insert-line', index })}
        >
          +
        </button>
        <button
          type="button"
          className="line__action"
          title="Delete this line"
          aria-label={`Delete line ${index + 1}`}
          onClick={() => dispatch({ type: 'delete-line', id: line.id })}
        >
          ×
        </button>
      </span>
    </div>
  )
})

export function LyricLines({ lines, cursor, activeIndex, offsetMs, dispatch, onSeek, onStamp }) {
  const containerRef = useRef(null)

  /* Keep the tap cursor in view during a sync pass without stealing focus. */
  useEffect(() => {
    const row = containerRef.current?.children[cursor]
    row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [cursor])

  if (!lines.length) {
    return <p className="empty">Load a .txt file to break it into lines.</p>
  }

  return (
    <div className="lines" ref={containerRef}>
      {lines.map((line, index) => (
        <LineRow
          key={line.id}
          line={line}
          index={index}
          isCursor={index === cursor}
          isActive={index === activeIndex}
          offsetMs={offsetMs}
          dispatch={dispatch}
          onSeek={onSeek}
          onStamp={onStamp}
        />
      ))}
    </div>
  )
}
