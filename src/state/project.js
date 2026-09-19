import { buildLines, createLineId } from '../lib/tokenize.js'
import { clamp } from '../lib/time.js'

export const STORAGE_KEY = 'lyric-video-engine/project/v1'

export const DEFAULT_STYLE = {
  fontScale: 1,
  align: 'center',
  uppercase: false,
  accentActive: false,
  showProgress: true,
}

export const initialProject = {
  lines: [],
  /**
   * Global time-shift, in milliseconds, applied on read — never written into
   * `line.time`. A new audio cut with more or less intro silence is one number
   * away, and the original sync pass stays intact underneath.
   */
  offsetMs: 0,
  cursor: 0,
  lyricsName: null,
  style: DEFAULT_STYLE,
}

/** Effective playback time of a line: stored time plus the global offset. */
export function effectiveTime(line, offsetMs) {
  return line.time == null ? null : line.time + offsetMs / 1000
}

/** Effective end of a line, or null when it has none or it isn't after the start. */
export function effectiveEnd(line, offsetMs) {
  if (line.end == null || line.time == null || line.end <= line.time) return null
  return line.end + offsetMs / 1000
}

/** How long the lyric stack takes to fade out at a line's end, and back in after a gap. */
export const FADE_SECONDS = 0.25

/** Gaps shorter than this are ignored, so a breath between lines doesn't flicker. */
export const MIN_GAP_SECONDS = 0.6

/**
 * Timed lines sorted by effective time, so the active-line lookup survives an
 * out-of-order tap pass. Untimed lines are laid out but can never be active.
 *
 * Each cue also gets `until`: the moment the line leaves the screen. That is
 * its end, unless the next line starts first or the gap would be too short to
 * read as one — then the line simply hands over to the next.
 */
export function buildCueList(lines, offsetMs) {
  const cues = lines
    .map((line, index) => ({
      index,
      time: effectiveTime(line, offsetMs),
      end: effectiveEnd(line, offsetMs),
    }))
    .filter((cue) => cue.time != null && cue.time >= 0)
    .toSorted((a, b) => a.time - b.time)

  return cues.map((cue, i) => {
    const next = cues[i + 1]?.time ?? Infinity
    const gap = cue.end == null ? 0 : next - cue.end
    return { ...cue, until: gap >= MIN_GAP_SECONDS ? cue.end : next }
  })
}

/** Position of the last cue at or before `time`, or -1 before the first cue. */
function findCuePosition(cues, time) {
  let lo = 0
  let hi = cues.length - 1
  let found = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (cues[mid].time <= time) {
      found = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return found
}

/** Index of the line on screen at `time`, or -1 before the first cue and in gaps. */
export function findActiveIndex(cues, time) {
  const position = findCuePosition(cues, time)
  if (position < 0) return -1
  const cue = cues[position]
  return time < cue.until ? cue.index : -1
}

/**
 * Everything a frame needs to know about the lyric stack at `time`: which line
 * is active, which line the stack should be centred on, and how visible the
 * whole stack is.
 *
 * Pure function of time and cues, so a seek, a scrub and the export all draw
 * the same frame for the same moment. With no cues at all, the stack stays
 * parked on line 1 at full opacity, so the look can be set before syncing.
 */
export function resolveFrame(cues, time) {
  if (!cues.length) return { activeIndex: -1, focusIndex: 0, opacity: 1 }

  const position = findCuePosition(cues, time)
  const cue = cues[position]
  const upcoming = cues[position + 1] ?? null

  if (!cue || time >= cue.until) {
    /* Intro or gap: nothing on screen, stack waiting on the next line. */
    return { activeIndex: -1, focusIndex: (upcoming ?? cue).index, opacity: 0 }
  }

  const afterGap = position === 0 || cues[position - 1].until < cue.time
  const fadeIn = afterGap ? (time - cue.time) / FADE_SECONDS : 1
  const fadeOut = upcoming && cue.until >= upcoming.time ? 1 : (cue.until - time) / FADE_SECONDS
  const opacity = Math.min(1, Math.max(0, Math.min(fadeIn, fadeOut)))

  return { activeIndex: cue.index, focusIndex: cue.index, opacity }
}

/** True when an end would land at or before its line's start. */
export function isEndBeforeStart(time, end) {
  return time != null && end != null && end <= time
}

function withCursor(state, cursor) {
  return { ...state, cursor: clamp(cursor, 0, Math.max(0, state.lines.length - 1)) }
}

export function projectReducer(state, action) {
  switch (action.type) {
    /* Re-tokenising carries timestamps over by position — see buildLines. */
    case 'load-lyrics': {
      const lines = buildLines(action.raw, action.preserveTimings ? state.lines : [])
      return { ...state, lines, lyricsName: action.name ?? state.lyricsName, cursor: 0 }
    }

    /* Text edits touch `text` only. Index, id and time are untouched. */
    case 'set-text': {
      const lines = state.lines.map((line) =>
        line.id === action.id ? { ...line, text: action.text } : line,
      )
      return { ...state, lines }
    }

    case 'set-time': {
      const lines = state.lines.map((line) =>
        line.id === action.id ? { ...line, time: action.time } : line,
      )
      return { ...state, lines }
    }

    /* An end must come after the start. The field checks first; this is the backstop. */
    case 'set-end': {
      const lines = state.lines.map((line) =>
        line.id === action.id && !isEndBeforeStart(line.time, action.end)
          ? { ...line, end: action.end }
          : line,
      )
      return { ...state, lines }
    }

    /* Backspace on a line: its whole timing goes, start and end together. */
    case 'clear-timing': {
      const lines = state.lines.map((line) =>
        line.id === action.id ? { ...line, time: null, end: null } : line,
      )
      return { ...state, lines }
    }

    /* Spacebar tap: stamp the cursor line, then step forward. */
    case 'stamp-cursor': {
      if (!state.lines.length) return state
      const index = clamp(state.cursor, 0, state.lines.length - 1)
      const lines = state.lines.map((line, i) =>
        i === index ? { ...line, time: Math.max(0, action.time - state.offsetMs / 1000) } : line,
      )
      return { ...state, lines, cursor: Math.min(index + 1, lines.length - 1) }
    }

    case 'clear-times': {
      return {
        ...state,
        lines: state.lines.map((line) => ({ ...line, time: null, end: null })),
      }
    }

    case 'set-offset': {
      return { ...state, offsetMs: Math.round(action.offsetMs) }
    }

    /*
     * Fold the offset into the stored timestamps and reset it to zero. Same
     * resulting video; useful once a shift is settled and you want a clean base
     * before the next round of nudging.
     */
    case 'bake-offset': {
      if (!state.offsetMs) return state
      const shift = state.offsetMs / 1000
      const bake = (value) => (value == null ? null : Math.max(0, value + shift))
      const lines = state.lines.map((line) => ({
        ...line,
        time: bake(line.time),
        end: bake(line.end),
      }))
      return { ...state, lines, offsetMs: 0 }
    }

    case 'set-cursor':
      return withCursor(state, action.cursor)

    case 'move-cursor':
      return withCursor(state, state.cursor + action.delta)

    case 'insert-line': {
      const lines = [...state.lines]
      lines.splice(action.index + 1, 0, { id: createLineId(), text: '', time: null, end: null })
      return { ...state, lines, cursor: action.index + 1 }
    }

    case 'delete-line': {
      const lines = state.lines.filter((line) => line.id !== action.id)
      return withCursor({ ...state, lines }, state.cursor)
    }

    case 'set-style':
      return { ...state, style: { ...state.style, ...action.style } }

    case 'reset':
      return { ...initialProject, lines: [] }

    default:
      return state
  }
}

/**
 * Local-first persistence: the sync pass survives a refresh. The audio file
 * itself can't be stored, so it is re-picked on load.
 */
export function loadStoredProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialProject
    const saved = JSON.parse(raw)
    if (!Array.isArray(saved.lines)) return initialProject
    return {
      ...initialProject,
      ...saved,
      /* Projects saved before end times existed load with every end unset. */
      lines: saved.lines.map((line) => ({ ...line, end: line.end ?? null })),
      style: { ...DEFAULT_STYLE, ...saved.style },
      cursor: 0,
    }
  } catch {
    return initialProject
  }
}

export function storeProject(state) {
  try {
    const { lines, offsetMs, lyricsName, style } = state
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines, offsetMs, lyricsName, style }))
  } catch {
    /* Private mode or a full quota — persistence is a convenience, not a feature. */
  }
}
