# brand.md

## Purpose

This file defines how the product should feel, sound, and look.

## Relationship to the other core files

`product-north-star.md` decides what deserves to exist. This file decides the
character of what gets built. `design.md` holds the craft rules, and
`content.md` holds the language rules that follow from what is written here.

## Scope note

This is a personal tool with one user, so several sections of the standard brand
template do not apply and are marked as such rather than filled in. A brand is
how a product behaves toward people who do not already know it — that surface
barely exists here. The sections that remain are the ones that still change
decisions: how it feels to use, how it speaks, and how it looks.

The visual identity is inherited from the author's personal brand rather than
invented for this tool. See "Typography" and "Colour" below.

---

## 1. Brand essence

### One-line essence

A quiet instrument that keeps up with the work.

### What we want people to feel

- In rhythm with the song rather than fighting the interface.
- That a correction is cheap and a mistake is recoverable.
- That the tool is being straight about what it is doing.

### What we are not

- Not playful. There is no personality performance here, no celebration when an
  export finishes.
- Not a creative suite. It does one job.
- Not a demo of what the browser can do. The technology is the means.

---

## 2. Brand promise

You will not sync the same song twice.

---

## 3. Audience relationship

### We should feel like

An instrument — something that rewards knowing it, and gets out of the way once
you do.

### We should not feel like

An assistant, a wizard, or a service. Nothing here should explain itself twice
or ask whether you are sure about something reversible.

### User posture

Focused and mid-task, with audio playing and a hand on the keyboard. Attention
is on the song, not the screen. The interface earns its place by not competing
for that attention.

---

## 4. Brand attributes

### Precise

Timestamps to the centisecond, an offset in milliseconds, an export whose
dimensions are stated on screen. Vagueness is the thing being designed out.

### Unhurried

Nothing flashes, bounces, or congratulates. Motion explains where the stack
moved to and then stops.

### Honest about cost

Where the product is slow — a four-minute export, a VP9 transcode — it says so
before you commit, in the units you care about.

### Reversible

Timing is a read-time transform until you commit it. The one destructive action
asks first.

---

## 5. Personality sliders

| | | |
|---|---|---|
| Formal | ———●———— | Casual |
| Serious | ——●————— | Playful |
| Understated | ●——————— | Expressive |
| Calm | ●——————— | Energetic |
| Precise | ●——————— | Loose |

---

## 6. Voice

### Our voice is

- Plain. The word you would say out loud, not the impressive one.
- Specific. "Recording in realtime" rather than "Processing".
- Direct about consequence. "Expect a few minutes" rather than "This may take a
  while".

### Our voice is not

- Chatty, encouraging, or apologetic.
- Branded. No product name in the interface copy.
- Technical for its own sake. "This browser recorded VP8/VP9" appears because it
  explains a wait the user is about to sit through, not to show working.

---

## 7. Tone by context

### Product UI

Terse and factual. Labels describe actions: "Export .mp4", "Bake in",
"Clear all timestamps".

### Onboarding

None, and none planned. The hints under the transport and the offset are the
whole of it — they sit next to the control they explain and do not need
dismissing.

### Errors

Say what happened, then what can still be done. The conversion failure names the
error and points at the raw recording rather than leaving the user with nothing.

### Marketing

Not applicable. There is no marketing surface.

### Empty states

State the next action without blame: "Load a .txt file to break it into lines."

### Sensitive moments

The only one is losing work. Clearing all timestamps names the number being
cleared and confirms the lyrics survive.

---

## 8. Writing rules

### Prefer

- Verbs that describe the actual action.
- Numbers over adjectives — "4/4 stamped", "1080 × 1920", "+1200 ms".
- Naming the key inline where it is the fastest instruction: "tap Space".

### Avoid

- "Please", "Oops", "Successfully".
- Exclamation marks.
- Naming the product inside the product.
- Explaining the same thing in two places.

---

## 9. Visual direction

### The product should feel

Like a dark, matte working surface with one live colour on it.

### The product should avoid feeling

Glassy, glossy, neon, or gradient-heavy. Nothing should compete with the
preview, which is the only thing on screen whose appearance actually ships.

### Visual keywords

Matte. Warm-dark. Typographic. Still.

---

## 10. Logo

Not applicable. The product has a favicon — a 9:16 frame with one bright line
among dim ones — and a wordmark set in the UI typeface. Neither is a logo system
and neither needs one.

---

## 11. Typography

### Type roles

- Display and UI: Schibsted Grotesk, 600 for headings, 400 for body.
- Code, timestamps, and numbers: JetBrains Mono.
- Rendered video: Schibsted Grotesk 600.

### Typographic character

Neutral grotesque, tight but not condensed. The video renders in the same face
as the interface, so what is composed and what is exported share a voice.

### Rules

- Tabular numerals wherever a timestamp can change — a shifting playhead must
  not make the layout twitch.
- Monospace is reserved for values, never for prose.
- One type scale, defined in `tokens.css`.

---

## 12. Colour

### Colour roles

Warm neutrals carry everything structural. One teal accent marks what is live:
the active timestamp, the primary action, the progress bar.

### Colour personality

Warm-dark and matte, with a single cool accent for contrast against it.

### Rules

- Values live in `src/styles/tokens.css`, split into a raw scale and semantic
  roles. Components read the semantic layer only.
- Scale names mirror the personal brand token set, so swapping in canonical
  values is a one-file change.
- This tool uses the bold expression — teal as accent — because the default
  charcoal accent has no contrast to give on a dark surface.
- Accent is for state, never decoration. If everything is accented, nothing is.
- Contrast is enforced, not judged: `tests/contrast.test.js` fails the build if
  a token drops below 4.5:1 for text or 3:1 for a component boundary.

---

## 13. Shape and material

### Shape

Soft rectangles. A small radius on controls, a larger one on the video frame,
nothing circular except the scrub thumb.

### Material feeling

Matte and flat. Depth comes from surface lightness, not shadow.

### Rules

- No drop shadows. Elevation is `--surface` against `--surface-elevated`.
- Borders clarify a boundary or they are not there.
- One radius scale.

---

## 14. Imagery

Not applicable. The product contains no imagery. The only picture it makes is
the video, and that is the user's content.

---

## 15. Iconography

### Direction

Typographic glyphs rather than an icon set — `▶`, `❚❚`, `◉`, `+`, `×`. A tool
this small does not need an icon dependency.

### Rules

- Every glyph control carries a `title` and an `aria-label`. A glyph is never
  the only thing naming an action.
- If the glyph set ever outgrows what typography can carry clearly, adopt one
  icon family rather than mixing.

---

## 16. Motion identity

### Motion should feel

Like the lyric stack settling, not like an interface animating.

### Rules

- One eased scroll value drives the whole canvas stack. Nothing animates
  independently.
- UI transitions are short and limited to colour and opacity.
- Nothing animates on load.
- Anything decorative — the REC pulse — is removed under
  `prefers-reduced-motion`. Anything that carries meaning stays.

---

## 17. Brand expression by context

### Product interface

The full expression, and the only one that exists today.

### Marketing site

Not applicable.

### Social content

The exported video is the only artefact that leaves this tool, and it carries no
branding at all — no watermark, no name, no end card. It is the user's video.
This is deliberate and should stay that way.

### Documentation

`README.md` and the files in `docs/`. Plain, specific, and written so the
reasoning survives the session it was decided in.

---

## 18. Brand decision checklist

- Does it compete with the preview for attention?
- Does it use accent for state rather than decoration?
- Does the copy name the action, in the fewest plain words?
- Does it perform personality where it could just be quiet?
- Does it hold up under `prefers-reduced-motion`?
- Does it put anything on the exported video that is not the user's?
