# architecture.md

## Purpose

This file defines the stable technical rules of the product.

Feature specs may describe implementation details for one piece of work. This document defines the shared architecture that should remain consistent across the whole product.

The goal is to help contributors and AI agents make technical decisions that fit the system rather than solving each task in isolation.

---

## 1. Stack

### Frontend

- framework: React 19 + Vite
- language: JavaScript (ESM, `.jsx`)
- styling: plain CSS with custom properties — no CSS framework, no UI library
- component system: local components in `src/components/`
- animation: canvas easing in the render loop; CSS transitions in the UI
- forms: native inputs, uncontrolled where a draft value is needed
- state management: one `useReducer` over the project; refs for per-frame values
- data fetching: none — every file is read locally
- routing: none — single view

### Backend

- runtime / framework: none
- database: none — project state is held in `localStorage`
- auth: none
- file storage: none — audio and lyrics stay in the browser
- background jobs: none
- email / notifications: none

### Tooling

- package manager: npm
- linting: oxlint (`.oxlintrc.json`)
- formatting: Prettier — no semicolons, single quotes, 100 columns
- testing: `node --test` over `tests/*.test.js`
- CI/CD: not set up yet
- deployment: static — any host that serves the `dist/` folder

---

## 2. Repository structure

```txt
src/
  components/   presentational components; no timing or file logic
  hooks/        stateful behaviour tied to browser APIs
  lib/          pure or DOM-only helpers, no React
  state/        the project reducer and its derived selectors
  styles/       tokens.css and global.css
tests/          node --test suites over src/lib and src/state
```

### Structure rules

- `lib/` and `state/` must stay importable without React, so they stay testable
  under plain `node --test`.
- Anything that runs per animation frame lives in `lib/` or a ref, never in
  React state.
- Components receive the clock through `engine.subscribe`; they never poll.

---

## 3. Architectural principles

Choose the principles that should guide the codebase.

### Example principles

#### Prefer composition over duplication

Shared behaviour should be extracted when it is meaningfully reusable, not copied across features.

#### Keep domain logic close to the domain

Business rules should live in places that make ownership and change easy to understand.

#### Separate visual components from feature logic

Reusable interface components should not contain one-off product behaviour.

#### Optimize for clarity before cleverness

Prefer code that is easy to reason about and maintain over code that is merely compact or novel.

---

## 4. Frontend architecture

### Routing

Single view. If a second view is ever needed, add routing then — not before.

### Rendering model

Client-side only. The app is a static bundle with no server at runtime.

### State management

All project data — lines, timestamps, offset, style — lives in one reducer in
`src/state/project.js` and is persisted to `localStorage` on change.

Playback position is deliberately *not* React state. `audio.currentTime` is read
each animation frame and pushed to subscribers, so a moving playhead never
triggers a render. Components that need to show the time keep their own
throttled copy.

### Data fetching

None. Files arrive through `<input type="file">` and are read with `FileReader` or an object URL.

### Forms and validation

Timestamp fields hold a draft string while being edited and commit on blur or
Enter. `parseTime` returns `null` for anything unusable, and an unusable value
leaves the stored timestamp alone rather than clearing it.

### Components

One component per file in `src/components/`, named for what it is. Components
stay presentational; behaviour that touches a browser API lives in a hook. Rows
in long lists are memoised.

### Styling

Plain CSS. Tokens are CSS custom properties in `src/styles/tokens.css`, split
into a raw scale (`--warm-500`, `--teal-500`) and semantic roles (`--background`,
`--action-primary`). Components consume the semantic layer only.

The scale names mirror the personal brand token set, so swapping in canonical
values is a one-file change. This tool uses the bold expression — teal as
accent — because the UI is a dark editing surface.

Layout is a two-pane grid that collapses to one column below 900px.

### Accessibility

Native elements throughout — buttons are buttons, the file inputs are real file
inputs kept visually hidden but reachable. Every control has a label or
`aria-label`. Focus is visible via a single `:focus-visible` rule. Keyboard
shortcuts stand down while a text field has focus. The one destructive action
(clearing all timestamps) is confirmed.

---

## 5. Backend architecture

There is no backend, and adding one would break the product's main promise:
audio and lyrics never leave the browser. If server work is ever proposed, it
needs an ADR that addresses that promise first.

---

## 6. Data architecture

### Core entities

- **Line** — `{ id, text, time }`. `time` is seconds from the start of the
  audio, or `null` when the line has not been stamped yet.
- **Project** — `{ lines, offsetMs, cursor, lyricsName, style }`.
- **Style** — `{ fontScale, align, uppercase, accentActive, showProgress }`.

### Conventions

- ids: opaque strings, generated locally, never displayed and never persisted
  anywhere but `localStorage`.
- timestamps: seconds as a number for stored values; milliseconds as an integer
  for the global offset, because that is the unit people think in when nudging
  against a recut.
- `null` means "not stamped yet" and is distinct from `0`, which is a real
  timestamp at the top of the track.
- deletes are immediate; there is no soft delete and no undo. The one
  destructive bulk action is confirmed.
- migrations: the storage key carries the shape version. A breaking change takes
  a new key rather than a migration.

### Data ownership

`src/state/project.js` owns everything that persists. `useAudioEngine` owns
playback position and the Web Audio graph, and owns them in refs — no other
module may keep a copy.

---

## 7. API conventions

No APIs. The only versioned contract is the `localStorage` key
`lyric-video-engine/project/v1`; a breaking change to the project shape needs a
new key, and `loadStoredProject` must fall back to an empty project rather than
throw.

---

## 8. Design system integration

### Tokens

`src/styles/tokens.css`, as CSS custom properties. Components read the semantic
layer (`--surface`, `--action-primary`); only the semantic layer reads the raw
scale. Canvas colours are the one exception — they are literal hex values in
`src/lib/renderFrame.js`, because a canvas cannot read custom properties.

### Components

Components live in `src/components/` and are documented by the spec's component
table plus a comment at the top of each file explaining why it exists.

### Variants

CSS modifier classes (`.btn--primary`, `.btn--ghost`) and `data-` attributes for
state (`data-active`, `data-cursor`). No variant props that fan out into
conditional styling inside components.

### Theming

One dark theme. The app is a video editing surface, so a light mode would work
against the preview rather than for it.

---

## 9. Code conventions

### Naming

- files: `PascalCase.jsx` for components, `camelCase.js` for everything else
- components: named exports, named for the thing (`Transport`, `LyricLines`)
- hooks: `use` prefix, one browser concern each
- utilities: verb-first (`buildLines`, `findActiveIndex`, `convertToMp4`)
- types: none — plain objects, with the shapes documented in the spec

### Type safety

No TypeScript. The data model is three fields wide and pinned by tests instead.
If the model grows past the project/line/style shapes, revisit this.

### Error handling

Browser capability gaps are expected, not exceptional: check support, then say
what is missing and what to do about it. The export pipeline never discards a
successful recording because a later step failed — the raw file stays
downloadable.

`try`/`catch` around storage access is deliberate; `localStorage` throws in
private mode and persistence is a convenience, not a feature.

### Logging

None in production. ffmpeg's log stream is available through `convertToMp4`'s
`onLog` for debugging, and is not wired up by default.

### Comments

Comment the decision, not the mechanism. A comment earns its place when it says
why something is the way it is — why Space is the tap key rather than play/pause,
why `classWorkerURL` must not be passed to ffmpeg — because that reasoning is
not recoverable from the code.

---

## 10. Testing strategy

### Unit tests

The reducer and the pure helpers, in `tests/`. Specifically the decoupling
guarantees: a text edit must not move an index or a timestamp, a re-import must
carry timestamps over by position, and baking the offset must fold it in exactly
once. These are the rules the product is built on, so they are the rules that
get pinned.

### Integration tests

Not set up. The reducer tests cover the state layer; the browser layer is
covered manually for now.

### End-to-end tests

Not set up, and worth adding: the export pipeline has three routes (direct,
remux, transcode) and only one of them runs in any given browser. They were
verified by driving Chrome with `MediaRecorder.isTypeSupported` masked to force
each route. That check belongs in a committed suite. Tracked in
`docs/backlog.md`.

### Visual regression

Not set up. The canvas renderer is the obvious candidate — a handful of frames
at known timestamps.

### Accessibility testing

Manual for now: tab through every control, confirm focus is visible, confirm
shortcuts stand down inside text fields.

---

## 11. Security and privacy

- No accounts, no authentication, no authorization — there is nothing to log in to.
- No secrets. The app has no keys, and nothing to put them in.
- Audio and lyrics are processed entirely in the browser and never transmitted.
  Treat any proposal to send them anywhere as a product change, not a technical one.
- The only third-party request at runtime is the Google Fonts stylesheet. The
  ffmpeg.wasm core is served from the app's own bundle, deliberately, so an
  export works offline.
- Object URLs are revoked when the file they point at is replaced.

---

## 12. Performance

### Targets

- The canvas holds 60fps while the lyric editor stays responsive.
- The initial bundle stays under 100kB gzipped. It is currently ~77kB.
- ffmpeg.wasm (32MB) is never downloaded unless a conversion is actually needed.

### Preferred practices

- Measure text wrapping once per text/style change, never per frame.
- Drive per-frame work from one shared `requestAnimationFrame` loop.
- Memoise list rows so a timestamp edit re-renders one row, not the song.
- Import anything large behind a dynamic `import()` at the point of use.

### Avoid

- Putting playback position in React state.
- A second `requestAnimationFrame` loop, or any timer that runs parallel to
  `audio.currentTime`.
- Recomputing canvas layout inside the draw call.

---

## 13. Observability

None, by design. There is no server to report to, and adding client-side
telemetry would put lyric content within reach of a third party. Failures are
surfaced to the person in the export panel instead.

---

## 14. Deployment and environments

### Environments

- local — `npm run dev`
- production — `npm run build`, then serve `dist/` from any static host

### Environment variables

None.

### Deployment process

Not set up yet. Whatever host is chosen must serve `.wasm` as
`application/wasm`, or the conversion fallback will fail to load.

### Rollback strategy

Redeploy the previous build. There is no state on a server to roll back.

---

## 15. Preferred patterns

- One reducer for project data; refs for anything read per frame.
- Timestamps decoupled from text — always address a line by `id`, never rewrite
  a line object wholesale from a text action.
- Read-time transforms (the global offset) over destructive edits, with an
  explicit "bake" when the user wants to commit.
- Detect a browser capability, then explain the consequence in the UI.
- Native elements before custom ones.

---

## 16. Patterns to avoid

- Storing a derived value that could be computed from `audio.currentTime`.
- Rewriting stored timestamps when a read-time offset would do.
- A UI component that reaches for the audio element directly instead of going
  through the engine.
- Adding a component library. The UI is plain semantic HTML on purpose.

---

## 17. Open architectural questions

- Should the export move to WebCodecs (`VideoEncoder`) once support settles?
  It would be faster than realtime and drop the ffmpeg dependency, at the cost
  of hand-writing an MP4 muxer. See `decisions/0001`.
- Is positional carry-over on re-import the right match strategy, or should
  lines be matched by text similarity so reordering survives too?
- Does the project shape need a real migration path, or is resetting to an empty
  project acceptable on a `v2` key?

---

## Final review checklist

- Is the stack explicit?
- Is the folder structure clear?
- Are frontend and backend responsibilities separated?
- Are data and API conventions defined?
- Are design tokens and components integrated into the architecture?
- Are testing expectations visible?
- Are security, privacy, and performance considered?
- Are preferred patterns and anti-patterns named?
- Could an AI coding agent make consistent technical choices from this file?
