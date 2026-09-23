# Recent sessions: audio persistence beyond a reload

## 1. Overview

### Summary

Audio survives a reload, and every song synced is kept as a re-openable
session — lyrics, timestamps, offset, style, and its audio — in IndexedDB,
listed at the bottom of the app.

### Problem

`localStorage` autosave (today's persistence) has two real gaps:

- The audio `File` can't be serialized into `localStorage`, so it is dropped
  on every reload — the user re-picks it every time, even for the exact same
  song, seconds after closing the tab.
- Only one project fits at a time (`STORAGE_KEY` is singular). Starting a
  second song overwrites the first's sync work in place, with no way back.

### Intended users

The author, moving between songs and sessions — same audience as the rest of
the product.

### Desired outcome

Reloading the tab restores the audio that was loaded, not just the lyrics and
timing. Every song worked on is listed and one click away from being exactly
where it was left, audio included.

---

## 2. Goals and non-goals

### Goals

- Persist audio bytes (not just the `File` reference) so a reload restores
  them automatically.
- Keep a session per song, keyed by the lyrics file's name: reopening the
  same name updates that song's session rather than duplicating it.
- List every session, most recently updated first, at the bottom of the app;
  clicking one reopens it — lines, timing, offset, style, and audio.
- Keep the existing `localStorage` "current project" autosave and the
  `.json` Save/Load project file (`decisions/0002` is unrelated;
  `specs/2026-09-22-project-save-load.md`) exactly as they are — this is
  additive.

### Non-goals

- A cap on session count. Explicitly unbounded per product decision.
- Deleting a session from the list. Not requested; a real gap once the list
  grows long, tracked as an open question (§9).
- Deduplicating sessions that happen to share the same audio file across two
  differently-named lyric sheets. Identity is the lyrics file name only.
- Any account, cloud backup, or cross-device sync. IndexedDB is local to one
  browser profile, same locality guarantee as everything else in this
  product.

### Success criteria

- Reloading the tab with a song loaded restores that song's audio with no
  user action.
- A second song's session does not touch the first's.
- The session list shows every song worked on, sorted by recency, and
  reopening one restores it exactly, audio included.

---

## 3. User experience

### Primary user stories

- As a songwriter, I reload the tab mid-session and the audio is still
  there — I don't re-pick it.
- As a songwriter, I switch from syncing Copycat to a different song, then
  come back to Copycat later by clicking it in the session list — everything
  is exactly as I left it.

### Main user flows

**Reload.** Reopen the tab → lines, timing, offset and style restore from
`localStorage` as today → the matching session's audio is looked up by the
restored `lyricsName` and loaded automatically, with no button to press.

**Switch songs.** Load a different song's `.txt` and `.wav` → sync as usual →
the previous song's session is untouched in IndexedDB; the new song gets (or
updates) its own.

**Reopen from the list.** Click a session at the bottom of the app → that
song's lines, timing, offset, style and audio replace whatever is currently
open.

### States and edge cases

| State | Behaviour |
|---|---|
| Reload with no `lyricsName` restored (empty project) | Nothing to look up; no audio auto-load attempt. |
| Reload where the audio was never saved as a session (e.g. `localStorage` restored a project older than this feature) | No matching session; the user re-picks audio as before. Not an error. |
| Reopening a session while a different, unsaved change is in progress on the current one | The current one is simply replaced. No prompt — same as `.json` Load project (`specs/2026-09-22-project-save-load.md` §3), and it's still in `localStorage` until the next autosave overwrites it. |
| IndexedDB unavailable or blocked (private mode, disabled storage) | Session history and audio persistence are silently unavailable; the rest of the app is unaffected. Same posture as `localStorage` failures already in this codebase. |
| Same lyrics file name loaded for what is actually a different song | Overwrites that name's existing session. Accepted — see Non-goals. |

### UX notes

The session list lives in its own strip at the very bottom of the app,
outside the two-pane layout — a horizontally scrolling row of compact
entries (song name, relative "updated" time), since it can grow without
bound. The currently open song's entry is visually marked.

---

## 4. Functional requirements

1. Two IndexedDB object stores, both keyed by the lyrics file name
   (`id`): `sessions` (lines, offsetMs, style, lyricsName, audioName,
   updatedAt — no audio bytes) and `sessionAudio` (the audio blob, its MIME
   type, its file name).
2. Every project change with a `lyricsName` set writes (or overwrites) that
   song's `sessions` record. This runs alongside, not instead of, the
   existing `localStorage` autosave.
3. Every time the audio file changes (a new pick, or a restore), and a
   `lyricsName` is set, the audio bytes are written to `sessionAudio` under
   that name.
4. On mount, if the `localStorage`-restored project has a `lyricsName` and no
   audio is yet loaded, the matching `sessionAudio` record (if any) is
   fetched and set as the audio file automatically.
5. The session list is fetched on mount and refreshed after every session
   save, sorted by `updatedAt` descending.
6. Clicking a session in the list dispatches a full project replacement
   (reusing the same reducer path as `.json` Load project) and asynchronously
   loads that session's audio, if any.
7. Any IndexedDB failure degrades silently — the app functions exactly as it
   did before this feature, minus the persistence.

---

## 5. Non-functional requirements

- **Local-first.** IndexedDB only; nothing about this feature makes a
  network request. Matches `docs/product-north-star.md` principle 5.
- **Storage cost.** Unbounded by explicit product decision. A WAV-heavy
  practice means real disk usage grows without limit; accepted per §2.
- **Accessibility.** Each session entry is a real button with an accessible
  name combining the song name and its relative update time.

---

## 6. Information architecture and data

### Data entities

**Session** (`sessions` store) — `{ id: string, lyricsName: string,
audioName: string | null, lines: Line[], offsetMs: number, style: Style,
updatedAt: number }`. `id` is the lyrics file name.

**Session audio** (`sessionAudio` store) — `{ id: string, blob: Blob, type:
string, name: string | null }`. Same `id` as the matching session.

`Line` and `Style` are unchanged from `docs/architecture.md` §6.

### State changes

No new reducer action beyond `load-project`, already added in
`specs/2026-09-22-project-save-load.md`. Session persistence itself lives
outside the reducer, in `src/lib/sessions.js` and the effects that call it.

### Persistence

Three independent persistence paths coexist after this change:

- `localStorage` — current project, autosaved, unchanged.
- `.json` project file — explicit Save/Load, unchanged.
- IndexedDB — every session ever synced, keyed by lyrics file name, plus its
  audio. New.

---

## 7. Technical approach

### Proposed architecture

`src/lib/sessions.js` is a thin, try/catch-guarded IndexedDB wrapper —
consistent with how `localStorage` access is already guarded in
`src/state/project.js` (`docs/architecture.md` §9: "persistence is a
convenience, not a feature"). Two pure helpers, `sessionId` and
`sessionRecord`, contain the only logic worth unit testing directly; the rest
is DOM-only and untested under `node --test`, the same posture as
`src/lib/recorder.js`.

`src/state/project.js` gains one pure export, `projectFromSession`, so
`App.jsx` builds a full project from a session record through the same
normalization path as `.json` Load project — no second implementation of
"what does a full project look like."

### Frontend responsibilities

- `src/lib/sessions.js` — `sessionId`, `sessionRecord`, `saveSession`,
  `saveSessionAudio`, `listSessions`, `loadSessionAudio`.
- `src/lib/time.js` — `formatRelativeTime`, for the session list's "updated
  Xm ago" label.
- `src/state/project.js` — `projectFromSession`.
- `src/components/RecentSessions.jsx` — new; renders the strip, one button
  per session.
- `src/App.jsx` — wires the autosave effect, the mount-time audio restore
  effect, and the reopen handler.

### Reused systems

The existing `File`-from-`Blob` reconstruction pattern (a `Blob` has no
`.name`, so a `File` is rebuilt from the stored `blob` + `name` + `type`),
the `load-project` reducer case and `projectFromPayload` normalization
(`specs/2026-09-22-project-save-load.md`), and the existing
`role="status"` message pattern for a rejected/unavailable state.

### New technical work

`sessions.js` (new file, new persistence technology — IndexedDB, not
previously used in this codebase; see `decisions/0003`), `RecentSessions.jsx`
(new component), `formatRelativeTime` (new pure helper), the `.app__sessions`
/ `.sessions` / `.session` styles, and a third row added to `.app`'s grid so
the strip sits below the existing two panes without breaking their scroll
behaviour.

---

## 8. Interface and component breakdown

### `RecentSessions`

- **Purpose:** show every saved session and let the user reopen one.
- **Inputs:** `sessions` (array, already sorted), `activeLyricsName` (which
  entry to mark current), `onSelect(session)`.
- **Outputs:** calls `onSelect` with the chosen session.
- **States:** empty (nothing rendered — no sessions yet is not an error
  state worth a message), populated, one entry marked active.
- **Responsive behaviour:** horizontal scroll; no layout change needed at
  narrow widths since it was already a scrolling strip.
- **Accessibility notes:** each entry is a `<button>` with an
  `aria-label` combining the song name and relative time; the active entry
  is marked with `aria-current="true"`.
- **Dependencies:** `formatRelativeTime`.

---

## 9. Risks, trade-offs, assumptions, and open questions

### Risks

- Restoring audio from a session immediately re-triggers the "audio changed"
  effect, which re-writes that same blob back to `sessionAudio` — a
  redundant round-trip, not a correctness bug, on every reload/reopen.
  Accepted; guarding against it (a ref-based skip flag) was judged not worth
  the added complexity for a write that's cheap relative to a sync session's
  actual duration.
- No delete means the list only grows. Low risk today (one user, moderate
  song count) but a real UX and storage cost over years. See open questions.

### Trade-offs

- Session identity is the lyrics file name alone, exactly as decided in
  conversation. Renaming a lyric sheet's file (even with identical content)
  creates a new, disconnected session rather than being recognized as the
  same song.

### Assumptions

- IndexedDB's practical storage limit (browser- and disk-dependent, but
  generally far larger than `localStorage`'s few MB) is enough for an
  unbounded set of WAV-sized sessions for one person's practice. Not
  verified against an actual quota; revisit if the browser starts refusing
  writes.

### Open questions

- Should a session be deletable from the list? Deferred — not requested;
  revisit once the list is long enough to be unwieldy.
- Should the list show which session's audio failed to persist (e.g. after
  an IndexedDB quota error), or fail silently as designed? Deferred.

---

## 10. Acceptance criteria

- [ ] Reloading the tab with a song loaded restores its audio automatically,
      no re-pick needed.
- [ ] Two different songs (different lyrics file names) can be synced across
      sessions without either overwriting the other.
- [ ] Reopening the same lyrics file name after further edits updates that
      song's existing session rather than creating a second entry.
- [ ] The session list is sorted most-recently-updated first and reopening
      an entry restores lines, timing, offset, style and audio.
- [ ] With IndexedDB unavailable, the rest of the app works exactly as
      before this feature.
- [ ] `npm test` passes, including new tests for `sessionId`, `sessionRecord`,
      `formatRelativeTime`, and `projectFromSession`.

---

## 11. Implementation plan

### Phase 1 — Foundations

`src/lib/sessions.js` (IndexedDB wrapper + pure helpers), `formatRelativeTime`
in `src/lib/time.js`, `projectFromSession` in `src/state/project.js`. Unit
tests for everything pure.

### Phase 2 — Core functionality

Wire the autosave-to-session effect, the audio-changed effect, the
mount-time audio restore effect, and the reopen handler in `App.jsx`.

### Phase 3 — Interface

`RecentSessions.jsx`, the bottom strip, styles.

### Phase 4 — Validation

Manual pass: sync two different songs across a reload each, confirm neither
clobbers the other, confirm audio survives a reload without re-picking.
