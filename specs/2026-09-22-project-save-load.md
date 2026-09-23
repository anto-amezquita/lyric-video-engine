# Project save/load as a portable file

## 1. Overview

### Summary

Explicit "Save project" and "Load project" controls that write and read the
whole project — lines, timestamps, offset, style — as a `.json` file the user
keeps themselves, alongside the existing `localStorage` autosave.

### Problem

The project already survives a reload in the same browser via `localStorage`
(see `docs/architecture.md` §7). That covers one browser, one project, one
machine. It doesn't cover:

- Two songs in flight at once — the storage key is singular, so opening a
  second song's lyrics overwrites the first's sync work.
- A different browser, a different machine, or a cleared browser profile —
  `localStorage` isn't a backup.
- Handing a project to a future session deliberately — there's nothing to
  attach to an email, drop in the song's folder, or commit.

### Intended users

The author, working on more than one song across sessions and machines — the
same audience as the rest of the product (`docs/product-north-star.md`).

### Desired outcome

A finished or in-progress sync pass can be saved to a file the user controls,
and that file loads back into an exact copy of the project it was saved from
— lines, timestamps, offset, and look, in one step. Audio is still re-picked
separately, same as today's reload behaviour.

---

## 2. Goals and non-goals

### Goals

- Save the current project to a downloaded `.json` file, on demand.
- Load a previously saved `.json` file back into the app, replacing the
  current project.
- Keep the existing `localStorage` autosave exactly as it behaves today —
  this is additive, not a replacement.

### Non-goals

- Matching the loaded project against the currently-picked audio or lyrics
  file by name. The user is responsible for pairing the right files; nothing
  here validates that a loaded project's `lyricsName` matches what's on
  screen.
- Multiple projects open at once, tabs, or a project browser. One project is
  active at a time, same as today.
- Any cloud storage, account, or sync. The file lives wherever the user's
  filesystem puts a download — that's the whole mechanism.
- Migrating an old project file's shape forward. See §9.

### Success criteria

- Saving, then loading the same file back, reproduces the project exactly:
  every line's text, `time`, `end`, plus `offsetMs` and `style`.
- A file that isn't a project this version understands is rejected with a
  message, not a silent partial load or a crash.

---

## 3. User experience

### Primary user stories

- As a songwriter, I save my sync pass on Copycat before switching to sync a
  different song, so neither project overwrites the other.
- As a songwriter, I reopen a project on a different laptop by loading the
  `.json` file I saved earlier, then re-pick the audio.
- As a songwriter, I keep a project file next to the song's `.txt` and `.wav`
  as the record of the sync work, independent of any one browser.

### Main user flows

**Save.** Click "Save project" → the browser downloads
`<song-name>.lve-project.json`.

**Load.** Click "Load project" → pick a `.json` file → the project (lines,
offset, style, lyrics name) replaces whatever was open → the audio file is
re-picked separately, exactly as after a page reload.

### States and edge cases

| State | Behaviour |
|---|---|
| Save with no lyrics loaded | Allowed — saves an empty project. Low-value but harmless; not worth a disabled state. |
| Load a valid file | Project replaces the current one; cursor resets to 0. |
| Load a file with no `version` field, or the wrong one | Rejected. Status message names it; nothing changes. |
| Load a file that isn't JSON, or has no `lines` array | Rejected, same message. |
| Load while mid-sync on an unsaved project | The unsaved project is simply replaced — there is no prompt. `localStorage` still holds it until the next autosave overwrites it, but nothing surfaces that safety net; see §9. |

### UX notes

Both controls sit together in a new "Project" section, above "Source", styled
like the existing ghost-button rows already in the app. The hint text under
them is explicit that audio is not part of the file, so the user isn't
surprised when they still have to re-pick it.

---

## 4. Functional requirements

1. "Save project" serializes `{ version, lines, offsetMs, lyricsName, style,
   audioName }` to indented JSON and downloads it via the existing
   `downloadBlob` helper. `audioName` is the currently-picked audio file's
   name, included for the human reading the file later — never read back on
   load.
2. The filename is `${safeFilename(lyricsName ?? audioFile?.name)}.lve-project.json`,
   reusing the existing `safeFilename` helper.
3. "Load project" opens a `.json` file picker, reads the file as text, and
   parses it with the same normalization `loadStoredProject` already applies
   (missing `end` defaults to `null`, `style` merges over `DEFAULT_STYLE`,
   `cursor` resets to 0).
4. A file is accepted only if its `version` matches the app's current project
   file version and `lines` is an array. Anything else is rejected with a
   status message; the current project is left untouched.
5. Loading a valid file dispatches one reducer action that replaces the whole
   project in a single update — not a merge with what's currently open.
6. The existing `localStorage` autosave (`storeProject`, on every project
   change) is unaffected by any of the above.

---

## 5. Non-functional requirements

- **Local-first.** No network request of any kind; the file never leaves the
  browser except via the user's own download/pick action. Matches
  `docs/product-north-star.md` principle 5.
- **Accessibility.** The load control is a real file input (hidden, reachable
  via a labelled button), same pattern as the existing Lyrics/Audio
  `FileDrop`. The rejection message is announced through a status region,
  same pattern as `LyricLines`' validation message.

---

## 6. Information architecture and data

### Data entities

**Project file** — `{ version: number, lines: Line[], offsetMs: number,
lyricsName: string | null, style: Style, audioName: string | null }`.
`version` starts at `1`. `Line` and `Style` are the same shapes already
defined in `docs/architecture.md` §6 — this feature introduces no new fields
on either.

### State changes

One new reducer action, `load-project`, which replaces the entire project
state with a parsed file's contents in one step. No existing action changes.

### Persistence

Two independent persistence paths after this change:

- `localStorage`, key `lyric-video-engine/project/v1`, autosaved on every
  change — unchanged.
- A `.json` file, written and read only when the user explicitly clicks Save
  or Load — new.

They share the same shape and the same normalization logic, but not the same
trigger, and not the same version field (the `localStorage` payload still has
no `version` field of its own; its versioning stays in the storage key name,
per the existing convention in `docs/architecture.md` §7).

---

## 7. Technical approach

### Proposed architecture

`src/state/project.js` gains the serialize/parse pair and owns the new
`version` constant, consistent with it already owning everything that
persists (`docs/architecture.md` §4). The existing normalization logic inside
`loadStoredProject` is factored into a shared `projectFromPayload` helper so
`localStorage` load and file load can't drift apart.

### Frontend responsibilities

- `src/state/project.js` — `PROJECT_FILE_VERSION`, `serializeProjectFile`,
  `parseProjectFile`, the `load-project` reducer case.
- `src/App.jsx` — the "Project" section's two controls, wiring Save to
  `downloadBlob` and Load to a hidden file input + `FileReader`, matching the
  existing `loadLyrics` pattern already in the file.

### Reused systems

`downloadBlob` (`src/lib/recorder.js`), `safeFilename` (already local to
`App.jsx`), the hidden-input-plus-button pattern already used for Lyrics and
Audio (`FileDrop`), and the status-message pattern already used in
`LyricLines`.

### New technical work

The serialize/parse pair, the `load-project` action, and the small new
section in `App.jsx`. No new dependency, no new component library usage.

---

## 8. Interface and component breakdown

### Project section (in `App.jsx`, no new component file)

- **Purpose:** Save and load the whole project as a portable file.
- **Inputs:** the current `project` state; a picked `.json` file.
- **Outputs:** a downloaded file; a `load-project` dispatch; a status message
  on rejection.
- **States:** default, load-rejected (status message shown).
- **Accessibility notes:** hidden file input reachable via a labelled ghost
  button, same as existing `FileDrop` usage; rejection announced via a status
  region.
- **Dependencies:** `downloadBlob`, `safeFilename`, `serializeProjectFile`,
  `parseProjectFile`.

---

## 9. Risks, trade-offs, assumptions, and open questions

### Risks

- Loading a file silently discards an unsaved in-progress project (still
  recoverable from `localStorage` until the next autosave, but nothing in the
  UI says so). Accepted for now — this product has no undo anywhere else
  either (`docs/architecture.md` §6: "deletes are immediate; there is no
  undo").

### Trade-offs

- No migration path for a future shape change to the project file — a v2
  file and a v1 app simply reject each other. Consistent with how
  `localStorage` is already versioned (new key, no migration) per
  `docs/architecture.md` §7.

### Assumptions

- One project file per song is enough; no manifest of "recent projects" is
  needed, since the user is already managing these files in their own
  filesystem alongside the song.

### Open questions

- Should loading a project whose `lyricsName` doesn't match the currently
  loaded `.txt` warn the user? Deferred — out of scope per §2, revisit if it
  causes a real mix-up.

---

## 10. Acceptance criteria

- [ ] Save downloads a `.json` file named after the lyrics (or audio)
      filename, ending `.lve-project.json`.
- [ ] The saved file round-trips through Load back to an identical project:
      every line's `text`, `time`, `end`; `offsetMs`; `style`.
- [ ] Loading a file with a missing or mismatched `version`, invalid JSON, or
      no `lines` array is rejected with a status message and changes
      nothing.
- [ ] `localStorage` autosave behaviour is unchanged — verified by the
      existing `loadStoredProject` tests still passing untouched.
- [ ] `npm test` passes, including new tests for `serializeProjectFile` /
      `parseProjectFile` and the `load-project` reducer case.

---

## 11. Implementation plan

### Phase 1 — Foundations

`PROJECT_FILE_VERSION`, `projectFromPayload` extraction, `serializeProjectFile`,
`parseProjectFile`, `load-project` reducer case. Unit tests.

### Phase 2 — Core functionality

The "Project" section in `App.jsx`: Save button, Load button + hidden input,
status message on rejection.

### Phase 3 — Validation

Confirm round-trip fidelity (including `end: null` lines, a non-zero offset,
and a non-default `style`) and rejection paths by hand against `npm test` and
a manual save/load pass.
