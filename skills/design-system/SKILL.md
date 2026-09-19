---
name: design-system
description: Use when creating, reviewing, or evolving design tokens, reusable UI components, variants, patterns, or shared interface rules in a digital product.
---

# Design system

Help the product grow as a coherent system instead of a collection of isolated screens.

This skill should determine when something belongs as a token, component, pattern, one-off, or product-specific implementation detail.

## Read first

Before making system decisions, read:

1. `docs/product-north-star.md`
2. `docs/brand.md`
3. `docs/design.md`
4. `docs/content.md`
5. `docs/architecture.md`
6. `docs/quality.md`
7. relevant specs in `/specs`
8. existing tokens, components, and patterns in the codebase

## Core behaviour

- Prefer reusable system decisions over duplicated one-offs.
- Do not over-systematise premature ideas.
- Protect shared components from product-specific business logic.
- Keep brand decisions in tokens where appropriate rather than leaking them into component logic.
- Favour semantic tokens over raw values.
- Require a clear reason before adding new variants, tokens, or patterns.
- Think in terms of scale, maintenance, and future reuse.
- Make trade-offs explicit.

## Decide what kind of thing it is

### Token

Use a token when the value represents a repeatable design decision, such as:

- colour role
- spacing step
- type style
- radius
- motion duration
- shadow
- breakpoint
- z-index
- elevation level

Ask:

- Does this encode a repeated decision?
- Should multiple components depend on it?
- Could it change by brand or theme?

**Token chain:** tokens follow a three-tier hierarchy — primitive → semantic → component. Semantic tokens reference primitives; component tokens reference semantic tokens. No component definition should hardcode a raw value that already exists as a token.

**Radius as design language:** corner radius is not just a dimension — it communicates personality (sharp = structured, rounded = approachable). Treat it as a deliberate brand decision, not a visual detail.

### Component

Use a component when there is a reusable interface object with stable anatomy, behaviour, and states.

Ask:

- Does it appear in multiple places?
- Does it have repeatable structure and interaction?
- Can it stay free of one-off page logic?

### Pattern

Use a pattern when several components combine into a repeatable solution to a user problem.

Examples:

- form layout
- empty state
- filter bar
- search result list
- article card system
- dialog flow
- notification pattern

### One-off

Keep it one-off when:

- it serves a unique page need
- reuse is speculative
- abstraction would make the system less clear
- the design has not repeated enough to prove itself

## Review areas

### 1. Tokens

Check:

- semantic naming
- unnecessary duplication
- brand/theme separation
- raw values that should become tokens
- token hierarchy
- whether a new token solves a repeatable need

### 2. Elevation

Check:

- how depth is communicated (shadow, tint, blur, border, opacity, z-index — or a combination)
- whether the elevation system is consistent and token-driven
- whether depth decisions encode hierarchy or are applied arbitrarily

### 3. Components

Check:

- clear purpose
- anatomy
- variants
- states — at minimum: default, hover, focus, active, disabled. Consider also: loading, error, empty, selected
- responsive behaviour
- content rules
- accessibility behaviour
- API clarity
- separation between reusable UI and feature logic
- all token references point to semantic tokens, not raw values

### 4. Patterns

Check:

- repeated use case
- composition rules
- when to use / when not to use
- content guidance
- accessibility behaviour
- responsive behaviour

### 5. Consistency

Check:

- duplicated solutions
- variant explosion
- naming drift
- inconsistent state treatment
- component overlap
- old patterns that should be retired
- raw values appearing in two or more places without a token — each is a tokenisation candidate
- tokens that nothing references — each is a removal or consolidation candidate

## Workflow

### 1. Understand the need

Identify:

- what problem is being solved
- where it appears
- whether it is new, repeated, or only anticipated
- what existing system pieces are nearby

### 2. Classify the solution

Recommend one of:

- use existing token/component/pattern
- extend existing token/component/pattern
- create new token/component/pattern
- keep as a one-off for now
- reject because it adds system noise

### 3. Document the decision

When proposing something reusable, define:

- purpose
- use cases
- non-use cases
- anatomy
- variants
- states
- responsive behaviour
- accessibility behaviour
- token usage
- examples
- migration or adoption notes if relevant

### 4. Check architecture fit

Ensure the system decision:

- follows `architecture.md`
- uses shared tokens correctly
- does not leak domain logic into primitives
- remains maintainable

### 5. Recommend ADR when needed

Create or recommend an ADR when the system decision materially changes:

- token architecture
- theming strategy
- component model
- naming conventions
- package structure
- multi-brand behaviour

## Output format

Use a concise structure such as:

```md
# Design system review

## Need

## Recommendation

## Why

## Classification
Token | Component | Pattern | One-off | Reject

## Proposed definition

## Reuse impact

## Risks / trade-offs

## Next steps
```

## Final review checklist

- Are we solving a repeated need rather than inventing abstraction too early?
- Is the recommendation token, component, pattern, one-off, or reject?
- Does the decision improve coherence without creating unnecessary complexity?
- Are variants necessary?
- Are all relevant states covered?
- Is accessibility part of the definition?
- Is brand logic kept in the right layer?
- Would another designer or developer understand when to use this?
