# 0006 — A per-song lyric typeface, starting with Lobster

## Status

Accepted

## Context

`decisions/0005` settled the lyrics on Permanent Marker and left a font picker
unbuilt: "Worth revisiting if the choice needs to vary per song." It now does.
The author wants to switch the lyric face per song, keeping Permanent Marker
and adding Lobster.

## Decision

`style.fontFamily` holds the lyric typeface, saved with the project like the
other Look settings. The Look panel gets a **Typeface** select above the
colours.

The list lives in `src/lib/fonts.js` as `FONT_FAMILIES`: Permanent Marker and
Lobster. `DEFAULT_FONT_FAMILY` is Permanent Marker, and `DEFAULT_STYLE` uses
it, so a project, session or file saved before this change loads in the face
it was made in. `resolveFontFamily` falls back to the default for a missing or
unknown name, so a hand-edited or newer project file cannot break the canvas.

Both faces ship one 400 weight, so the canvas keeps asking for 400 in every
case. Lobster is loaded from the same Google Fonts link as the others.

The preview tracks which family has finished loading (not just whether one
has), so switching typeface re-measures the wrapping once the new face
arrives instead of keeping the fallback's measurements.

The title and credit lines are lyric lines, so they use the same face. Sizes, line heights and the 60–200% slider are unchanged.

## Alternatives considered

- **A free-text font name.** Rejected: only faces loaded in `index.html` work
  on the canvas, so anything else would silently render in the fallback.
- **Self-hosting the font files.** Not now: it would fix the offline fallback
  noted in `decisions/0005`, but it is a separate change and applies to every
  face.
- **A separate face for the end card.** Rejected: one control, one look.

## Consequences

### Positive

- The look can differ per song, and old projects are untouched.
- Adding a face is one line in `fonts.js` plus the Google Fonts link.

### Negative

- Lobster is a script face with a different width and height from Permanent
  Marker, so line wrapping and the 140px base size read differently. Not yet
  judged by eye; the size slider is the fix if it looks off.
- Same runtime dependency as before: offline, an uncached face falls back to
  the system sans, and an export made in that state would use the fallback.
- Lobster's coverage of © and non-English letters is not verified. Spanish
  lyrics (accents, ñ, ¿, ¡) are worth checking in a real export.

## Related files

- `src/lib/fonts.js` — `FONT_FAMILIES`, `DEFAULT_FONT_FAMILY`, `resolveFontFamily`
- `src/lib/renderFrame.js` — `fontSpec`, `ensureFontLoaded`
- `src/state/project.js` — `DEFAULT_STYLE.fontFamily`
- `src/components/LookPanel.jsx`, `src/components/CanvasPreview.jsx`
- `index.html` — the Google Fonts link
- `decisions/0005-solid-background-and-marker-typeface.md`
