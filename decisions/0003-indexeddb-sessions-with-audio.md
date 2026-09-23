# 0003 — IndexedDB for audio persistence and session history, keyed by lyrics file name

## Status

Accepted

## Context

`docs/architecture.md` states "database: none — project state is held in
`localStorage`." That was true because the only thing persisted was small,
string-serializable project data. Two real problems came from that:

- A `File` object can't be serialized into `localStorage`, so audio is
  dropped on every reload and re-picked by hand, even seconds later, even for
  the same file.
- `localStorage`'s single storage key means only one project exists at a
  time. Starting a second song overwrites the first's sync work with no way
  back.

## Decision

Add IndexedDB as a second, purely client-side persistence layer, alongside
(not replacing) `localStorage` and the `.json` project file
(`specs/2026-09-22-project-save-load.md`). Two object stores:

- `sessions` — lightweight project metadata (lines, offset, style,
  lyricsName, audioName, updatedAt), written on every project change.
- `sessionAudio` — the audio file's bytes as a `Blob`, written only when the
  audio actually changes.

A session's identity is its lyrics file name. Loading the same name again
updates that song's existing session; a different name creates a new one.
This was a direct product decision (not inferred): identity by content
similarity or a generated project id were both available and both rejected
in favour of the simplest thing that matches how the author actually thinks
about "this song's file."

No cap on session count, also a direct decision — see
`specs/2026-09-19-lyric-video-mvp.md`-style precedent of stating the
product's actual current use case (one person's practice) rather than
building for scale that doesn't exist yet.

## Alternatives considered

- **Store audio as base64 in `localStorage`.** Rejected outright:
  `localStorage`'s quota (a few MB in most browsers) is far smaller than a
  WAV demo, and base64 inflates size by another third on top.
- **A File System Access API handle**, letting the browser remember a real
  file on disk. Rejected: Safari and Firefox don't support it, and this
  product explicitly supports both (`docs/quality.md` §9).
- **Generated project ids instead of the lyrics file name as the key.**
  Rejected per the product decision above — the file name is the identity
  the author already uses, and a generated id would need its own UI just to
  be visible and reusable.
- **A cap on session count** (5, 10, LRU eviction). Rejected per the product
  decision above — deferred until it's an actual problem, consistent with
  this product's general bias against building for scale it doesn't have
  (`docs/product-north-star.md` §7: "should not become... a service").

## Consequences

### Positive

- Reload no longer loses audio — the single biggest friction point in the
  original complaint this decision responds to.
- Multiple songs can be in flight across sessions without manual file
  juggling.
- No change to the existing `localStorage` or `.json` file paths; both keep
  working exactly as documented.

### Negative

- `docs/architecture.md`'s "database: none" line is no longer accurate and
  needs updating (done alongside this decision).
- Storage grows without bound — acceptable for one person's practice today,
  a real cost if this product's audience or session count ever grows past
  that (see `specs/2026-09-22-recent-sessions-and-audio-persistence.md` §9
  open questions: no delete UI yet).
- Renaming a lyrics file, even with identical content, is indistinguishable
  from starting a new song — a second, disconnected session is created.
  Accepted per the identity decision above.
- Restoring a session's audio immediately re-writes that same blob back to
  `sessionAudio` (the "audio changed" effect can't tell a fresh pick from a
  restore). A redundant write, not a correctness issue; not guarded against,
  since the cost is small relative to how rarely a session is opened
  (`specs/2026-09-22-recent-sessions-and-audio-persistence.md` §9).

## Related files

- `specs/2026-09-22-recent-sessions-and-audio-persistence.md`
- `specs/2026-09-22-project-save-load.md`
- `src/lib/sessions.js`
- `src/state/project.js`
- `docs/architecture.md` §5, §6, §7
