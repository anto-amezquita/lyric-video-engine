import assert from 'node:assert/strict'
import test from 'node:test'
import { buildLines, tokenizeLyrics } from '../src/lib/tokenize.js'
import { formatTime, parseTime } from '../src/lib/time.js'
import {
  FADE_SECONDS,
  STORAGE_KEY,
  buildCueList,
  effectiveTime,
  findActiveIndex,
  initialProject,
  loadStoredProject,
  projectReducer,
  resolveFrame,
} from '../src/state/project.js'

const RAW = `Hold the line\n\nI was wrong\nCome back around\n`

function loaded() {
  return projectReducer(initialProject, { type: 'load-lyrics', raw: RAW, name: 'song.txt' })
}

test('tokenizer drops blank lines and trims', () => {
  assert.deepEqual(tokenizeLyrics(RAW), ['Hold the line', 'I was wrong', 'Come back around'])
  assert.deepEqual(tokenizeLyrics('  a  \r\n\r\n b '), ['a', 'b'])
})

test('editing text leaves index, id and timestamp untouched', () => {
  let state = loaded()
  state = projectReducer(state, { type: 'set-time', id: state.lines[1].id, time: 12.5 })
  const before = state.lines[1]

  state = projectReducer(state, { type: 'set-text', id: before.id, text: 'I was rong' })
  const after = state.lines[1]

  assert.equal(after.id, before.id)
  assert.equal(after.time, 12.5)
  assert.equal(after.text, 'I was rong')
  assert.equal(state.lines.indexOf(after), 1)
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

test('global offset shifts playback without rewriting stored timestamps', () => {
  let state = loaded()
  state = projectReducer(state, { type: 'set-time', id: state.lines[0].id, time: 10 })
  state = projectReducer(state, { type: 'set-offset', offsetMs: -1500 })

  assert.equal(state.lines[0].time, 10, 'stored value is untouched')
  assert.equal(effectiveTime(state.lines[0], state.offsetMs), 8.5)
})

test('baking the offset folds it in once and clears it', () => {
  let state = loaded()
  state = projectReducer(state, { type: 'set-time', id: state.lines[0].id, time: 10 })
  state = projectReducer(state, { type: 'set-offset', offsetMs: 2000 })
  state = projectReducer(state, { type: 'bake-offset' })

  assert.equal(state.offsetMs, 0)
  assert.equal(state.lines[0].time, 12)
  assert.equal(projectReducer(state, { type: 'bake-offset' }).lines[0].time, 12)
})

test('baking never pushes a timestamp below zero', () => {
  let state = loaded()
  state = projectReducer(state, { type: 'set-time', id: state.lines[0].id, time: 0.5 })
  state = projectReducer(state, { type: 'set-offset', offsetMs: -4000 })
  state = projectReducer(state, { type: 'bake-offset' })

  assert.equal(state.lines[0].time, 0)
})

test('a spacebar tap stamps the cursor line and advances', () => {
  let state = loaded()
  state = projectReducer(state, { type: 'stamp-cursor', time: 3 })

  assert.equal(state.lines[0].time, 3)
  assert.equal(state.cursor, 1)
})

test('a tap subtracts the current offset, so the stamp survives baking', () => {
  let state = loaded()
  state = projectReducer(state, { type: 'set-offset', offsetMs: 1000 })
  state = projectReducer(state, { type: 'stamp-cursor', time: 5 })

  assert.equal(state.lines[0].time, 4)
  assert.equal(effectiveTime(state.lines[0], state.offsetMs), 5, 'plays back where it was tapped')
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

test('deleting a line clamps a cursor that fell off the end', () => {
  let state = loaded()
  state = projectReducer(state, { type: 'set-cursor', cursor: 2 })
  state = projectReducer(state, { type: 'delete-line', id: state.lines[2].id })

  assert.equal(state.lines.length, 2)
  assert.equal(state.cursor, 1)
})

test('inserting a line puts an empty, untimed line below and moves the cursor there', () => {
  let state = loaded()
  state = projectReducer(state, { type: 'insert-line', index: 0 })

  assert.equal(state.lines.length, 4)
  assert.deepEqual([state.lines[1].text, state.lines[1].time], ['', null])
  assert.equal(state.cursor, 1)
})

test('cue lookup finds the last line at or before the playhead', () => {
  const lines = [
    { id: 'a', text: 'a', time: 0 },
    { id: 'b', text: 'b', time: 4 },
    { id: 'c', text: 'c', time: 8 },
  ]
  const cues = buildCueList(lines, 0)

  assert.equal(findActiveIndex(cues, 0), 0)
  assert.equal(findActiveIndex(cues, 3.99), 0)
  assert.equal(findActiveIndex(cues, 4), 1)
  assert.equal(findActiveIndex(cues, 99), 2)
})

test('cue lookup returns -1 before the first cue', () => {
  const cues = buildCueList([{ id: 'a', text: 'a', time: 5 }], 0)
  assert.equal(findActiveIndex(cues, 2), -1)
})

test('out-of-order taps still resolve to the right active line', () => {
  const lines = [
    { id: 'a', text: 'a', time: 9 },
    { id: 'b', text: 'b', time: 2 },
  ]
  const cues = buildCueList(lines, 0)

  assert.equal(findActiveIndex(cues, 3), 1)
  assert.equal(findActiveIndex(cues, 10), 0)
})

test('untimed lines never become active', () => {
  const lines = [
    { id: 'a', text: 'a', time: null },
    { id: 'b', text: 'b', time: 1 },
  ]
  assert.equal(buildCueList(lines, 0).length, 1)
  assert.equal(findActiveIndex(buildCueList(lines, 0), 5), 1)
})

test('a negative offset drops cues that would land before the video starts', () => {
  const lines = [{ id: 'a', text: 'a', time: 1 }]
  assert.equal(buildCueList(lines, -3000).length, 0)
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
  const cues = buildCueList(timed([1, 3], [10, null]), 0)

  assert.equal(findActiveIndex(cues, 2.9), 0)
  assert.equal(findActiveIndex(cues, 3), -1, 'the gap between 3s and 10s shows no line')
  assert.equal(findActiveIndex(cues, 10), 1)
})

test('a line without an end holds until the next start, as before', () => {
  const cues = buildCueList(timed([1, null], [10, null]), 0)
  assert.equal(findActiveIndex(cues, 9.99), 0)
})

test('the last line with an end leaves the screen before the outro', () => {
  const cues = buildCueList(timed([1, null], [10, 14]), 0)
  assert.equal(findActiveIndex(cues, 13.9), 1)
  assert.equal(findActiveIndex(cues, 14), -1)
})

test('an end at or after the next start hands over with no gap', () => {
  const cues = buildCueList(timed([1, 12], [10, null]), 0)
  assert.equal(findActiveIndex(cues, 10), 1)
  assert.equal(resolveFrame(cues, 9.9).opacity, 1, 'no fade-out into an overlap')
})

test('gaps under 0.6s are ignored, so short breaths do not flicker', () => {
  const cues = buildCueList(timed([1, 9.5], [10, null]), 0)
  assert.equal(findActiveIndex(cues, 9.7), 0)
  assert.equal(resolveFrame(cues, 9.4).opacity, 1)
  assert.equal(resolveFrame(cues, 10.05).opacity, 1, 'and no fade-in after it')
})

test('an end at or before its start is ignored', () => {
  const cues = buildCueList(timed([5, 5], [10, null]), 0)
  assert.equal(findActiveIndex(cues, 7), 0)
})

test('the stack fades out into a gap and back in after it', () => {
  const cues = buildCueList(timed([1, 3], [10, null]), 0)

  assert.equal(resolveFrame(cues, 2).opacity, 1)
  near(resolveFrame(cues, 3 - FADE_SECONDS / 2).opacity, 0.5)
  assert.equal(resolveFrame(cues, 3).opacity, 0)
  assert.equal(resolveFrame(cues, 6).opacity, 0)
  near(resolveFrame(cues, 10 + FADE_SECONDS / 2).opacity, 0.5)
  assert.equal(resolveFrame(cues, 10 + FADE_SECONDS).opacity, 1)
})

test('during a gap the stack waits on the next line, so it fades in already in place', () => {
  const cues = buildCueList(timed([1, 3], [10, null]), 0)
  assert.deepEqual(resolveFrame(cues, 6), { activeIndex: -1, focusIndex: 1, opacity: 0 })
})

test('the intro is an empty frame once anything is timed', () => {
  const cues = buildCueList(timed([5, null]), 0)
  assert.deepEqual(resolveFrame(cues, 2), { activeIndex: -1, focusIndex: 0, opacity: 0 })
  near(resolveFrame(cues, 5 + FADE_SECONDS / 2).opacity, 0.5)
})

test('with nothing timed the stack stays parked and visible, so the look can be set', () => {
  const cues = buildCueList(timed([null, null]), 0)
  assert.deepEqual(resolveFrame(cues, 3), { activeIndex: -1, focusIndex: 0, opacity: 1 })
})

test('the offset moves ends along with starts', () => {
  const cues = buildCueList(timed([1, 3], [10, null]), 2000)
  assert.equal(findActiveIndex(cues, 4.9), 0)
  assert.equal(findActiveIndex(cues, 5), -1)
})

test('baking folds the offset into ends too, clamping at zero', () => {
  let state = loaded()
  state = projectReducer(state, { type: 'set-time', id: state.lines[0].id, time: 1 })
  state = projectReducer(state, { type: 'set-end', id: state.lines[0].id, end: 3 })
  state = projectReducer(state, { type: 'set-offset', offsetMs: -2000 })
  state = projectReducer(state, { type: 'bake-offset' })

  assert.deepEqual([state.lines[0].time, state.lines[0].end], [0, 1])
})

test('an end at or before the start is refused by the reducer', () => {
  let state = loaded()
  state = projectReducer(state, { type: 'set-time', id: state.lines[0].id, time: 5 })
  state = projectReducer(state, { type: 'set-end', id: state.lines[0].id, end: 5 })
  assert.equal(state.lines[0].end, null)

  state = projectReducer(state, { type: 'set-end', id: state.lines[0].id, end: 6 })
  assert.equal(state.lines[0].end, 6)
})

test('text edits and taps never touch an end', () => {
  let state = loaded()
  state = projectReducer(state, { type: 'set-time', id: state.lines[0].id, time: 1 })
  state = projectReducer(state, { type: 'set-end', id: state.lines[0].id, end: 3 })
  state = projectReducer(state, { type: 'set-text', id: state.lines[0].id, text: 'Hold on' })
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
