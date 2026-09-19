---
name: frontend-design
description: Use when designing or implementing a visually strong digital interface, page, component, prototype, or frontend feature that should follow this product's brand, design system, content rules, architecture, and quality bar rather than generic UI patterns.
---

# Frontend design

Design and implement frontend work that is clear, intentional, distinctive, and faithful to the project system.

This skill should keep the work close to the product's actual character rather than defaulting to generic AI-looking layouts.

## Read first

Before designing or implementing, read:

1. `docs/product-north-star.md`
2. `docs/brand.md`
3. `docs/design.md`
4. `docs/content.md`
5. `docs/architecture.md`
6. `docs/quality.md`
7. the relevant spec in `/specs`
8. existing components, tokens, and nearby product patterns

If any of these files are missing, ask before assuming — do not substitute generic defaults for undecided product decisions.

## Core design priorities

- Start with the product context and user task, not component count.
- Create strong hierarchy through layout, typography, spacing, contrast, and motion.
- Follow the product's brand character instead of using generic visual defaults.
- Reuse tokens, components, and patterns before adding new ones.
- Make important states first-class:
  - default
  - hover
  - focus
  - active
  - selected
  - loading
  - empty
  - success
  - error
  - disabled
- Keep accessibility and responsive behaviour inside the design from the start.
- Use purposeful motion; do not animate everything.
- Product UI should feel right for its domain:
  - tools and workspaces should favour scanning, density, and repeated action
  - editorial experiences may use more atmospheric composition
  - marketing pages may be more expressive, but still coherent

## Avoid

- generic card grids by default
- weak hierarchy
- decorative clutter
- empty brand adjectives without implementation consequences
- one-off styles when a token or component should exist
- inaccessible interactions
- placeholder copy that survives into final UI
- design choices that contradict the spec or product principles

## Workflow

### 1. Understand the task

Identify:

- user goal
- primary action
- relevant product principle
- screen or component context
- success state

### 2. Inspect the system

Look for:

- existing components
- tokens
- typography rules
- spacing rules
- interaction patterns
- responsive conventions
- component structure, naming, and export conventions
- testing patterns already in use

### 3. Propose the approach

Before implementing meaningful work, state briefly:

- layout direction
- hierarchy
- reused patterns
- any necessary new components or tokens
- assumptions

### 4. Implement

Follow `architecture.md`.

Keep components reusable and avoid leaking feature-specific logic into shared UI primitives.

Avoid introducing dependencies for patterns the codebase already handles; consider rendering cost when choosing between equivalent approaches.

### 5. Validate

Review against:

- `brand.md`
- `design.md`
- `content.md`
- `quality.md`
- the relevant spec acceptance criteria

Check that interactive components, complex state transitions, and error states have test coverage consistent with the project's existing testing patterns.

When the environment supports it, inspect the UI in a real browser at multiple sizes and iterate on visual polish and interaction states.

## Final response

Report:

1. what was designed or implemented
2. the main design decisions
3. which existing tokens/components/patterns were reused
4. any new reusable elements introduced
5. accessibility and responsive checks performed
6. remaining risks or follow-ups
