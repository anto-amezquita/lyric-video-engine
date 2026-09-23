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
 * One lyric line: its number, its start, its end, and its text.
 *
 * The text is read-only — lines come from the `.txt` and are corrected by
 * fixing that file and re-importing, which carries the timestamps over by
 * position. Start and end are separate fields over the same object, so typing
 * in one cannot disturb the other, and neither can change the line's
 * position.
 */
const LineRow = memo(function LineRow({
  line,
  index,
  isCursor,
  isActive,
  dispatch,
  onSeek,
  onStamp,
  onInvalid,
}) {
  /*
   * Clicking a line moves the playhead to its start. Fine-tuning is the whole
   * job now that there is no global offset to nudge everything at once, and it
   * means hearing that exact moment over and over — the alternative was
   * scrubbing for it by hand every time. The stamp button is excluded, and an
   * untimed line has nowhere to seek to.
   */
  const seekToLine = (event) => {
    if (event.target.closest('.line__actions')) return
    dispatch({ type: 'set-cursor', cursor: index })
    const at = effectiveTime(line)
    if (at != null && at >= 0) onSeek(at)
  }

  return (
    <div
      className="line"
      data-cursor={isCursor}
      data-active={isActive}
      onClick={seekToLine}
      onFocusCapture={() => dispatch({ type: 'set-cursor', cursor: index })}
    >
      <span className="line__index">{index + 1}</span>

      <TimeField
        className="line__time"
        value={line.time}
        placeholder="start"
        label={`Start time for line ${index + 1}`}
        title="Start — type m:ss.cc or seconds"
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

      <span className="line__text">{line.text}</span>

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
      </span>
    </div>
  )
})

export function LyricLines({ lines, cursor, activeIndex, dispatch, onSeek, onStamp }) {
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
