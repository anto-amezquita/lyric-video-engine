# New project

## 1. Overview

### Summary

A **New project** button in the Project section that clears everything and
returns the app to its blank, first-run state: no lyrics, no timestamps, no
audio, and the default look.

### Problem

The project autosaves to the browser on every change and is restored on load
(`docs/architecture.md` §7). That is right for a refresh, but it means the app
always opens on the last song, and the only ways out are loading another song
or a project file. The reducer already has a `reset` action; nothing in the
interface calls it.

### Intended users

The author, starting a new song after finishing another.

### Desired outcome

One click, after a confirmation, gives a clean slate that stays clean across a
reload.

---

## 2. Goals and non-goals

### Goals

- Start from a blank project without loading anything.
- Reset the look too, so a new song doesn't inherit the last song's colours,
  typeface or size.
- Never lose work by accident: confirm first, and leave the old song in
  Recent sessions.

### Non-goals

- Undo. There is none elsewhere in the product (`docs/architecture.md` §6).
- Deleting the old song's saved session. That is a separate item, "Let a
  session be deleted from the list" (`docs/backlog.md` #6).
- Keeping any part of the current look. Decided: everything returns to the
  defaults.

### Success criteria

- After New project, the app shows the empty state, and stays that way after a
  reload.
- The previous song is still listed in Recent sessions and opens as it was.

---

## 3. User experience

### Primary user stories

- As a songwriter, I start a new song from a clean project, so nothing from
  the last one leaks in.
- As a songwriter, I click it by mistake and get asked before anything is
  cleared.

### Main user flows

Project section → **New project** → confirm → lyrics, timestamps, audio and
look are cleared, playback stops, the preview shows the default background.

### States and edge cases

| State | Behaviour |
|---|---|
| Lyrics or audio loaded | Asks first. The message adds "The song stays in Recent sessions" only when lyrics are loaded, since that is what creates a session. |
| Cancelled | Nothing changes. |
| Already blank | No prompt; the click just resets to the same state. |
| Audio playing | Stopped and unloaded. |
| A load-project error message showing | Cleared. |
| Reload afterwards | Opens blank. |

### UX notes

A ghost button, first in the row, before Save and Load. Native `confirm`,
matching "Clear all timestamps".

---

## 4. Functional requirements

- `FR-01` The Project section has a **New project** button.
- `FR-02` If lyrics or audio are loaded, the button asks for confirmation
  before doing anything.
- `FR-03` Confirming dispatches `reset`, which returns no lines, no lyrics
  name, cursor 0 and `DEFAULT_STYLE`.
- `FR-04` Confirming also unloads the audio and stops playback; duration reads
  as 0 until new audio is picked.
- `FR-05` The blank state is autosaved like any other, so a reload stays
  blank.
- `FR-06` No session is created or changed by a reset. The previous song's
  session is untouched.

---

## 5. Non-functional requirements

- **Local-first.** No network involved.
- **Accessibility.** A native button with a text label; the confirmation is
  the browser's own dialog.

---

## 6. Information architecture and data

No new data. `reset` returns `initialProject` with an empty `lines` array,
which carries `DEFAULT_STYLE`.

---

## 7. Technical approach

### Frontend responsibilities

- `src/App.jsx` — the button and `newProject` handler: confirm, clear audio,
  dispatch `reset`, clear the load message.
- `src/hooks/useAudioEngine.js` — new `clearAudio`. Removing the `src`
  attribute alone leaves the element playing what it already loaded, so it
  pauses, removes `src` and calls `load()`, then clears the file. `duration`
  is reported as 0 when there is no file.

### Reused systems

The `reset` reducer case, the ghost button row, and the existing confirm
pattern.

### New technical work

`clearAudio`, the handler and button, and one reducer test.

---

## 8. Interface and component breakdown

### New project button (in `App.jsx`)

- **Purpose:** Return to a blank project.
- **Outputs:** `clearAudio()`, `reset` dispatch.
- **States:** default. Always enabled.
- **Accessibility notes:** Native button.

---

## 9. Risks, trade-offs, assumptions, and open questions

### Risks

- The confirmation is the only safeguard, and there is no undo. Recent
  sessions is the safety net, but only for a song that had lyrics loaded.
- `clearAudio` reaches into the audio element directly. If a browser behaves
  differently, old audio could keep playing. Not yet checked by hand.

### Trade-offs

- Resetting the look too means a favourite colour setup has to be re-picked.
  Decided in favour of a truly blank start.

### Assumptions

- The Web Audio node the exporter attaches to the audio element stays
  connected and works with the next file, as it does when a new file is picked
  today.

### Open questions

- None.

---

## 10. Acceptance criteria

- [x] A reducer test covers `reset`: empty lines, no lyrics name, cursor 0,
      default look.
- [x] `npm test` (57 of 57) and `npm run lint` (0 errors, the same 3 existing
      warnings) pass.
- [ ] The button asks first and does nothing on cancel.
- [ ] Confirming empties the lyrics, timestamps and audio, stops playback,
      and shows the default look.
- [x] After a reload the app is still blank.
- [ ] The cleared song is still in Recent sessions and opens as it was.
- [ ] Picking new lyrics and audio afterwards works, and an export still
      records audio.

---

## 11. Implementation plan

### Phase 1 — Foundations

`clearAudio` and the derived duration. *Built.*

### Phase 2 — Core functionality

The button, confirmation and `reset` dispatch. *Built.*

### Phase 3 — States and edge cases

Conditional confirmation text; clearing the load message. *Built.*

### Phase 4 — Polish

None planned.

### Phase 5 — Validation and release

Tests and lint pass. Remaining: the by-hand checks above.
