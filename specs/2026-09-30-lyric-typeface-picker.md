# Lyric typeface picker

## 1. Overview

### Summary

A **Typeface** control in the Look panel that switches the lyric face per song
between Permanent Marker (the current face) and Lobster. The choice is saved
with the project and drawn in the preview, the end card and every export.

### Problem

`decisions/0005` fixed the lyrics in Permanent Marker and deliberately left a
picker unbuilt, "worth revisiting if the choice needs to vary per song." It
now does: one face can't suit every song, and changing it means editing code.

### Intended users

The author, making lyric videos for their own songs
(`docs/product-north-star.md`).

### Desired outcome

Pick a face for a song, see it in the preview at once, and get the same face
in the exported `.mp4`. Every project made before this change looks exactly as
it did.

---

## 2. Goals and non-goals

### Goals

- Choose the lyric typeface per song from a short, fixed list: Permanent
  Marker and Lobster.
- Keep Permanent Marker as the default, so existing projects, sessions and
  project files are unchanged.
- Make adding a third face a one-line change.

### Non-goals

- Free-text or arbitrary font names, or uploading a font file. Only faces
  loaded in `index.html` render on the canvas.
- Choosing weights or italics. Both faces ship one 400 weight, and asking for
  more would make the browser fake a bold.
- A separate face for the end card, or for the interface. The interface keeps
  Schibsted Grotesk and JetBrains Mono.
- Self-hosting the font files, so the offline fallback stays as
  `decisions/0005` describes it.
- Changing text size, line height, spacing or the 60–200% slider.

### Success criteria

- Switching to Lobster changes the preview canvas immediately, with no frame
  measured in a fallback face once the font has loaded.
- An export made with Lobster picked shows Lobster.
- A project saved before this change loads in Permanent Marker.

---

## 3. User experience

### Primary user stories

- As a songwriter, I pick Lobster for a song whose mood suits it, so the video
  looks different from my Permanent Marker ones.
- As a songwriter, I reopen a song later and find the face I chose.
- As a songwriter, I open an old project and see no change.

### Main user flows

**Pick.** Look panel → Typeface select → choose Lobster → the preview redraws
in Lobster and re-wraps the lyrics to fit → export as usual.

**Reopen.** Reloading the page or opening a recent session restores the saved
face.

### States and edge cases

| State | Behaviour |
|---|---|
| Default, nothing chosen | Permanent Marker. |
| Face still loading after a switch | Preview measures with the fallback for a moment, then re-measures when the face arrives. |
| Offline, face not cached | Canvas falls back to the system sans; an export made then uses the fallback (existing limitation, `decisions/0005`). |
| Saved project has no `fontFamily` | Loads as Permanent Marker. |
| Saved project names an unknown face | Renders as Permanent Marker; the select shows Permanent Marker. Nothing crashes. |
| Export while a face is unloaded | Not guarded. The face is loaded from the moment it is picked, well before an export. |
| Lyrics use characters the face lacks (accents, ñ, ¿, ¡, ©) | Browser draws those characters in a fallback. Not yet verified for Lobster. |

### UX notes

- The select sits above the colour fields in the Look panel, using the same
  `field` and `select` styles as Alignment.
- The options are plain face names, not rendered in their own face.
- Lobster is a script face, so it wraps and reads differently at the same
  size. The existing size slider is the way to correct that.

---

## 4. Functional requirements

- `FR-01` The Look panel shows a **Typeface** select listing every face in
  `FONT_FAMILIES`.
- `FR-02` Choosing a face sets `style.fontFamily` through the existing
  `set-style` action.
- `FR-03` The canvas draws lyrics and the end card in the chosen face at
  weight 400, with `system-ui, sans-serif` as the fallback.
- `FR-04` Changing the face re-measures the layout once the new face has
  finished loading.
- `FR-05` `DEFAULT_STYLE.fontFamily` is Permanent Marker, so a payload with no
  `fontFamily` loads in it.
- `FR-06` A `fontFamily` that isn't in `FONT_FAMILIES` is treated as the
  default when drawing and when shown in the select.
- `FR-07` `fontFamily` is saved and restored by localStorage autosave and saved
  sessions.
- `FR-08` The exported video uses the same face as the preview.

---

## 5. Non-functional requirements

- **Performance.** Loading a face is one `document.fonts.load` call. Layout is
  measured once per change, not per frame, as today.
- **Local-first.** Faces come from Google Fonts at runtime, as the existing
  ones do. No new request path.
- **Accessibility.** A labelled native `select`, keyboard-operable like
  Alignment. The canvas keeps its existing `aria-label`.
- **Maintainability.** The list lives in one file, `src/lib/fonts.js`, shared
  by state, renderer and panel.

---

## 6. Information architecture and data

### Data entities

**Style** gains one field.

### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `style.fontFamily` | string | No | One of `FONT_FAMILIES`. Missing or unknown resolves to `DEFAULT_FONT_FAMILY`. |

### State changes

No new reducer action. `set-style` already merges patches into `style`.

### Persistence

Same two paths as the rest of `style`, both merging over `DEFAULT_STYLE` on
load. No version bump: adding an optional field with a default is
backwards compatible, and an older app reading a newer file simply ignores it.

---

## 7. Technical approach

### Proposed architecture

A small module, `src/lib/fonts.js`, exports `FONT_FAMILIES`,
`DEFAULT_FONT_FAMILY` and `resolveFontFamily(style)`. `renderFrame.js` builds
its font string from the resolved family; `project.js` uses the default in
`DEFAULT_STYLE`; `LookPanel.jsx` builds the select from the list. It is a
separate file so `project.js` doesn't depend on the renderer.

### Frontend responsibilities

- `src/lib/renderFrame.js` — `fontSpec(style, size)` and `ensureFontLoaded`
  take the style; the old fixed `CANVAS_FONT` constant is gone.
- `src/components/CanvasPreview.jsx` — tracks which family has finished
  loading and re-measures the layout when it changes.
- `src/components/LookPanel.jsx` — the Typeface select.
- `index.html` — adds Lobster to the Google Fonts link.

### Reused systems

`set-style`, the `field` / `select` / `panel__grid` styles, and the
`DEFAULT_STYLE` merge every load path already uses.

### New technical work

`fonts.js`, the changes above, and tests in `tests/project.test.js`. No new
dependency.

---

## 8. Interface and component breakdown

### Typeface select (in `LookPanel`)

- **Purpose:** Choose the lyric face for this song.
- **Inputs:** `style.fontFamily` (resolved), `FONT_FAMILIES`.
- **Outputs:** `set-style` with `{ fontFamily }`.
- **States:** default, focus, disabled is not needed (always usable, even
  before lyrics are loaded).
- **Responsive behaviour:** Sits in a `panel__grid` row, same as its
  neighbours.
- **Accessibility notes:** Native `select` inside a `label`, so the name and
  keyboard behaviour come for free.
- **Dependencies:** `fonts.js`, `DEFAULT_STYLE`.

---

## 9. Risks, trade-offs, assumptions, and open questions

### Risks

- Lobster may not cover ©, or the accented and inverted characters Spanish
  lyrics need, in which case those draw in a fallback and look wrong.
- The 140px base size was tuned for Permanent Marker and may look too large or
  too small in Lobster.
- Runtime loading from Google Fonts means a cold or offline first export can
  use the fallback (`decisions/0005`).

### Trade-offs

- A fixed list over free text: it protects against silent fallback, at the
  cost of a code change to add a face.
- One face for lyrics and end card: fewer controls, less variety.

### Assumptions

- Two faces are enough for now. Marked as an assumption; the list is built to
  grow.
- The face is a per-song look, like colours, so it belongs in `style` and not
  in a global setting.

### Open questions

- Does Lobster look right at 140px, and does it cover Spanish accents, ñ, ¿, ¡
  and ©? Answered by the by-eye export check in `docs/backlog.md` #1.
- Should the base size differ per face, if Lobster needs a different default
  scale? Deferred until the export check shows whether it is needed.
- Should the select preview each face in its own type? Deferred; plain names
  for now.

---

## 10. Acceptance criteria

- [x] The Look panel shows a Typeface select with Permanent Marker and Lobster.
- [x] Permanent Marker is the default, and a project with no `fontFamily`
      loads in it.
- [x] An unknown `fontFamily` falls back to Permanent Marker.
- [x] `fontFamily` survives being saved and opened as a session.
- [x] `npm test` includes tests for the list, the fallback, the default on old
      records, and the save/load round trip. Passing (57 of 57, 2026-09-30).
- [x] `npm test` passes.
- [x] `npm run lint` passes: 0 errors. Three warnings, all in `color.js` and
      `sessions.js`, which this change doesn't touch.
- [ ] Picking Lobster redraws the preview in Lobster and re-wraps the lyrics,
      with no leftover fallback line breaks.
- [ ] An exported `.mp4` with Lobster picked shows Lobster on the lyrics and
      the end card, checked on a real song with a cold cache.
- [ ] Accents, ñ, ¿, ¡ and © draw in Lobster in that export, or the gap is
      recorded in `decisions/0006`.
- [ ] Reloading and opening a recent session each restore the chosen face.

---

## 11. Implementation plan

### Phase 1 — Foundations

`src/lib/fonts.js`; `fontFamily` in `DEFAULT_STYLE`; `fontSpec` and
`ensureFontLoaded` taking the style; Lobster in the Google Fonts link.
*Built.*

### Phase 2 — Core functionality

The Typeface select in the Look panel; the preview re-measuring when a new
face finishes loading. *Built.*

### Phase 3 — States and edge cases

Fallback for a missing or unknown face; old-project default; save/load round
trip; unit tests. *Built.*

### Phase 4 — Polish

Adjust Lobster's size or wrapping if the export check shows it is needed. Not
started.

### Phase 5 — Validation and release

`npm test` and `npm run lint` pass, so the remaining step is the by-eye export check with each
face (`docs/backlog.md` #1), and record what it finds in `decisions/0006`.
