# 0002 — Bracket lines are metadata; [Instrumental]/[Intro] are stampable note cues

## Status

Accepted

## Context

The MVP's tokenizer assumed "one line per lyric line, blank lines between
stanzas" (`specs/2026-09-19-lyric-video-mvp.md`), with no way to mark
non-lyric content. Testing against a real lyric sheet surfaced the gap: a
title line and `[Verse 1]`/`[Pre-Chorus]`/`[Chorus]` section tags were
tokenised as if they were lyrics — stamped during sync and shown in the
video.

A real lyric sheet also isn't lyrics alone. Industry practice (BMI's own
guidance among others) puts a title at the top and writer/PRO/copyright/
contact credits at the bottom, none of which belong in a synced video either.

Separately, `docs/backlog.md` item 5 had flagged an open question: whether a
long gap between lines (an instrumental break, a solo) needs a marker instead
of rendering as an empty frame, deferred until a real render could be judged.

## Decision

A line wrapped entirely in `[...]` is metadata — title, section label,
credits — and is dropped at tokenize time: never stamped, never shown.

The one exception is a small set of bracket keywords — currently
`[Instrumental]`, `[Intro]` and `[Outro]` (case-insensitive, stray spacing
ignored) — which are not metadata. Each survives as a real line whose text
is `♪`. It is
stamped and given an end exactly like any lyric line, and fades in/out with
the product's existing 0.25s fade. This resolves backlog item 5: the marker
is manually cued by the songwriter, at whatever point in the song they
choose, rather than triggered automatically by gap duration.

A bracket that doesn't span the whole line (`Put this [in brackets] please`)
is left alone as ordinary lyric text — only a line that is entirely one
bracket counts as metadata.

## Alternatives considered

- **Detect the title by matching the first line against the lyrics
  filename.** Rejected: fails whenever the file isn't named after the song,
  and doesn't help with credits, which have no positional signal at all.
- **Detect credits by keyword** (`Written by`, `©`, `All rights reserved`…).
  Rejected: a false positive would silently swallow a real lyric line, with
  no error and no way to notice short of watching the whole video.
- **A `---` divider marking where credits begin.** Rejected in favour of
  reusing `[...]`, since the file already needed that syntax for section
  labels — one convention instead of two.
- **Automatic marker on any gap over a fixed duration** (the original framing
  of backlog item 5). Rejected: gap length doesn't reliably distinguish "an
  instrumental section worth marking" from "the reverb tail before the next
  line." A manual cue is exact and costs one line in a file that's already
  hand-edited.

## Consequences

### Positive

- Matches the actual shape of a real lyric sheet (title, section labels,
  credits at the bottom), so no reformatting is needed beyond adding
  brackets around what was already there.
- One syntax rule to remember, not two.
- Resolves backlog item 5 without adding a new, unavoidably arbitrary gap
  threshold.

### Negative

- A song that genuinely has "instrumental" or "intro" sung as a lyric,
  wrapped in brackets by mistake, would have that line silently dropped. Not
  mitigated; considered acceptable given how unlikely the collision is.
- Any prior `.txt` file that used a full-line `[...]` for something else is
  now affected — that line will be dropped where it previously rendered.

## 0002.1 — Amendments

`[Intro]`, then `[Outro]`, were added to the note-keyword set alongside
`[Instrumental]`, same rules and same reasoning each time. The keyword list
(`NOTE_KEYWORDS` in `src/lib/tokenize.js`) is expected to keep growing
(`[Solo]`...) as more come up in real lyric sheets; each is a one-line
addition to the set, not a new decision.

## Related files

- `specs/2026-09-19-lyric-video-mvp.md` §4, §9
- `specs/2026-09-19-line-end-times-and-gaps.md`
- `src/lib/tokenize.js`
- `tests/project.test.js`
