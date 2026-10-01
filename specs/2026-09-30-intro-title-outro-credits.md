# Intro title and Outro credits

## 1. Overview

### Summary

`[Intro]` shows the song title in the video, and `[Outro]` shows the credits,
both read from the lyric `.txt`. They replace the "♪" those cues showed
before, and replace the end card that followed the last lyric.

### Problem

The lyric sheet already holds the title (`[Adios MF]`, first line) and the
credit (`[Music & lyrics by Antonio Amez.]`, after `[Outro]`), but both were
dropped as metadata. The video got its title from the file name instead
(`adios-mf`) and a fixed "Written by AMEZ", on an end card the author didn't
place.

### Intended users

The author, finishing a lyric video for one of their own songs.

### Desired outcome

The title and credits in the video are the ones written in the sheet, and
appear where the author stamps `[Intro]` and `[Outro]`.

---

## 2. Goals and non-goals

### Goals

- `[Intro]` shows the title from the file, and `[Outro]` shows the credits
  from the file.
- A file with no title line still shows a title.
- Keep every timestamp when an existing song's `.txt` is re-imported.
- Remove the end card, which this replaces.

### Non-goals

- A separate colour or typeface for the title or credits. Both are half the
  lyric size, and nothing else about them is adjustable.
- A field in the app to type a title or credits. They come from the `.txt`.
- Title or credits with no `[Intro]` or `[Outro]` cue.
- A © line, a year, or any generated text. What is written is what is shown.
- Reading credits from anywhere but straight after `[Outro]`.

### Success criteria

- A sheet shaped like `adios-mf.txt` shows "Adios MF" on `[Intro]` and the
  credit line on `[Outro]`, in the preview and in an export.
- Re-importing it onto an existing session leaves every timestamp where it
  was.

---

## 3. User experience

### Primary user stories

- As a songwriter, I put the title in brackets at the top of my `.txt`, and
  the intro shows it.
- As a songwriter, I put my credits in brackets after `[Outro]`, and the
  outro shows them for as long as I stamp it.

### Main user flows

Write the sheet: `[Title]` first, `[Intro]` where the song starts, lyrics,
then `[Outro]` followed by one or more `[Credit line]` lines. Drop it in,
stamp the cues like any line, and the title and credits are in the preview
and the export.

### States and edge cases

| State | Behaviour |
|---|---|
| First line is a bracket that isn't a note keyword | It is the title. |
| First line is not a bracket | No title in the file; `[Intro]` shows the file name. |
| No title line and no file name | `[Intro]` shows "♪". |
| `[Intro]` appears more than once | Each shows the title. |
| Bracket lines directly after `[Outro]` | Credits, one row each, until the first non-bracket line. |
| Nothing after `[Outro]` | `[Outro]` shows "♪". |
| A section label (`[Verse 1]`) as the first line | Taken as the title. |
| `[Instrumental]`, `[Turnaround]` | Still "♪". |
| A long credit | Wraps at half the lyric size, over several rows. |
| An older saved song | Keeps its "♪" lines until the `.txt` is re-imported. |
| Credit lines when lines are listed in the sync panel | Shown joined, since the list collapses line breaks. |

### UX notes

The title and credits are drawn like lyric lines, at half the size: same face,
colour and alignment. The cue's start and end decide how long either stays.

---

## 4. Functional requirements

- `FR-01` The title is the file's first line when it is a bracket that isn't
  a note keyword, else the lyrics file name without its extension, else "♪".
- `FR-02` An `[Intro]` cue's text is the title.
- `FR-03` An `[Outro]` cue's text is the bracket lines directly after it,
  joined by line breaks, else "♪".
- `FR-04` `[Instrumental]` and `[Turnaround]` cues stay "♪".
- `FR-05` Line breaks in a line's text are drawn as separate rows.
- `FR-09` The Intro title and Outro credits are drawn at half the lyric size
  (`CAPTION_SCALE`), marked by `role: 'title'` / `'credits'` on their line;
  lyrics and notes are not.
- `FR-06` The number and order of cues does not change, so re-importing keeps
  timestamps.
- `FR-07` The end card is no longer drawn.
- `FR-08` Loading lyrics passes the file name to the tokenizer as the
  fallback title.

---

## 5. Non-functional requirements

- **Performance.** Text is filled in once when the file is read. Layout is
  measured once per change, as before.
- **Maintainability.** The rule is in one function, `tokenizeLyrics`.

---

## 6. Information architecture and data

No new fields. A line's `text` may now contain `\n` for a multi-row credit.

---

## 7. Technical approach

### Frontend responsibilities

- `src/lib/tokenize.js` — `tokenizeLyrics` classifies each line as lyric,
  note or metadata, finds the title and the credits, and fills in the two
  cues. `buildLines` passes options through.
- `src/state/project.js` — `load-lyrics` passes `songTitle(name)` as the
  fallback. The end-card helpers are removed.
- `src/lib/renderFrame.js` — `computeLayout` splits text on line breaks; the
  end-card drawing is removed.
- `src/components/CanvasPreview.jsx`, `src/App.jsx` — no longer pass or use
  the title or the end-card opacity.

### Reused systems

The cue, fade and layout system every lyric line already goes through.

### New technical work

The tokenizer changes, and tests for them.

---

## 8. Interface and component breakdown

No new components. The sync list and canvas read the line text as before.

---

## 9. Risks, trade-offs, assumptions, and open questions

### Risks

- A section label as the first line is taken as the title.
- Credit lines placed away from `[Outro]` are still dropped silently.
- A long credit at half the lyric size may still look too big or too small.
  Not yet seen in an export.
- Permanent Marker and Lobster may not draw `©` or `&` the way the rest of
  the line looks. Not verified.

### Trade-offs

- Position over keywords for the credits: fewer false matches, but less
  forgiving of where they are written.
- Half the lyric size for both, so there is nothing new to adjust.

### Assumptions

- The title is the first line of the file.
- Credits sit straight after `[Outro]`.
- Losing the automatic end card is acceptable, since the author now stamps
  the Outro cue.

### Open questions

- Is half the lyric size right for both? Decided after seeing a real export.
- Should the sync list show credit rows on separate lines?

---

## 10. Acceptance criteria

- [x] `[Intro]` shows the file's first-line title, then the file name, then
      "♪".
- [x] `[Outro]` shows the bracket lines after it, else "♪".
- [x] `[Instrumental]` and `[Turnaround]` still show "♪".
- [x] Re-importing with a title and credits filled in keeps every timestamp.
- [x] The end card code is removed.
- [x] `npm test` (65 of 65) and `npm run lint` (0 errors, the same 3 existing
      warnings) pass, before the half-size credits change.
- [x] `npm test` (67 of 67) and `npm run lint` (0 errors, the same 3 existing
      warnings) pass after the half-size credits change.
- [x] `npm test` (67 of 67) and `npm run lint` (0 errors, the same 3 existing
      warnings) pass after the title-size change.
- [ ] The title and credits draw at half the lyric size in the preview and an
      export.
- [ ] Re-importing `adios-mf.txt` shows "Adios MF" and the credit in the
      sync list, in the right rows.
- [ ] The preview shows the title on the Intro cue and the credit on the
      Outro cue, wrapped sensibly.
- [ ] An export shows both, and no end card follows the last lyric.

---

## 11. Implementation plan

### Phase 1 — Foundations

Tokenizer reads the title and credits and fills in the two cues. *Built.*

### Phase 2 — Core functionality

Fallback title from the file name; multi-row text in the layout. *Built.*

### Phase 3 — States and edge cases

Notes stay notes; no credits stays a note; credits stop at the first
non-bracket line. *Built.*

### Phase 4 — Polish

Adjust the credit size if the export check shows it is needed. Not started.

### Phase 5 — Validation and release

Run tests and lint, re-import `adios-mf.txt`, stamp the two cues, and check
the preview and an export.
