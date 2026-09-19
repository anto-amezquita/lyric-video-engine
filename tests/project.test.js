import assert from 'node:assert/strict'
import test from 'node:test'
import { buildLines, tokenizeLyrics } from '../src/lib/tokenize.js'
import { formatTime, parseTime } from '../src/lib/time.js'
import {
  buildCueList,
  effectiveTime,
  findActiveIndex,
  initialProject,
  projectReducer,
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
