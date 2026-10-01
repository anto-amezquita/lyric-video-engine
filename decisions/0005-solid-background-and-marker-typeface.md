# 0005 — Solid background, matching edge fades, a marker typeface, and an end card

## Status

Accepted

## Context

The canvas background was a three-stop vertical gradient derived from the one
colour picked per song: the picked colour in the middle, 72% brightness at the
top and 52% at the bottom, with a low-opacity noise layer over it to hide
8-bit banding. The top and bottom edge fades were built from those darker end
stops so they would blend into the gradient beneath.

In use, the result was not what the author expected from a "background colour"
control. The frame showed dark bands across the middle and a different colour
at the edges, so the picked colour was rarely the colour on screen. The first
attempt at the fades — using the picked colour — made this obvious, because it
put a lighter band at the edges over a darker gradient. The author wanted a
solid background.

The lyric face was Schibsted Grotesk 600, shared with the interface. The
author wanted something closer to the AMEZ aesthetic, and settled on a heavy,
handmade face after trying Special Elite and Courier Prime.

The video also ended when the last lyric did, with nothing to say whose song
it was. The author wanted the song title and a writing credit on the last
frame.

## Decision

The background is a solid fill of the picked colour. The top and bottom edge
fades are that same colour, fully opaque at the frame edge and transparent
toward the lyrics; both ends share one RGB and only alpha changes, so a fade
never passes through a grey fringe. The grain layer is removed, since it only
existed to dither the gradient.

The lyrics are set in Permanent Marker, weight 400. It ships a single weight
that is already heavy, so asking for 700 would make the browser synthesize a
fake bold. The interface keeps Schibsted Grotesk and JetBrains Mono.

Text metrics changed with it:

- Base size at 100% is 140px (was 70px). The Look panel slider runs 60–200%.
- Line height inside a wrapped line is 1.1× the size (was 1.2×).
- Gap between separate lyric lines is 0.5× the size (was 0.85×).

The gradient helpers in `src/lib/color.js` (`shade`, `shadeAlpha`,
`backgroundStops`, `GRADIENT_TOP`, `GRADIENT_BOTTOM`) and their tests are
removed. What remains is `hexToRgb`, `withAlpha`, and the contrast maths the
Look panel warns with.

### End card

> **Replaced 2026-09-30** by `decisions/0008`: `[Intro]` now shows the title and
> `[Outro]` the credits, read from the `.txt`, and the end card was removed.
> What follows is the original decision, kept for history.

After the last lyric leaves the frame, an end card fades in over 0.6s and stays
until the track ends. It has two lines:

- The song title, then a space and ©. The title is the lyrics file name
  without its extension, so `Copycat.txt` gives "Copycat ©".
- "Written by AMEZ", a fixed string (`END_CARD_CREDIT` in `renderFrame.js`).

Both lines are the same size (half the lyric size), the same colour as the
lyrics, at full opacity, with a 1.0× line height and a gap of 0.1× the lyric
size between them. They are aligned like the lyrics and centred on the same
focal point. The card is drawn on the same canvas the exporter records, so it
is in every export, and its text is wrapped and measured once in
`computeLayout`, not per frame.

The card appears when the last cue has an end time. A last line with no end
holds to the end of the track, so it never leaves and there is no card.
`endCardOpacity` in `src/state/project.js` owns that rule and is tested.

## Alternatives considered

- **Keep the gradient and only change the fades.** Rejected: the fades then
  sit over a darker background, which is the mismatch the author saw.
- **Keep the gradient as an option.** Rejected for now: a second background
  mode for a look the author does not want, in a tool that exposes few
  controls on purpose.
- **Keep the grain for texture.** Rejected: on a solid fill it only shifts the
  picked colour slightly, so the exported colour would not match the picked one.
- **Special Elite, then Courier Prime and Courier Prime Bold.** Tried and
  dropped on look. Special Elite has only one weight; Courier Prime Bold was
  not heavy enough.
- **A font picker in the Look panel.** Not built: the author settled on one
  face. Worth revisiting if the choice needs to vary per song.
- **End card in the last 4 seconds of the song.** Rejected: it would collide
  with a last line that is still on screen.
- **End card after the audio ends.** Rejected: it means recording past the
  end of the track, and export is a realtime recording of the audio clock.
- **A title field in the Look panel, or reading a `[Title]` line from the
  `.txt`.** Rejected in favour of the file name, which is already known and
  needs no new control. The tokenizer drops full-line `[...]` metadata
  anyway (`decisions/0002`).
- **Dimming the credit line, or a larger title.** Tried and dropped: both
  lines are now the same size and colour.

## Consequences

### Positive

- The colour on screen and in the export is the colour picked, so the contrast
  warning in the Look panel now describes exactly what a viewer sees.
- One less layer to paint and to keep in step with the fades.
- A smaller `color.js`, with nothing left that only the removed gradient used.
- The title and credit are in every export with no extra step, since they are
  drawn on the recorded canvas.

### Negative

- A flat dark background has no depth of its own. Depth now has to come from
  the lyrics and, later, from an image or video background.
- Permanent Marker is wide and irregular, so lines wrap sooner than in the old
  face. A saved project or session keeps its `fontScale`, so it renders twice
  as large as before the base size change.
- The face is loaded from Google Fonts at runtime. Offline, the canvas falls
  back to the system sans until it is cached, and an export made in that state
  would use the fallback.
- The end card title is the file name, so `Copycat_v2.txt` would read
  "Copycat_v2 ©". The file name has to be a clean title.
- The credit is hard-coded, and there is no way to turn the card off. Every
  export whose last line has an end time gets it.
- A bare © after the title is a visual mark. A formal notice normally also
  carries a year and the owner; the author chose to keep it as is.
- Permanent Marker may not include a © glyph, in which case the browser draws
  that one character in a fallback face. Not verified.
- "AMEZ" is all capitals, and in this face capitals read taller than the
  lowercase around them, so it looks larger than the rest of the credit at
  the same font size. Left as is on purpose.

## Related files

- `src/lib/renderFrame.js` — `CANVAS_FONT`, `baseFontSize`, `computeLayout`, `paintEdgeFades`, `paintEndCard`, `END_CARD_CREDIT`
- `src/state/project.js` — `songTitle`, `endCardOpacity`, `END_CARD_FADE_SECONDS`
- `src/components/CanvasPreview.jsx`
- `src/lib/color.js`
- `src/components/LookPanel.jsx`
- `index.html` — the Google Fonts link
- `docs/architecture.md` §6, §8; `docs/brand.md` §11, §17
