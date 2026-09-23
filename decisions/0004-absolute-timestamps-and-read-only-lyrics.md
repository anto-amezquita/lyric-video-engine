# 0004 — Absolute timestamps and a read-only lyric table

## Status

Accepted

## Context

The MVP was built around a decoupling promise: the sync pass survives both a
corrected lyric sheet and a recut demo. Two mechanisms served it — inline text
editing (fix a typo without losing that line's timestamp) and a global offset
in milliseconds, applied on read, with an explicit "bake" to fold it into the
stored values.

In practice the author does not use either. Lyrics are written and corrected in
the `.txt`, which is already the source of truth and already carries timestamps
over by position on re-import. And a recut demo is not the common case; the
common case is one line landing slightly early, which a whole-song shift cannot
fix. What the work actually consists of is tuning individual lines by ear, over
and over.

The offset also cost precision everywhere it touched: every read went through
`effectiveTime`, a stamp stored `currentTime` minus the offset, and a seek had
to remember to add it back — a bug this change surfaced, where `Enter` seeked
to the stored value rather than the played one.

## Decision

Timestamps are absolute. What is stored is what plays, and a line is tuned by
changing that one line's value.

Removed entirely: the global offset (`offsetMs`, `set-offset`, `bake-offset`,
`OffsetPanel`), inline text editing (`set-text`), adding and deleting lines
(`insert-line`, `delete-line`), and the uppercase style toggle. The lyric table
is now read-only text with two editable timestamp fields per line.

Added in their place: clicking a line seeks the playhead to its start, the
mouse equivalent of what `Enter` already did for the cursor line. Fine-tuning
means hearing the same moment repeatedly, and scrubbing for it by hand was the
friction that made the job clunky.

Lyrics are corrected by fixing the `.txt` and re-importing, which already
carries every timestamp over by position — the MVP's decoupling promise, met by
the mechanism that was actually being used.

## Alternatives considered

- **Keep the offset in the data model and hide its control.** Rejected: dead
  state that every read still has to thread through, with no way to see or
  correct a non-zero value.
- **Keep inline text editing as a convenience.** Rejected on the author's own
  workflow — the `.txt` is where lyrics get written, and two sources of truth
  for the same words invites them to diverge.
- **A per-line nudge control (± buttons) instead of click-to-seek.** Not taken
  now: typing an exact value is already possible, and the actual bottleneck was
  hearing the moment, not entering the number. Worth revisiting if typing
  proves slower than nudging.

## Consequences

### Positive

- One number per line, read and written the same way everywhere. No
  transform to remember on read, on stamp, or on seek.
- Fixes the `Enter`-seek bug by construction: there is no longer a stored
  value that differs from the played one.
- A much smaller surface: four reducer actions, one component and one style
  field gone, along with roughly a dozen tests for behaviour that no longer
  exists.

### Negative

- A recut demo with different intro silence now means re-stamping rather than
  one shift. Accepted deliberately: recuts are rare for this author, and the
  offset was not actually being used when they happened.
- A typo means editing the `.txt` and re-importing rather than fixing it in
  place — one more step, on a path that already exists and is already tested.
- Reordering lines is no longer possible in the app at all (it was already
  only possible by deleting and inserting).

### Migration

A payload saved with a non-zero `offsetMs` — in `localStorage`, a `.json`
project file, or an IndexedDB session — has it folded into its own timestamps
once on load, clamped at zero, in `projectFromPayload`. Existing sync work
keeps playing where it played. This is the sole exception to the
new-key-rather-than-migrate rule in `docs/architecture.md` §6, taken because
the alternative was discarding a finished 57-line pass.

## Related files

- `specs/2026-09-19-lyric-video-mvp.md` §2, §4, §6, §8, §10
- `src/state/project.js`
- `src/components/LyricLines.jsx`
- `src/hooks/useSyncShortcuts.js`
- `docs/architecture.md` §4, §6, §15, §16
