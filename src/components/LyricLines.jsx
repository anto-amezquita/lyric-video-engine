import { memo, useEffect, useRef, useState } from 'react'
import { formatTime, parseTime } from '../lib/time.js'
import { effectiveTime, isEndBeforeStart } from '../state/project.js'

/**
 * A timestamp cell. Holds a draft while typing and commits on blur or Enter;
 * an empty draft clears the value, anything unparseable leaves it alone.
 * `validate` can refuse a parsed value by returning a reason, which is
 * reported instead of committed.
 */
function TimeField({
  className,
  value,
  placeholder,
  label,
  title,
  onCommit,
  onSeek,
  validate,
  onInvalid,
}) {
  const [draft, setDraft] = useState(null)
  const [invalid, setInvalid] = useState(false)
  const shown = draft ?? (value == null ? '' : formatTime(value))

  const commit = () => {
    if (draft == null) return
    const parsed = draft.trim() === '' ? null : parseTime(draft)
    const reason = parsed == null ? null : validate?.(parsed)
    if (reason) {
      onInvalid?.(reason)
      setInvalid(true)
    } else if (draft.trim() === '' || parsed != null) {
      onCommit(parsed)
      onInvalid?.('')
      setInvalid(false)
    }
    setDraft(null)
  }

  return (
    <input
      className={`${className} input--mono`}
      data-unset={value == null}
      aria-invalid={invalid || undefined}
      value={shown}
      placeholder={placeholder}
      aria-label={label}
      title={title}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onDoubleClick={() => value != null && onSeek(value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
        if (event.key === 'Escape') setDraft(null)
      }}
    />
  )
}

/**
 * One editable lyric line.
 *
 * Text, start and end are separate fields over the same object: typing in one
 * cannot disturb the others, and none of them can change the line's position.
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
  onInvalid,
}) {
  return (
    <div
      className="line"
      data-cursor={isCursor}
      data-active={isActive}
      onFocusCapture={() => dispatch({ type: 'set-cursor', cursor: index })}
    >
      <span className="line__index">{index + 1}</span>

      <TimeField
        className="line__time"
        value={line.time}
        placeholder="start"
        label={`Start time for line ${index + 1}`}
        title={
          line.time != null && offsetMs !== 0
            ? `Plays at ${formatTime(effectiveTime(line, offsetMs))} with the current offset`
            : 'Start — type m:ss.cc or seconds'
        }
        onCommit={(time) => dispatch({ type: 'set-time', id: line.id, time })}
        onSeek={onSeek}
      />

      <TimeField
        className="line__end"
        value={line.end}
        placeholder="end"
        label={`End time for line ${index + 1}`}
        title="End — leave empty to hold until the next line"
        onCommit={(end) => dispatch({ type: 'set-end', id: line.id, end })}
        onSeek={onSeek}
        validate={(end) =>
          isEndBeforeStart(line.time, end)
            ? `Line ${index + 1}: the end has to come after the start (${formatTime(line.time)}).`
            : null
        }
        onInvalid={onInvalid}
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
  const [message, setMessage] = useState('')

  /* Keep the tap cursor in view during a sync pass without stealing focus. */
  useEffect(() => {
    const row = containerRef.current?.children[cursor]
    row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [cursor])

  if (!lines.length) {
    return <p className="empty">Load a .txt file to break it into lines.</p>
  }

  return (
    <>
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
            onInvalid={setMessage}
          />
        ))}
      </div>
      <p className="hint" role="status" data-tone={message ? 'error' : undefined}>
        {message}
      </p>
    </>
  )
}
