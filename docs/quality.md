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

- initial load: [ ]
- interaction responsiveness: [ ]
- image handling: [ ]
- bundle expectations: [ ]
- server response expectations: [ ]

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

- [Browser / version]
- [Browser / version]

### Supported devices

- [Device class]
- [Device class]

### Degradation rules

[Describe what must still work in less capable environments.]

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
[What normally deserves unit tests.]

### Integration tests
[What normally deserves integration tests.]

### End-to-end tests
[What normally deserves E2E coverage.]

### Manual QA
[What should still be checked manually.]

### Regression checks
[What existing behaviour may be affected.]

---

## 13. Release checklist

Before shipping:

- [ ] Spec reviewed against implementation
- [ ] Acceptance criteria met
- [ ] Accessibility reviewed
- [ ] Responsive behaviour checked
- [ ] Tests passing
- [ ] Lint/type checks passing
- [ ] Analytics implemented where needed
- [ ] Documentation updated
- [ ] Important decisions recorded
- [ ] Rollback or recovery considered if relevant

---

## 14. Post-release checks

After shipping:

- [ ] Core flows verified in production
- [ ] Errors monitored
- [ ] Analytics checked
- [ ] Performance checked
- [ ] User feedback reviewed when available

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
