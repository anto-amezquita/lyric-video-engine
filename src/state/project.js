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

/**
 * Timed lines sorted by effective time, so the active-line lookup survives an
 * out-of-order tap pass. Untimed lines are laid out but can never be active.
 */
export function buildCueList(lines, offsetMs) {
  return lines
    .map((line, index) => ({ index, time: effectiveTime(line, offsetMs) }))
    .filter((cue) => cue.time != null && cue.time >= 0)
    .toSorted((a, b) => a.time - b.time)
}

/** Index of the last cue at or before `time`, or -1 before the first cue. */
export function findActiveIndex(cues, time) {
  let lo = 0
  let hi = cues.length - 1
  let found = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (cues[mid].time <= time) {
      found = cues[mid].index
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return found
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
      return { ...state, lines: state.lines.map((line) => ({ ...line, time: null })) }
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
      const lines = state.lines.map((line) =>
        line.time == null ? line : { ...line, time: Math.max(0, line.time + shift) },
      )
      return { ...state, lines, offsetMs: 0 }
    }

    case 'set-cursor':
      return withCursor(state, action.cursor)

    case 'move-cursor':
      return withCursor(state, state.cursor + action.delta)

    case 'insert-line': {
      const lines = [...state.lines]
      lines.splice(action.index + 1, 0, { id: createLineId(), text: '', time: null })
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
