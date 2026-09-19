---
name: accessibility-review
description: Use when reviewing a digital product, page, component, flow, or frontend implementation for accessibility before it is considered complete or shipped.
---

# Accessibility review

Review product work for accessibility as part of the product quality bar, not as a last-minute add-on.

This skill should help identify issues, explain their user impact, and suggest concrete fixes that fit the project's existing design and architecture.

## Read first

Before reviewing, read:

1. `docs/product-north-star.md`
2. `docs/brand.md`
3. `docs/design.md`
4. `docs/content.md`
5. `docs/architecture.md`
6. `docs/quality.md`
7. the relevant spec in `/specs`
8. the relevant UI implementation, components, and styles

## Core behaviour

- Treat accessibility as a product requirement, not optional polish.
- Review both design intent and implementation details.
- Prefer concrete findings over generic checklists.
- Explain why an issue matters to a user.
- Distinguish between:
  - confirmed issues
  - likely issues that need verification
  - improvements that are optional but valuable
- Suggest fixes that fit existing tokens, components, and patterns.
- Do not recommend visual changes that contradict `brand.md` or `design.md` without explaining the trade-off.
- Do not rely only on automated checks; consider real interaction and reading order.

## Review areas

### 1. Keyboard access

Check:

- all interactive elements are reachable
- focus order is logical
- focus is visible
- keyboard interactions match expected patterns
- no keyboard traps exist
- dialogs, menus, and overlays manage focus correctly

### 2. Semantics and structure

Check:

- landmarks and headings support understanding
- heading hierarchy is sequential — no skipped levels, no headings used for visual styling
- buttons, links, inputs, lists, tables, and dialogs use appropriate semantics
- interactive ARIA patterns follow expected keyboard conventions — tabs use arrow keys, dialogs trap focus and return it on close, comboboxes handle expansion and selection correctly, accordions toggle on Enter/Space
- controls have meaningful accessible names — not "button", "image", or the visual label repeated as a description
- decorative content is hidden when appropriate
- dynamic content changes are announced via ARIA live regions at the appropriate politeness level (`polite` for updates, `assertive` for urgent interruptions, `status`/`alert` roles where semantically correct)

### 3. Forms and errors

Check:

- labels are persistent and meaningful
- helper text is connected to fields where needed
- required fields are clear
- `autocomplete` attributes are present on fields with a known input purpose (name, email, address, phone, card number) — WCAG 1.3.5
- errors identify the problem and the next step
- invalid fields expose their state programmatically

### 4. Colour and contrast

Check:

- text contrast meets 4.5:1 for normal text, 3:1 for large text (18pt+ or 14pt+ bold) — WCAG 1.4.3
- non-text contrast meets 3:1 for UI components and focus indicators — WCAG 1.4.11
- meaning is not conveyed by colour alone
- disabled states remain understandable without relying solely on reduced opacity
- charts, status, and alerts have non-colour cues when relevant

Contrast ratios should be verified against the brand palette in `brand.md`.

### 5. Content and language

Check:

- link text makes sense out of context
- instructions do not depend only on visual position
- error text is specific and non-blaming
- headings and labels are descriptive
- important information is not hidden inside placeholder text

### 6. Motion and media

Check:

- reduced-motion preferences are respected
- animation does not block understanding or interaction
- autoplaying media is controlled appropriately
- images with meaning have text alternatives
- decorative images do not create noise for assistive technology

### 7. Responsive and zoom behaviour

Check:

- content remains usable at narrow widths
- text resize does not break essential flows
- touch targets remain practical
- essential actions remain reachable
- layouts survive realistic content lengths

## Review workflow

### 1. Understand the scope

Identify:

- what is being reviewed
- the user goal
- the relevant spec and acceptance criteria
- whether this is design review, code review, or both

### 2. Inspect the experience

Walk through the core flow as a user would, then revisit each review area systematically:

- trace keyboard-only navigation from start to finish
- check reading order matches visual hierarchy in the source
- verify focus is visible, logical, and managed correctly across all interactive patterns
- confirm all relevant states — default, hover, focus, active, disabled, loading, error, empty
- test the narrowest realistic viewport and text resize to 200%
- read error states and instructions as a first-time user would — checking for specificity and non-blame tone

### 3. Produce findings

Organise findings by severity:

#### Critical
Blocks task completion or excludes users from the core flow.

#### Major
Creates serious friction or misunderstanding.

#### Moderate
Creates avoidable difficulty but has a workaround.

#### Minor
Improves quality and consistency but is unlikely to block use.

For each finding, include:

- issue
- affected user or scenario
- why it matters
- recommended fix
- relevant file/component if known

### 4. Summarise quality

End with:

- what works well
- what must be fixed before release
- what should be improved soon
- what needs manual verification if not directly testable

## Output format

Use this structure unless another format is more useful:

```md
# Accessibility review

## Scope

## What works well

## Findings

### Critical
- ...

### Major
- ...

### Moderate
- ...

### Minor
- ...

## Recommended fixes in priority order

## Manual verification still needed

## Release recommendation
Ready | Ready after fixes | Not ready
```

## Final review checklist

- Can the full core flow be completed with keyboard only?
- Is focus visible and logical?
- Are controls named clearly?
- Does the structure make sense to assistive technology?
- Are errors understandable and recoverable?
- Is meaning available without colour?
- Does the experience remain usable with reduced motion?
- Does it survive small screens, zoom, and realistic content?
- Are findings specific enough that someone could fix them without guessing?
