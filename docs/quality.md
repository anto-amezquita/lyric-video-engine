# quality.md

## Purpose

This file defines the product-wide quality bar.

A feature is not complete because it renders on screen. It is complete when it works reliably, is understandable, accessible, responsive, maintainable, and ready to ship.

This document exists to make quality repeatable rather than subjective.

---

## 1. Definition of done

Work is done when:

- the relevant spec has been satisfied
- the main flow works
- important edge cases are handled
- accessibility expectations are met
- responsive behaviour is verified
- tests are added or updated where appropriate
- analytics are implemented when required
- no known critical issues remain
- documentation is updated when the work changes shared behaviour
- relevant architectural decisions are recorded

---

## 2. Functional quality

Before release, confirm:

- all acceptance criteria are met
- user flows work from start to finish
- errors are handled and understandable
- empty states are meaningful
- loading states are appropriate
- permissions behave correctly
- data persists and updates as expected
- destructive actions are safe and clear
- recoverable actions are recoverable

---

## 3. Accessibility

### Minimum expectations

- keyboard access for all interactive elements
- visible focus states
- semantic HTML where applicable
- meaningful labels and names
- sufficient colour contrast
- non-colour indicators for meaning
- logical reading and tab order
- support for text resizing
- reduced-motion behaviour where relevant
- clear error identification and recovery
- touch targets large enough for practical use

### Review questions

- Can the full flow be completed with a keyboard?
- Is focus order logical?
- Are controls named clearly?
- Does the experience still make sense without colour?
- Are status changes announced when needed?
- Does reduced motion remove unnecessary movement without breaking understanding?

---

## 4. Responsive quality

Check relevant breakpoints and input modes.

### Verify

- content reflows without breaking
- priority is preserved on small screens
- no essential action becomes unreachable
- line lengths remain readable
- controls remain usable by touch
- layouts work with realistic content lengths
- hover-only interactions have touch equivalents when needed

---

## 5. Content quality

- labels are clear and specific
- terminology is consistent
- error messages explain what happened and what to do next
- empty states help users understand the situation
- button labels describe actions
- copy follows `content.md`
- no placeholder text remains in production work

---

## 6. Visual quality

- design follows `design.md`
- brand expression follows `brand.md`
- tokens are used instead of arbitrary values where applicable
- spacing and typography are consistent
- component states are visually distinct
- visual hierarchy is clear
- interfaces work with realistic data, not only ideal content

---

## 7. Technical quality

- implementation follows `architecture.md`
- code is typed where expected
- reusable patterns are reused
- no unnecessary duplication is introduced
- error handling follows project conventions
- side effects are contained and understandable
- important paths are covered by tests where appropriate
- linting, formatting, and type checks pass

---

## 8. Performance

### Define project targets

- initial load: under 100kB gzipped for the app bundle. Currently ~77kB.
- interaction responsiveness: the canvas holds 60fps while the lyric editor
  stays typable. Nothing that runs per frame may pass through React state.
- image handling: the product ships no images. The only large asset is the
  ffmpeg.wasm core (32MB), which must stay behind a dynamic import and must
  never load on a path that does not need it.
- bundle expectations: no component library, no CSS framework. A new dependency
  needs a reason recorded in `/decisions`.
- server response expectations: not applicable — there is no server.

### General expectations

- avoid unnecessary network requests
- avoid unnecessary re-renders
- use appropriate image sizes and formats
- lazy-load where it improves user experience
- keep motion smooth and purposeful
- do not trade away clarity for premature optimization

---

## 9. Browser and device support

### Supported browsers

- Chrome (current) — primary. Records MP4 directly.
- Safari 17+ — records MP4 directly.
- Firefox (current) — records WebM; export goes through in-browser conversion.
- Edge (current) — Chromium, behaves as Chrome.

### Supported devices

- Desktop, mouse and keyboard — the target. The sync pass assumes a keyboard.
- Tablet — the layout collapses and the preview is usable for review, but
  syncing without a keyboard is not a supported workflow.

### Degradation rules

A browser that cannot record a canvas stream must say so plainly and disable
export rather than failing at the end of a four-minute pass. A browser without
`localStorage` must still run — persistence is a convenience, not a feature, and
every access to it is already wrapped.

Without JavaScript there is no product. That is acceptable and not worth
designing around.

---

## 10. Analytics and observability

When relevant:

- key user actions are tracked
- event names follow shared conventions
- properties are meaningful and stable
- success and failure states are observable
- errors are reported with enough context to diagnose
- analytics do not collect unnecessary sensitive data

---

## 11. Security and privacy review

- access control is enforced
- sensitive data is not exposed in the client unnecessarily
- inputs are validated
- secrets are not committed
- personal data handling matches policy
- destructive or sensitive actions are appropriately protected
- third-party dependencies are justified

---

## 12. Testing expectations

### Unit tests
The reducer and the pure helpers, and specifically the guarantees the product
rests on: a text edit must not move an index or a timestamp, a re-import must
carry timestamps over by position, and baking an offset must fold it in exactly
once. Contrast is also a unit test — `tests/contrast.test.js` reads
`tokens.css`, so an illegible token fails `npm test` rather than a review.

### Integration tests
`e2e/sync.test.mjs` drives real keypresses in a real browser and asserts what
lands in the line list: that Space stamps at the playhead, that the offset is
subtracted, that typing a lyric containing spaces stamps nothing, and that a
text edit moves neither a timestamp nor a line.

### End-to-end tests
`e2e/export.test.mjs`, run with `npm run test:e2e`. It forces each of the three
export routes by masking `MediaRecorder.isTypeSupported`, then decodes every
output to confirm H.264 video plus AAC audio at 1080×1920, matching durations,
and frames that actually differ across the file.

It uses the Chrome installed on the machine rather than a Playwright-managed
build, so `npm ci` pulls no browser binaries and the suite skips cleanly where
Chrome is missing.

### Manual QA
- A full sync pass against a real song, by ear.
- That the exported file actually plays where it is going to be posted.
- Tab order and focus visibility after any layout change.

### Regression checks
Anything touching the reducer risks the decoupling guarantees — run `npm test`.
Anything touching `tokens.css` risks contrast — same command. Anything touching
`renderFrame.js` or the canvas element risks the export, because the export
records that exact canvas.

---

## 13. Release checklist

Before shipping:

- [ ] Spec reviewed against implementation
- [ ] Acceptance criteria met
- [ ] Accessibility reviewed
- [ ] Responsive behaviour checked
- [ ] Tests passing
- [ ] Lint/type checks passing
- [ ] ~~Analytics implemented where needed~~ — not applicable, the product has none
- [ ] Documentation updated
- [ ] Important decisions recorded
- [ ] Rollback or recovery considered if relevant

---

## 14. Post-release checks

After shipping:

- [ ] Core flows verified in the built bundle (`npm run preview`), not just dev
- [ ] ~~Errors monitored~~ — not applicable, no server and no telemetry
- [ ] ~~Analytics checked~~ — not applicable
- [ ] Performance checked
- [ ] The tool was actually used on a real song since the change

---

## Final review checklist

- Does it work?
- Is it understandable?
- Is it accessible?
- Is it responsive?
- Is it consistent with the system?
- Is it maintainable?
- Is it observable?
- Is it safe to release?
