import assert from 'node:assert/strict'
import test from 'node:test'
import {
  GRADIENT_BOTTOM,
  GRADIENT_TOP,
  backgroundStops,
  contrastRatio,
  hexToRgb,
  shade,
  shadeAlpha,
  withAlpha,
} from '../src/lib/color.js'
import { sessionId, sessionRecord } from '../src/lib/sessions.js'
import { buildLines, tokenizeLyrics } from '../src/lib/tokenize.js'
import { formatRelativeTime, formatTime, parseTime } from '../src/lib/time.js'
import {
  DEFAULT_STYLE,
  FADE_SECONDS,
  PROJECT_FILE_VERSION,
  STORAGE_KEY,
  buildCueList,
  effectiveTime,
  findActiveIndex,
  initialProject,
  loadStoredProject,
  parseProjectFile,
  projectFromSession,
  projectReducer,
  resolveFrame,
  serializeProjectFile,
} from '../src/state/project.js'

const RAW = `Hold the line\n\nI was wrong\nCome back around\n`

function loaded() {
  return projectReducer(initialProject, { type: 'load-lyrics', raw: RAW, name: 'song.txt' })
}

test('tokenizer drops blank lines and trims', () => {
  assert.deepEqual(tokenizeLyrics(RAW), ['Hold the line', 'I was wrong', 'Come back around'])
  assert.deepEqual(tokenizeLyrics('  a  \r\n\r\n b '), ['a', 'b'])
})

test('bracketed lines are metadata and are dropped', () => {
  const raw = ['[Copycat]', '[Verse 1]', 'I was wrong', '[Written by Antonio Amézquita]'].join(
    '\n',
  )
  assert.deepEqual(tokenizeLyrics(raw), ['I was wrong'])
})

test('[Instrumental], [Intro] and [Outro] survive as ♪ cues, case-insensitive and spacing-tolerant', () => {
  assert.deepEqual(tokenizeLyrics('[Instrumental]'), ['♪'])
  assert.deepEqual(tokenizeLyrics('[ INSTRUMENTAL ]'), ['♪'])
  assert.deepEqual(tokenizeLyrics('[Intro]'), ['♪'])
  assert.deepEqual(tokenizeLyrics('[ intro ]'), ['♪'])
  assert.deepEqual(tokenizeLyrics('[Outro]'), ['♪'])
  assert.deepEqual(tokenizeLyrics('[ OUTRO ]'), ['♪'])
  assert.deepEqual(
    tokenizeLyrics('[Intro]\nI was wrong\n[instrumental]\nCome back around\n[Outro]'),
    ['♪', 'I was wrong', '♪', 'Come back around', '♪'],
  )
})

test('a bracket that does not span the whole line stays ordinary lyric text', () => {
  assert.deepEqual(tokenizeLyrics('Put this [in brackets] please'), [
    'Put this [in brackets] please',
  ])
})

test('re-importing corrected lyrics carries timestamps over by position', () => {
  let state = loaded()
  state = projectReducer(state, { type: 'set-time', id: state.lines[0].id, time: 1 })
  state = projectReducer(state, { type: 'set-time', id: state.lines[2].id, time: 9 })

  state = projectReducer(state, {
    type: 'load-lyrics',
    raw: 'Hold the line\nI was WRONG\nCome back round\n',
    name: 'song-v2.txt',
    preserveTimings: true,
  })

  assert.deepEqual(
    state.lines.map((line) => [line.text, line.time]),
    [
      ['Hold the line', 1],
      ['I was WRONG', null],
      ['Come back round', 9],
    ],
  )
})

test('buildLines without previous lines starts every timestamp unset', () => {
  assert.deepEqual(
    buildLines(RAW).map((line) => line.time),
    [null, null, null],
  )
})

test('a spacebar tap stamps the cursor line and advances', () => {
  let state = loaded()
  state = projectReducer(state, { type: 'stamp-cursor', time: 3 })

  assert.equal(state.lines[0].time, 3)
  assert.equal(state.cursor, 1)
})

test('a stamp is stored exactly as tapped — timestamps are absolute', () => {
  let state = loaded()
  state = projectReducer(state, { type: 'stamp-cursor', time: 5 })

  assert.equal(state.lines[0].time, 5)
  assert.equal(effectiveTime(state.lines[0]), 5, 'plays back where it was tapped')
})

test('tapping over a line overwrites the timestamp and keeps the text', () => {
  let state = loaded()
  state = projectReducer(state, { type: 'stamp-cursor', time: 3 })
  state = projectReducer(state, { type: 'set-cursor', cursor: 0 })
  state = projectReducer(state, { type: 'stamp-cursor', time: 4.25 })

  assert.equal(state.lines[0].time, 4.25)
  assert.equal(state.lines[0].text, 'Hold the line')
})

test('the cursor stays inside the line list', () => {
  let state = loaded()
  state = projectReducer(state, { type: 'move-cursor', delta: -5 })
  assert.equal(state.cursor, 0)

  state = projectReducer(state, { type: 'move-cursor', delta: 99 })
  assert.equal(state.cursor, 2)
})

test('cue lookup finds the last line at or before the playhead', () => {
  const lines = [
    { id: 'a', text: 'a', time: 0 },
    { id: 'b', text: 'b', time: 4 },
    { id: 'c', text: 'c', time: 8 },
  ]
  const cues = buildCueList(lines)

  assert.equal(findActiveIndex(cues, 0), 0)
  assert.equal(findActiveIndex(cues, 3.99), 0)
  assert.equal(findActiveIndex(cues, 4), 1)
  assert.equal(findActiveIndex(cues, 99), 2)
})

test('cue lookup returns -1 before the first cue', () => {
  const cues = buildCueList([{ id: 'a', text: 'a', time: 5 }])
  assert.equal(findActiveIndex(cues, 2), -1)
})

test('out-of-order taps still resolve to the right active line', () => {
  const lines = [
    { id: 'a', text: 'a', time: 9 },
    { id: 'b', text: 'b', time: 2 },
  ]
  const cues = buildCueList(lines)

  assert.equal(findActiveIndex(cues, 3), 1)
  assert.equal(findActiveIndex(cues, 10), 0)
})

test('untimed lines never become active', () => {
  const lines = [
    { id: 'a', text: 'a', time: null },
    { id: 'b', text: 'b', time: 1 },
  ]
  assert.equal(buildCueList(lines).length, 1)
  assert.equal(findActiveIndex(buildCueList(lines), 5), 1)
})

test('timestamps parse in the shapes a person actually types', () => {
  assert.equal(parseTime('72.4'), 72.4)
  assert.equal(parseTime('1:12.4'), 72.4)
  assert.equal(parseTime('01:12'), 72)
  assert.equal(parseTime('1:12,4'), 72.4)
  assert.equal(parseTime(''), null)
  assert.equal(parseTime('soon'), null)
  assert.equal(parseTime('-4'), null)
  assert.equal(parseTime('1:2:3'), null)
})

test('formatTime round-trips through parseTime', () => {
  assert.equal(formatTime(72.4), '1:12.40')
  assert.equal(formatTime(0), '0:00.00')
  assert.equal(formatTime(null), '—')
  assert.equal(parseTime(formatTime(125.5)), 125.5)
})

/* ---------- End times and gaps ---------- */

function timed(...pairs) {
  return pairs.map(([time, end], i) => ({ id: `l${i}`, text: `line ${i}`, time, end }))
}

const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `expected ${expected}, got ${actual}`)

test('a line with an end leaves the screen at its end, not at the next start', () => {
  const cues = buildCueList(timed([1, 3], [10, null]))

  assert.equal(findActiveIndex(cues, 2.9), 0)
  assert.equal(findActiveIndex(cues, 3), -1, 'the gap between 3s and 10s shows no line')
  assert.equal(findActiveIndex(cues, 10), 1)
})

test('a line without an end holds until the next start, as before', () => {
  const cues = buildCueList(timed([1, null], [10, null]))
  assert.equal(findActiveIndex(cues, 9.99), 0)
})

test('the last line with an end leaves the screen before the outro', () => {
  const cues = buildCueList(timed([1, null], [10, 14]))
  assert.equal(findActiveIndex(cues, 13.9), 1)
  assert.equal(findActiveIndex(cues, 14), -1)
})

test('an end at or after the next start hands over with no gap', () => {
  const cues = buildCueList(timed([1, 12], [10, null]))
  assert.equal(findActiveIndex(cues, 10), 1)
  assert.equal(resolveFrame(cues, 9.9).opacity, 1, 'no fade-out into an overlap')
})

test('gaps under 0.6s are ignored, so short breaths do not flicker', () => {
  const cues = buildCueList(timed([1, 9.5], [10, null]))
  assert.equal(findActiveIndex(cues, 9.7), 0)
  assert.equal(resolveFrame(cues, 9.4).opacity, 1)
  assert.equal(resolveFrame(cues, 10.05).opacity, 1, 'and no fade-in after it')
})

test('an end at or before its start is ignored', () => {
  const cues = buildCueList(timed([5, 5], [10, null]))
  assert.equal(findActiveIndex(cues, 7), 0)
})

test('the stack fades out into a gap and back in after it', () => {
  const cues = buildCueList(timed([1, 3], [10, null]))

  assert.equal(resolveFrame(cues, 2).opacity, 1)
  near(resolveFrame(cues, 3 - FADE_SECONDS / 2).opacity, 0.5)
  assert.equal(resolveFrame(cues, 3).opacity, 0)
  assert.equal(resolveFrame(cues, 6).opacity, 0)
  near(resolveFrame(cues, 10 + FADE_SECONDS / 2).opacity, 0.5)
  assert.equal(resolveFrame(cues, 10 + FADE_SECONDS).opacity, 1)
})

test('during a gap the stack waits on the next line, so it fades in already in place', () => {
  const cues = buildCueList(timed([1, 3], [10, null]))
  assert.deepEqual(resolveFrame(cues, 6), { activeIndex: -1, focusIndex: 1, opacity: 0 })
})

test('the intro is an empty frame once anything is timed', () => {
  const cues = buildCueList(timed([5, null]))
  assert.deepEqual(resolveFrame(cues, 2), { activeIndex: -1, focusIndex: 0, opacity: 0 })
  near(resolveFrame(cues, 5 + FADE_SECONDS / 2).opacity, 0.5)
})

test('with nothing timed the stack stays parked and visible, so the look can be set', () => {
  const cues = buildCueList(timed([null, null]))
  assert.deepEqual(resolveFrame(cues, 3), { activeIndex: -1, focusIndex: 0, opacity: 1 })
})

test('an end at or before the start is refused by the reducer', () => {
  let state = loaded()
  state = projectReducer(state, { type: 'set-time', id: state.lines[0].id, time: 5 })
  state = projectReducer(state, { type: 'set-end', id: state.lines[0].id, end: 5 })
  assert.equal(state.lines[0].end, null)

  state = projectReducer(state, { type: 'set-end', id: state.lines[0].id, end: 6 })
  assert.equal(state.lines[0].end, 6)
})

test('a tap never touches an end', () => {
  let state = loaded()
  state = projectReducer(state, { type: 'set-time', id: state.lines[0].id, time: 1 })
  state = projectReducer(state, { type: 'set-end', id: state.lines[0].id, end: 3 })
  state = projectReducer(state, { type: 'stamp-cursor', time: 2 })

  assert.equal(state.lines[0].end, 3)
})

test('clearing a line or all timings clears ends as well', () => {
  let state = loaded()
  for (const [i, line] of state.lines.entries()) {
    state = projectReducer(state, { type: 'set-time', id: line.id, time: i * 4 })
    state = projectReducer(state, { type: 'set-end', id: line.id, end: i * 4 + 2 })
  }

  const one = projectReducer(state, { type: 'clear-timing', id: state.lines[1].id })
  assert.deepEqual([one.lines[1].time, one.lines[1].end], [null, null])
  assert.equal(one.lines[0].end, 2, 'other lines keep their ends')

  const all = projectReducer(state, { type: 'clear-times' })
  assert.ok(all.lines.every((line) => line.time == null && line.end == null))
})

test('re-importing lyrics carries ends over by position', () => {
  let state = loaded()
  state = projectReducer(state, { type: 'set-time', id: state.lines[1].id, time: 4 })
  state = projectReducer(state, { type: 'set-end', id: state.lines[1].id, end: 6 })
  state = projectReducer(state, {
    type: 'load-lyrics',
    raw: 'Hold the line\nI was so wrong\nCome back around',
    preserveTimings: true,
  })

  assert.equal(state.lines[1].end, 6)
})

test('projects saved before end times load with every end unset', () => {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
  }
  store.set(
    STORAGE_KEY,
    JSON.stringify({ lines: [{ id: 'a', text: 'a', time: 1 }], offsetMs: 0, style: {} }),
  )

  try {
    assert.deepEqual(loadStoredProject().lines, [{ id: 'a', text: 'a', time: 1, end: null }])
  } finally {
    delete globalThis.localStorage
  }
})

/* ---------- Project save/load file ---------- */

test('a saved project round-trips through load back to the same lines and style', () => {
  let state = loaded()
  state = projectReducer(state, { type: 'set-time', id: state.lines[0].id, time: 1.5 })
  state = projectReducer(state, { type: 'set-end', id: state.lines[0].id, end: 3 })
  state = projectReducer(state, { type: 'set-style', style: { fontScale: 1.2 } })

  const json = serializeProjectFile(state, 'demo.wav')
  const parsed = parseProjectFile(json)

  assert.deepEqual(
    parsed.lines.map((line) => [line.text, line.time, line.end]),
    state.lines.map((line) => [line.text, line.time, line.end]),
  )
  assert.equal(parsed.style.fontScale, 1.2)
  assert.equal(parsed.lyricsName, state.lyricsName)
  assert.equal(parsed.cursor, 0)
})

test('a saved file carries the current version and the audio name for reference only', () => {
  const json = serializeProjectFile(loaded(), 'demo.wav')
  const saved = JSON.parse(json)

  assert.equal(saved.version, PROJECT_FILE_VERSION)
  assert.equal(saved.audioName, 'demo.wav')
})

test('parseProjectFile rejects invalid JSON, a missing lines array, and an unknown version', () => {
  assert.equal(parseProjectFile('not json'), null)
  assert.equal(parseProjectFile(JSON.stringify({ version: PROJECT_FILE_VERSION })), null)
  assert.equal(
    parseProjectFile(JSON.stringify({ version: PROJECT_FILE_VERSION + 1, lines: [] })),
    null,
  )
})

test('load-project replaces the whole state in one step', () => {
  let state = loaded()
  state = projectReducer(state, { type: 'set-time', id: state.lines[0].id, time: 5 })

  const incoming = parseProjectFile(
    serializeProjectFile(
      { lines: [{ id: 'x', text: 'Only this line', time: 2, end: null }], style: {} },
      null,
    ),
  )
  state = projectReducer(state, { type: 'load-project', project: incoming })

  assert.equal(state.lines.length, 1)
  assert.equal(state.lines[0].text, 'Only this line')
})

test('a project saved with a global offset folds it into its timestamps on load', () => {
  /* The offset was removed in favour of absolute times; an older payload
   * still carrying one has to keep playing where it played before. */
  const parsed = parseProjectFile(
    JSON.stringify({
      version: PROJECT_FILE_VERSION,
      offsetMs: -1500,
      lines: [
        { id: 'a', text: 'a', time: 10, end: 12 },
        { id: 'b', text: 'b', time: 0.5, end: null },
      ],
      style: {},
    }),
  )

  assert.deepEqual(
    parsed.lines.map((line) => [line.time, line.end]),
    [
      [8.5, 10.5],
      [0, null],
    ],
    'shifted once, and never below zero',
  )
  assert.equal('offsetMs' in parsed, false, 'and the offset itself is gone')
})

/* ---------- Recent sessions ---------- */

test('a session id is just the lyrics file name', () => {
  assert.equal(sessionId('Copycat.txt'), 'Copycat.txt')
})

test('sessionRecord carries the project fields plus a fresh updatedAt, no audio bytes', () => {
  const before = Date.now()
  const record = sessionRecord({
    lyricsName: 'Copycat.txt',
    lines: [{ id: 'a', text: 'Line one', time: 1, end: null }],
    style: { fontScale: 1.1 },
    audioName: 'Copycat.wav',
  })

  assert.equal(record.id, 'Copycat.txt')
  assert.equal(record.lyricsName, 'Copycat.txt')
  assert.equal(record.audioName, 'Copycat.wav')
  assert.deepEqual(record.lines, [{ id: 'a', text: 'Line one', time: 1, end: null }])
  assert.ok(record.updatedAt >= before)
  assert.equal('blob' in record, false)
})

test('sessionRecord defaults a missing audioName to null', () => {
  const record = sessionRecord({ lyricsName: 'Song.txt', lines: [], style: {} })
  assert.equal(record.audioName, null)
})

test('projectFromSession normalizes a session record into a full project', () => {
  const project = projectFromSession(
    sessionRecord({
      lyricsName: 'Copycat.txt',
      lines: [{ id: 'a', text: 'Line one', time: 1, end: null }],
      style: { fontScale: 1.3 },
    }),
  )

  assert.equal(project.lyricsName, 'Copycat.txt')
  assert.equal(project.style.fontScale, 1.3)
  assert.equal(project.style.align, 'center', 'unset style fields fall back to defaults')
  assert.equal(project.cursor, 0)
})

test('formatRelativeTime buckets by minute, hour and day', () => {
  const now = Date.UTC(2026, 0, 2, 12, 0, 0)
  assert.equal(formatRelativeTime(now - 10_000, now), 'just now')
  assert.equal(formatRelativeTime(now - 5 * 60_000, now), '5m ago')
  assert.equal(formatRelativeTime(now - 3 * 3_600_000, now), '3h ago')
  assert.equal(formatRelativeTime(now - 2 * 86_400_000, now), '2d ago')
})

/* ---------- Canvas colours ---------- */

test('hexToRgb reads both shorthand and full hex, and refuses anything else', () => {
  assert.deepEqual(hexToRgb('#191512'), { r: 25, g: 21, b: 18 })
  assert.deepEqual(hexToRgb('191512'), { r: 25, g: 21, b: 18 })
  assert.deepEqual(hexToRgb('#fff'), { r: 255, g: 255, b: 255 })
  assert.deepEqual(hexToRgb('teal'), { r: 0, g: 0, b: 0 }, 'unparseable falls back to black')
})

test('shade darkens below 1 and lightens toward white above it', () => {
  assert.equal(shade('#646464', 0.5), 'rgb(50, 50, 50)')
  assert.equal(shade('#646464', 1), 'rgb(100, 100, 100)')
  assert.equal(shade('#000000', 2), 'rgb(255, 255, 255)')
})

test('shadeAlpha matches shade but carries an alpha, for the transparent end of a fade', () => {
  assert.equal(shadeAlpha('#646464', 0.5, 0), 'rgba(50, 50, 50, 0)')
  assert.equal(withAlpha('#646464', 0.16), 'rgba(100, 100, 100, 0.16)')
})

test('the gradient keeps the picked colour in the middle and darkens both ends', () => {
  const stops = backgroundStops('#191512')
  assert.equal(stops.middle, 'rgb(25, 21, 18)', 'the picked colour is the middle stop')
  assert.equal(stops.top, shade('#191512', GRADIENT_TOP))
  assert.equal(stops.bottom, shade('#191512', GRADIENT_BOTTOM))
  assert.ok(GRADIENT_BOTTOM < GRADIENT_TOP, 'the bottom is the darkest end')
})

test('contrastRatio matches the WCAG extremes and is order-independent', () => {
  assert.equal(contrastRatio('#ffffff', '#000000'), 21)
  assert.equal(contrastRatio('#000000', '#ffffff'), 21)
  assert.equal(contrastRatio('#123456', '#123456'), 1)
})

test('the default lyric colour is readable on the default background', () => {
  assert.ok(
    contrastRatio(DEFAULT_STYLE.text, DEFAULT_STYLE.background) >= 4.5,
    'the shipped palette should not trip the Look panel warning',
  )
})
