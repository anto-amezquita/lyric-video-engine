# Constant-frame-rate export

## 1. Overview

### Summary

An opt-in checkbox under the export button, "Constant frame rate, for DaVinci
Resolve and other editors". When on, the export is re-encoded at a fixed 30fps
so editors can open it.

### Problem

An exported `.mp4` played in QuickTime but showed "Media Offline" in the free
version of DaVinci Resolve on a Mac. The suspected cause was variable frame
rate, which a browser recording has and editors often refuse. The `direct` and
`remux` routes (`decisions/0001`) pass that through untouched.

**Outcome (2026-10-01).** That suspicion was wrong. The option did not change
the result, and the clip opened once it was deleted from the Resolve project
and imported again from the same folder: a lost file link, not a file problem.
The option stays as an opt-in safeguard for other editor issues that variable
frame rate can cause, which is untested here.

### Intended users

The author, bringing an exported lyric video into an editor.

### Desired outcome

An export that opens in Resolve, made without leaving the app or installing
`ffmpeg`.

---

## 2. Goals and non-goals

### Goals

- A switch that makes any export constant frame rate.
- Keep the fast, no-conversion paths as the default.
- Remember the choice across songs and reloads.

### Non-goals

- Always re-encoding. That is slow and downloads the 32MB wasm core.
- ProRes or DNxHR output.
- Changing the recorded frame rate, or the realtime recording itself.
- A fix for anything in Resolve other than variable frame rate.

### Success criteria

- With it off, exports behave exactly as before.
- With it on, the export is a constant 30fps H.264 file. (The original goal,
  fixing Resolve's "Media Offline", did not apply: see the outcome above.)

---

## 3. User experience

### Primary user stories

- As a songwriter, I tick the box once and my exports open in Resolve.
- As a songwriter uploading to social, I leave it off and keep fast exports.

### Main user flows

Tick the checkbox, press **Export .mp4**, wait for the realtime recording and
then the re-encode, and the file downloads.

### States and edge cases

| State | Behaviour |
|---|---|
| Option off | Unchanged: `direct` downloads as is, `remux` repackages, `transcode` re-encodes. |
| Option on | Every route ends in a full re-encode at 30fps, with a message that says so. |
| Option on, `direct` route | The browser's MP4 is converted, not downloaded as is. |
| Recording or converting | The checkbox is disabled. |
| Conversion fails | The original recording stays downloadable, as `.mp4` or `.webm` to match. |
| Reload or a new song | The choice is remembered. |
| Storage unavailable | It still works for the session and isn't remembered. |

### UX notes

The label states the cost, "(adds a few minutes)". The fallback button reads
"Download original recording", since the file may now be an MP4.

---

## 4. Functional requirements

- `FR-01` The export panel has a checkbox, off by default.
- `FR-02` With it on, the video is resampled with `fps=30` and encoded as H.264
  at CRF 18, with AAC audio at 192k.
- `FR-03` With it on, the `remux` shortcut and the `direct` download are skipped.
- `FR-04` The choice is saved in its own `localStorage` key and read on load.
- `FR-05` The checkbox is disabled while an export is running.
- `FR-06` A failed conversion keeps the original recording with its real
  extension (`.mp4` for `direct`, `.webm` otherwise).

---

## 5. Non-functional requirements

- **Performance.** The re-encode adds minutes and loads the wasm core. That is
  why it is opt-in.
- **Local-first.** Nothing leaves the browser.
- **Accessibility.** A native labelled checkbox.

---

## 6. Information architecture and data

One boolean in `localStorage` under `lyric-video-engine/export-constant-frame-rate`
(`'1'` or `'0'`). It is not part of the project or a session.

---

## 7. Technical approach

- `src/lib/convert.js` — `constantFrameRate` option; `-vf fps=30`; the input is
  named by route so an MP4 input is accepted.
- `src/hooks/useExport.js` — routes on the option, shows its message, keeps
  the fallback as `{ blob, extension }`.
- `src/components/ExportPanel.jsx` — the checkbox.
- `src/App.jsx` — holds and stores the setting.
- `e2e/export.test.mjs` — one new route test.

---

## 8. Interface and component breakdown

### Constant-frame-rate checkbox (in `ExportPanel`)

- **Purpose:** Choose an editor-friendly export.
- **Inputs:** the saved setting; whether an export is running.
- **Outputs:** the new value.
- **States:** off, on, disabled.
- **Accessibility notes:** a `label` wraps the input.

---

## 9. Risks, trade-offs, assumptions, and open questions

### Risks

- Variable frame rate was not what Resolve objected to. Confirmed: the option
  made no difference to the "Media Offline" problem.
- A second lossy encode. Expected to be invisible at CRF 18 on flat graphics.
- A full song takes minutes in ffmpeg.wasm. Measured at about 5 minutes on
  the author's Mac.

### Trade-offs

- Opt-in keeps fast exports fast, at the cost of one more thing to remember.

### Assumptions

- A constant 30fps H.264 file is what Resolve needs.

### Open questions

- Does it open in Resolve? Answered: the file opened once the lost link was
  fixed, with or without the option.
- Should it default to on for this author, since they edit every export?

---

## 10. Acceptance criteria

- [x] The checkbox is off by default and the default routes are unchanged.
- [x] The fallback download keeps the right extension.
- [x] `npm test` (67 of 67) and `npm run lint` (0 errors, the same 3 existing
      warnings) pass.
- [x] `npm run test:e2e` passes (14 of 14), including the new route test.
- [ ] With the option on, an export plays in QuickTime.
- [x] With the option on, the export opens in free DaVinci Resolve. (It did,
      but only after re-importing the clip; the option was not the cause.)
- [ ] The choice survives a reload.

---

## 11. Implementation plan

### Phase 1 — Foundations

`constantFrameRate` in `convertToMp4`. *Built.*

### Phase 2 — Core functionality

Routing in `useExport`, the checkbox, the remembered setting. *Built.*

### Phase 3 — States and edge cases

The fallback extension; the disabled state while running. *Built.*

### Phase 4 — Polish

Time a full song (about 5 minutes, measured). Consider defaulting to on. Not
started.

### Phase 5 — Validation and release

Run tests, lint and the e2e suite, then export a real song with the option on
and open it in Resolve.
