# Line end times and empty-frame gaps

## 1. Overview

### Summary

Every lyric line gets an end time next to its start time. Between one line's
end and the next line's start, the video shows no text: the lyric stack fades
out, the frame holds on the background, and the stack fades back in when the
next line begins.

### Problem

A line currently has one timestamp and stays on screen until the next line
starts. An instrumental break, a long intro, or the outro after the last line
all keep the previous lyric in view, well after it was sung. The `.txt`'s blank
lines between stanzas are dropped at import, so the file's own structure can't
fix this either.

### Intended users

Songwriters publishing demos, as in the MVP spec. They want to spend as little
time as possible on syncing, so this spec is written to work with automatic
alignment (see `docs/backlog.md`) as well as manual timing.

### Desired outcome

A line is on screen while it is sung and not after. Silence in the song reads
as silence in the video.

---

## 2. Goals and non-goals

### Goals

- Store an optional end time per line, carried through offset, bake, re-import
  and persistence exactly like the start time.
- Render gaps between lines as an empty frame, with the stack fading out and in.
- Keep today's behaviour for any line without an end time, so existing projects
  look the same after the change.

### Non-goals

- **Capturing end times from the keyboard during the sync pass.** Ends are
  meant to come from automatic alignment. Until that lands, they are typed or
  cleared in the line table. Space keeps stamping starts only.
- **Automatic alignment itself.** It's the consumer of this data model, and it
  has its own spike in the backlog.
- **A marker (note icon, dots) during long gaps.** Deferred until real renders
  show whether a long empty frame reads as a mistake. See the backlog.
- **Using blank lines in the `.txt`.** They stay dropped. Gaps now come from
  timing, not from the file layout.

### Success criteria

- A line with an end time is fully invisible within 0.25s after its end.
- A project saved before this change loads and renders identically.
- A 20s instrumental break between two timed lines renders as 20s of empty
  frame, minus the fades.

---

## 3. User experience

### Primary user stories

- As a songwriter, I want the last chorus line to leave the screen when I stop
  singing, not stay there for the whole outro.
- As a songwriter, I want an instrumental break to show nothing, so the video
  breathes with the song.
- As a songwriter, I want to correct one end time by typing it, without
  touching the start or the text.

### Main user flows

**Set an end by hand.** Type an end time into the line's End field
(`m:ss.cc` or plain seconds) → the preview updates on the next frame.

**Clear an end.** Empty the End field → the line falls back to staying on
screen until the next line starts.

**Recut demo.** Drag the global offset → starts and ends move together → bake
folds the offset into both.

### States and edge cases

| State | Behaviour |
|---|---|
| Line has no end | Visible until the next timed line starts, as today. The last line holds to the end of the audio. |
| Line has an end, next line starts later | Empty frame between the two. |
| End is at or after the next line's start | The next line takes over at its start. No gap, no fade. |
| Gap shorter than 0.6s | Treated as continuous. The stack stays visible, so short breaths don't flicker. |
| Before the first line's start | Empty frame. The intro reads as silence, same as any other gap. |
| End typed at or before the line's start | Rejected. The field shows the error and keeps the previous value. |
| Start cleared on a line that has an end | End is kept but ignored until the start is set again. |
| Negative offset pushes an end below 0 | That line is dropped from playback, as with starts today. Stored values untouched. |
| Seek or scrub into the middle of a gap | Frame is empty immediately. Visibility follows the audio clock, not an animation in progress. |

### UX notes

The End field sits next to the existing time field and works the same way:
same format, same parsing, same shortcuts disabled while it has focus.
Backspace on the cursor line clears both start and end, so "clear this line's
timing" stays one key.

The fade is part of the video, not interface motion. It renders the same
with or without a reduced-motion preference, because the preview has to match
the export (`decisions/0001`).

The progress bar stays visible during gaps. It's not lyric text, and it's the
one sign that the video is still running.

---

## 4. Functional requirements

1. A line is `{ id, text, time, end }`. `end` is seconds or `null`.
2. A line with a start is visible from `time` until whichever comes first: its
   `end`, or the next timed line's start. With no `end`, only the next start
   counts. The last line with no `end` holds to the end of the audio.
3. When no line is visible, the whole stack renders at zero opacity. The
   background and progress bar still render.
4. The stack fades out over 0.25s ending at `end`, and fades in over 0.25s
   starting at the next line's start. Opacity is a function of audio time.
5. A gap shorter than 0.6s between one line's `end` and the next start is
   ignored. The line stays visible until the next start.
6. The frame is empty before the first timed line's start.
7. While the stack is invisible, its scroll position jumps to the next line,
   so it fades in already in place, with no scroll during the fade.
8. The global offset applies to `end` on read, the same as `time`. Bake folds
   the offset into both, clamping at zero.
9. Re-importing a `.txt` carries `end` over by position, alongside `time`.
10. The line table has an editable End field per line, using the same parser
    as the time field. An end at or before the line's start is rejected.
11. Backspace/Delete on the cursor line clears both `time` and `end`.
12. `clear-times` clears both `time` and `end`.
13. Projects stored without `end` load with `end: null` on every line.

---

## 5. Non-functional requirements

- **Deterministic frames.** Visibility and fade opacity are pure functions of
  audio time and the line data. The same time always draws the same frame, so
  seeks, scrubs and the export all agree.
- **Performance.** The cue list is built once per line/offset change, as
  today. The per-frame lookup stays a binary search.
- **Accessibility.** The End field has a visible label and an accessible name
  that includes the line number. Validation errors are announced through the
  existing live region.

---

## 6. Information architecture and data

### Data entities

**Line** — `{ id: string, text: string, time: number | null, end: number | null }`

The field stays named `time` rather than `start`, so stored projects and
existing tests keep working without a migration.

### State changes

- `set-end` (new) writes `end` for one line by `id`. It's the only action
  besides `clear-times`, `bake-offset` and Backspace's clear that touches `end`.
- `stamp-cursor` writes `time` only and leaves `end` alone.
- Text actions never touch `time` or `end`, the same rule as the MVP.

### Persistence

Same `localStorage` key (`v1`). `end` is added on load when missing, so no
version bump is needed.

---

## 7. Technical approach

- **`src/state/project.js`:** cues carry `{ index, start, end }`, where `end`
  is the effective end after rule 2 and the 0.6s gap rule are applied. A new
  lookup returns the visible line index (or -1) plus a stack opacity for a
  given time. `findActiveIndex` keeps its role for the editor's highlight,
  but returns -1 during a gap.
- **`src/lib/renderFrame.js`:** takes a stack opacity and multiplies every
  block's alpha by it. When the opacity is 0, the scroll snaps to the next
  line's position instead of easing.
- **`src/components/LyricLines.jsx`:** adds the End field, reusing the time
  field's draft/parse/commit pattern.
- **`src/lib/tokenize.js`:** `buildLines` carries `end` over by position.

No new dependencies.

---

## 8. Interface and component breakdown

| Component | Change |
|---|---|
| `LyricLines` | New End column. Empty by default, same styling as the time column, error state on an invalid value. |
| `CanvasPreview` | Passes the stack opacity from the cue lookup to `renderFrame`. |
| `renderFrame` | Applies stack opacity; snaps the scroll while invisible. |

---

## 9. Risks, trade-offs, assumptions, and open questions

### Trade-offs

- **No keyboard capture for ends.** Until alignment exists, ends are typed by
  hand, which is slow for a whole song. This is deliberate: the sync pass
  stays one key, and the work on ends goes into alignment rather than a manual
  flow meant to be replaced.
- **Empty intro.** Projects with a long intro used to show the first line
  parked on screen. They now start on an empty frame. This matches the "no
  text in silence" rule, but it is a visible change for existing projects.

### Assumptions

- **0.25s fades and a 0.6s minimum gap** feel right at 30fps. Both are
  constants and should be tuned on a real song before this is marked done.
- **Alignment will produce line-level ends** from word timings (the last word's
  end). If it only produces starts, the manual End field becomes the main
  path, and keyboard capture needs revisiting.

### Open questions

- Should very long gaps show a marker? This is deferred and tracked in
  `docs/backlog.md`. It will be decided after watching real renders.

---

## 10. Acceptance criteria

- [ ] Lines store `end`, defaulting to `null`; old stored projects load with
      `end: null` and render as before.
- [ ] A line with an end is invisible within 0.25s after that end.
- [ ] The frame is empty before the first line and in any gap of 0.6s or more.
- [ ] Gaps under 0.6s do not fade.
- [ ] An end at or after the next start produces no gap.
- [ ] Seeking into a gap shows an empty frame on the first frame drawn.
- [ ] Offset shifts `end` on read; bake folds it into `end` and clamps at zero.
- [ ] Re-import carries `end` by position.
- [ ] Text edits and Space taps never change `end`.
- [ ] Backspace on the cursor line and `clear-times` clear both start and end.
- [ ] The End field rejects an end at or before the start, and announces why.
- [ ] Exported `.mp4` shows the same gaps as the preview.

---

## 11. Implementation plan

1. Data: `end` on lines, reducer actions, load defaults, re-import carry-over.
   Unit tests in `tests/project.test.js`.
2. Cue lookup: visible index and stack opacity as a pure function. Unit tests
   for gaps, overlaps, the 0.6s rule and offset.
3. Render: stack opacity and scroll snap in `renderFrame`.
4. Editor: End field in `LyricLines`, with validation and labelling.
5. Verify: e2e sync test extended with an end time and a gap; one export
   checked by eye against the preview.
