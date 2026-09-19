# Lyric Video Engine — MVP

## 1. Overview

### Summary

A local-first browser tool that turns a raw lyric `.txt` and a demo `.wav` into a
9:16 vertical lyric video, exported as an `.mp4` ready for social. Nothing is
uploaded: tokenisation, sync, rendering, and encoding all happen in the tab.

### Problem

Syncing lyrics to a demo is quick the first time and miserable every time after.
Demos get recut — a bar of intro silence added, a verse trimmed — and in most
tools the sync work is welded to the text, so a typo fix or a new cut means
starting the pass again.

### Intended users

Songwriters and small labels publishing demos to social, working alone, on
material that changes between sessions.

### Desired outcome

One sync pass survives both a corrected lyric sheet and a recut demo. Export is
a single click and produces a file that uploads without conversion.

---

## 2. Goals and non-goals

### Goals

- Tokenise a raw `.txt` into line-level blocks with no formatting rules to learn.
- Sync a whole song in one playthrough, from the keyboard.
- Keep timestamps intact when the lyric text changes.
- Absorb a recut demo with a single global time-shift.
- Export H.264/AAC `.mp4` at 1080×1920 from the browser.

### Non-goals

- Word-level or syllable-level sync. Line level only.
- Background video, images, or per-line animation authoring.
- Accounts, cloud storage, or sharing.
- Batch export across multiple songs.
- Automatic sync from audio analysis.

### Success criteria

- A four-minute song can be synced in one playthrough without touching the mouse.
- Re-importing a corrected `.txt` keeps every timestamp whose line kept its position.
- A demo recut with 1.2s more intro silence is corrected by one offset value.
- Export produces a file that decodes as H.264 video plus AAC audio at 1080×1920.

---

## 3. User experience

### Primary user stories

- As a songwriter, I drop in lyrics and a demo and tap Space through the song,
  so the sync is done by the time the track ends.
- As a songwriter, I fix a typo in line 9 without losing line 9's timestamp.
- As a songwriter, I receive a recut demo and shift every line at once instead
  of re-syncing.
- As a songwriter, I export a vertical `.mp4` and upload it directly.

### Main user flows

**Sync pass.** Load `.txt` → load `.wav` → press K to play → tap Space as each
line lands; the cursor advances on its own → tap again over any line to
overwrite it.

**Recut demo.** Load the new `.wav` → drag the global offset until the first
line lands → optionally bake the offset into the stored timestamps.

**Text correction.** Edit a line in place, or re-import the corrected `.txt`;
timestamps carry over by line position.

**Export.** Press Export → the canvas records one realtime pass from the top →
the `.mp4` downloads.

### States and edge cases

| State | Behaviour |
|---|---|
| No lyrics | Line list shows an empty state; export disabled with the reason. |
| No audio | Transport disabled; export disabled with the reason. |
| Lyrics but no stamps | Preview renders the stack parked on line 1; export disabled. |
| Untimed lines mid-song | Laid out and dimmed, never become active. |
| Out-of-order stamps | Cue list is sorted on read, so the right line still activates. |
| Negative offset pushes a line before 0 | That cue is dropped from playback; the stored value is untouched. |
| Browser cannot record MP4 | Falls back to WebM plus in-browser conversion; the UI names which. |
| Conversion fails | The raw `.webm` stays downloadable rather than losing the take. |
| Reload mid-project | Lines, stamps, offset and style restore; the audio file is re-picked. |

### UX notes

Space is the tap key, not play/pause — it is the key pressed hundreds of times
per song, so it gets the biggest target. Play/pause moves to K. All shortcuts go
quiet while a text field has focus, so typing a lyric containing spaces cannot
stamp anything.

---

## 4. Functional requirements

1. Accept a `.txt` file; split on newlines, trim, drop blank lines.
2. Accept a `.wav` (and other browser-decodable audio) as the master clock.
3. Store lines as `{ id, text, time }`; `time` is seconds or `null`.
4. Text edits address a line by `id` and change `text` only.
5. Re-import matches by position and carries `time` and `id` over.
6. A global offset in milliseconds applies on read; "Bake in" folds it into the
   stored timestamps and resets it to zero.
7. Space stamps the cursor line at `audio.currentTime` minus the current offset,
   then advances the cursor. Tapping an already-stamped line overwrites it.
8. Backspace clears the cursor line's timestamp; arrow keys move the cursor and
   seek the audio.
9. Timestamps are editable directly as `m:ss.cc` or plain seconds.
10. Canvas renders 1080×1920, active line at full opacity and scale, neighbours
    dimming with distance.
11. Export records the canvas at 30fps with the audio track muxed in, and
    downloads an `.mp4`.

---

## 5. Non-functional requirements

- **Local-first.** No network requests at runtime beyond the web font. The
  ffmpeg.wasm core is served from the app's own bundle.
- **Performance.** Text wrapping is measured once per text/style change, not per
  frame. Per-frame updates bypass React state, so the editor stays responsive
  while the canvas runs at 60fps.
- **Accessibility.** Every control is keyboard reachable and labelled; focus is
  visible; the destructive clear is confirmed; status messages use a live region.
- **Privacy.** Audio and lyrics never leave the browser.

---

## 6. Information architecture and data

### Data entities

**Line** — `{ id: string, text: string, time: number | null }`

**Project** — `{ lines: Line[], offsetMs: number, cursor: number, lyricsName: string | null, style: Style }`

**Style** — `{ fontScale, align, uppercase, accentActive, showProgress }`

### State changes

All writes go through `projectReducer`. Timestamps are only ever written by
`set-time`, `stamp-cursor`, `clear-times` and `bake-offset` — never by a text
action. That separation is what the decoupling requirement reduces to, and it is
covered by tests.

### Persistence

The project is written to `localStorage` on change. The audio `File` cannot be
serialised, so it is re-picked after a reload.

---

## 7. Technical approach

### Proposed architecture

`audio.currentTime` is the only clock. One `requestAnimationFrame` loop reads it
and pushes the value to subscribers — the canvas, the transport readout, the
active-line highlight. Nothing keeps a parallel timer, so nothing can drift.

### Frontend responsibilities

- `src/state/project.js` — reducer, cue list, active-line lookup, persistence
- `src/hooks/useAudioEngine.js` — audio element, Web Audio graph, clock
- `src/hooks/useSyncShortcuts.js` — keyboard sync pass
- `src/hooks/useExport.js` — record, convert, download
- `src/lib/renderFrame.js` — layout and canvas drawing
- `src/lib/recorder.js` — format selection and `MediaRecorder` wiring
- `src/lib/convert.js` — lazy ffmpeg.wasm remux/transcode

### Backend responsibilities

None. There is no backend.

---

## 8. Interface and component breakdown

| Component | Purpose |
|---|---|
| `FileDrop` | Click-or-drop intake for one file type; its label is the empty state. |
| `Transport` | Play/pause, seek, scrub. Owns its own readout state at ~10Hz. |
| `LyricLines` | The editable line table. Rows are memoised. |
| `OffsetPanel` | Global time-shift: slider, numeric field, nudges, reset, bake. |
| `LookPanel` | Text size, alignment, uppercase, accent, progress bar. |
| `CanvasPreview` | The 9:16 canvas — also the surface the exporter records. |
| `ExportPanel` | Export trigger, progress, and what the pipeline is doing. |

---

## 9. Risks, trade-offs, assumptions, and open questions

### Trade-offs

- **Realtime export.** A four-minute song takes four minutes to record. The
  alternative — rendering frames offscreen and encoding them — is faster but
  decouples the export from the preview. Recording the previewed canvas means
  what was approved is exactly what downloads. See `decisions/0001`.
- **Line-level sync only.** Word-level would look better and cost far more to
  author. Line level is what a demo pass can realistically sustain.

### Risks

- **Background tabs throttle `requestAnimationFrame`**, which would freeze frames
  mid-recording. Mitigated by telling the user to keep the tab visible; not
  prevented.
- **VP8/VP9 transcode is slow.** Browsers that cannot record H.264 need a full
  re-encode through single-threaded wasm. The UI warns before it starts and the
  raw recording stays downloadable if it fails.

### Assumptions

- Lyric files are one line per lyric line, with blank lines between stanzas.
- Line order does not change between demo versions. Reordered lines lose their
  carry-over, since matching is positional.

### Open questions

- ~~Should stanza breaks (blank lines) carry visual weight in the render?~~
  Resolved: gaps come from per-line end times and render as an empty frame.
  Blank lines stay dropped. See `specs/2026-09-19-line-end-times-and-gaps.md`.
- Is a fixed 30fps right, or should 60fps be offered for text-heavy songs?

---

## 10. Acceptance criteria

- [x] `.txt` tokenises to line-level blocks, blanks dropped.
- [x] `.wav` loads and drives playback.
- [x] Text edits preserve line index, id and timestamp.
- [x] Re-import carries timestamps over by position.
- [x] Global offset shifts playback without rewriting stored timestamps.
- [x] Bake folds the offset in exactly once and clamps at zero.
- [x] Space stamps the cursor line and advances; re-tapping overwrites.
- [x] Shortcuts do not fire while a text field has focus.
- [x] Canvas renders 1080×1920 with the active line emphasised.
- [x] Export downloads an `.mp4` that decodes as H.264 + AAC at 1080×1920.
- [x] Project state survives a reload.

---

## 11. Implementation plan

All five phases are complete for the MVP. Remaining work is tracked in
`docs/backlog.md`.
