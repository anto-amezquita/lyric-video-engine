# 0008 — [Intro] shows the title and [Outro] shows the credits; the end card goes

## Status

Accepted

## Context

`decisions/0002` made `[Intro]` and `[Outro]` stampable note cues that show
"♪", and dropped every other bracketed line as metadata, the title and credit
lines included. `decisions/0005` then added an end card after the last lyric,
with the title taken from the lyrics file name plus a fixed "Written by AMEZ".

A real lyric sheet (`adios-mf.txt`) already holds both in its own file: a
`[Adios MF]` title on the first line, and a `[Music & lyrics by Antonio Amez.]`
credit after `[Outro]`. The author wants `[Intro]` to show the title and
`[Outro]` to show those credits, placed where the cue is stamped, instead of
the note and instead of a card with a different title and a fixed credit.

## Decision

`[Intro]` and `[Outro]` stay stampable cues, with the same start, end and
fade as any lyric line. Their text changes:

- **`[Intro]` shows the title.** The title is the first line of the file when
  that line is a bracket that isn't a note keyword. Otherwise it is the lyrics
  file name without its extension, so a file with no title line still shows
  something. If neither exists, it is "♪".
- **`[Outro]` shows the credits.** These are the bracket lines directly after
  it, up to the first line that isn't a bracket, one row per line. If there
  are none, it is "♪".
- `[Instrumental]` and `[Turnaround]` still show "♪".

The text is filled in when the file is read (`tokenizeLyrics`), so the cue is
an ordinary line to everything downstream: the sync list shows the title and
credits, and the canvas draws them in the lyric face and colour, at half the
lyric size. Their lines carry `role: 'title'` and `role: 'credits'` so the
renderer knows. Line
breaks inside a line's text are kept as separate rows when it is wrapped.

The end card is removed: `paintEndCard`, `END_CARD_CREDIT`, `endCardOpacity`
and `END_CARD_FADE_SECONDS`, along with the `title` argument to
`computeLayout`. This replaces the "End card" section of `decisions/0005`.
`songTitle` stays, as the fallback title.

The number and order of cues don't change, so re-importing a `.txt` keeps
every timestamp.

## Alternatives considered

- **Keep the end card as well.** Not chosen: the Outro cue now carries the
  credits, and two credit screens would say the same thing twice.
- **The title at the full lyric size.** Not chosen: the author wants the title
  the same size as the credits.
- **Mark the title and credits with a keyword, such as `[Title: Adios MF]`.**
  Not chosen: the file already holds them in the shape the author writes, and
  `decisions/0002` rejected a second convention.
- **Read credits by keyword (`Music & lyrics by`).** Not chosen, for the
  reason in `decisions/0002`: a false match would silently swallow a lyric.
  Position after `[Outro]` is a clearer signal.
- **Always use the file name as the title.** Not chosen: `adios-mf.txt` would
  read "adios-mf", not "Adios MF".

## Consequences

### Positive

- The title and credits come from the lyric sheet and are timed like any
  line, so they appear where the author stamps them.
- One mechanism instead of two, and less code to render and test.

### Negative

- The first line of a file that is a section label (`[Verse 1]`) would be
  taken as the title. Titles have to be the first line.
- Credit lines are only read straight after `[Outro]`. A credit placed
  elsewhere, or after a lyric line, is still dropped.
- Without an `[Outro]` there are no credits, and without `[Intro]` no title.
  The old end card appeared with no cue at all.
- The title and credits are half the lyric size, a fixed ratio
  (`CAPTION_SCALE` in `renderFrame.js`); the size slider scales everything
  together. A saved song picks up the roles when its `.txt` is re-imported.
- The "©" after the title is gone. A `©` in the credit line itself still
  draws.
- A saved song keeps its old "♪" lines until its `.txt` is re-imported. That
  keeps timestamps, as the cue count doesn't change.
- A line's text can now hold a line break, and the sync list shows it as one
  line.

## Related files

- `src/lib/tokenize.js` — `tokenizeLyrics`, `buildLines`
- `src/state/project.js` — `load-lyrics`, `songTitle`
- `src/lib/renderFrame.js` — `computeLayout`
- `src/components/CanvasPreview.jsx`
- `decisions/0002-bracket-metadata-and-instrumental-cue.md`
- `decisions/0005-solid-background-and-marker-typeface.md` (end card replaced)
- `specs/2026-09-30-intro-title-outro-credits.md`
