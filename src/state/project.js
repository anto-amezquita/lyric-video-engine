import { buildLines } from '../lib/tokenize.js'
import { clamp } from '../lib/time.js'

export const STORAGE_KEY = 'lyric-video-engine/project/v1'

/** Version of the portable project-file contract (Save project / Load project). */
export const PROJECT_FILE_VERSION = 1

export const DEFAULT_STYLE = {
  fontScale: 1,
  align: 'center',
  showProgress: true,
  /*
   * Canvas colours, per song. These are the values the fixed palette used
   * before they were editable, so an existing project looks identical after
   * the change (missing keys fall back here on load). The lyric colour also
   * drives the active-line accent and the progress bar — one foreground
   * colour, not three to keep in agreement.
   */
  background: '#191512',
  text: '#faf8f5',
}

export const initialProject = {
  lines: [],
  cursor: 0,
  lyricsName: null,
  style: DEFAULT_STYLE,
}

/**
 * Playback time of a line. Timestamps are absolute: what is stored is what
 * plays, so fine-tuning a line means changing that one line's number and
 * nothing else.
 */
export function effectiveTime(line) {
  return line.time ?? null
}

/** End of a line, or null when it has none or it isn't after the start. */
export function effectiveEnd(line) {
  if (line.end == null || line.time == null || line.end <= line.time) return null
  return line.end
}

/** How long the lyric stack takes to fade out at a line's end, and back in after a gap. */
export const FADE_SECONDS = 0.25

/** Gaps shorter than this are ignored, so a breath between lines doesn't flicker. */
export const MIN_GAP_SECONDS = 0.6

/**
 * Timed lines sorted by time, so the active-line lookup survives an
 * out-of-order tap pass. Untimed lines are laid out but can never be active.
 *
 * Each cue also gets `until`: the moment the line leaves the screen. That is
 * its end, unless the next line starts first or the gap would be too short to
 * read as one — then the line simply hands over to the next.
 */
export function buildCueList(lines) {
  const cues = lines
    .map((line, index) => ({
      index,
      time: effectiveTime(line),
      end: effectiveEnd(line),
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

    /* A loaded project file replaces everything in one step — no merge. */
    case 'load-project':
      return action.project

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
        i === index ? { ...line, time: Math.max(0, action.time) } : line,
      )
      return { ...state, lines, cursor: Math.min(index + 1, lines.length - 1) }
    }

    case 'clear-times': {
      return {
        ...state,
        lines: state.lines.map((line) => ({ ...line, time: null, end: null })),
      }
    }

    case 'set-cursor':
      return withCursor(state, action.cursor)

    case 'move-cursor':
      return withCursor(state, state.cursor + action.delta)

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

/**
 * Normalize a parsed payload (from localStorage, a loaded project file, or a
 * session record) into a full project shape, or null if it isn't one.
 */
function projectFromPayload(saved) {
  if (!saved || !Array.isArray(saved.lines)) return null

  /*
   * Timestamps used to be read through a global offset. That was removed in
   * favour of absolute times, so any payload still carrying a non-zero
   * `offsetMs` gets it folded into its own timestamps once, here — the same
   * arithmetic the old "bake offset" action did. Without this, a project
   * saved with an offset would silently play shifted.
   */
  const shift = (saved.offsetMs ?? 0) / 1000
  const fold = (value) => (value == null ? null : Math.max(0, value + shift))

  const { offsetMs: _legacyOffset, ...rest } = saved

  return {
    ...initialProject,
    ...rest,
    lines: saved.lines.map((line) => ({
      ...line,
      time: shift ? fold(line.time) : line.time,
      /* Projects saved before end times existed load with every end unset. */
      end: shift ? fold(line.end ?? null) : (line.end ?? null),
    })),
    style: { ...DEFAULT_STYLE, ...saved.style },
    cursor: 0,
  }
}

export function loadStoredProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialProject
    return projectFromPayload(JSON.parse(raw)) ?? initialProject
  } catch {
    return initialProject
  }
}

export function storeProject(state) {
  try {
    const { lines, lyricsName, style } = state
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines, lyricsName, style }))
  } catch {
    /* Private mode or a full quota — persistence is a convenience, not a feature. */
  }
}

/**
 * Serialize the project to a portable, human-readable `.json` string —
 * everything `storeProject` saves, plus a version field and the audio
 * file's name for reference. `audioName` is informational only: it is never
 * read back on load, since audio is always re-picked separately.
 */
export function serializeProjectFile(state, audioName) {
  const { lines, lyricsName, style } = state
  return JSON.stringify(
    {
      version: PROJECT_FILE_VERSION,
      lines,
      lyricsName,
      style,
      audioName: audioName ?? null,
    },
    null,
    2,
  )
}

/**
 * Build a full project from a saved session record (`src/lib/sessions.js`),
 * through the same normalization every other load path uses. Falls back to
 * an empty project if the record is somehow malformed.
 */
export function projectFromSession(session) {
  return projectFromPayload(session) ?? initialProject
}

/**
 * Parse a loaded project file's text back into a full project, or null if
 * it isn't valid JSON, has no `lines` array, or is a version this build
 * doesn't understand.
 */
export function parseProjectFile(raw) {
  try {
    const saved = JSON.parse(raw)
    if (saved?.version !== PROJECT_FILE_VERSION) return null
    return projectFromPayload(saved)
  } catch {
    return null
  }
}
