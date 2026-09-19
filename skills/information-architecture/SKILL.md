---
name: information-architecture
description: Use when the product's pages, navigation structure, content hierarchy, or routing needs to be mapped before implementation begins — typically after a spec exists but before frontend work starts.
---

# Information architecture

Map the structure of the product before building it: what pages exist, how they connect, what lives on each one, and how users move through it.

This skill sits between `product-spec` and `frontend-design`. Its job is to make navigation, hierarchy, and routing decisions explicit so that frontend work starts with a clear structure rather than improvising it mid-build.

## When to use

Use when:

- starting a new product that has a spec but no clear page or navigation structure yet
- adding a significant feature that introduces new screens or changes how users navigate
- a redesign touches navigation, routing, or content hierarchy
- the frontend-design skill would otherwise need to invent structure on the fly

Skip when:

- the product has one page or screen — there is no structure to map
- navigation already exists and is not changing — just read it in `frontend-design`
- the feature is self-contained within an existing page

## Read first

Before mapping structure, read:

1. `docs/product-north-star.md`
2. `docs/brand.md`
3. `docs/design.md`
4. `docs/content.md`
5. `docs/architecture.md`
6. the relevant spec in `/specs`
7. any existing routing or navigation already in the codebase

If any of these files are missing, note what is unknown and continue with what is available.

## Core behaviour

- Start from user goals and tasks, not from interface conventions.
- Map what users need to do before deciding what pages should exist.
- Name pages and sections after what users accomplish there, not after how the UI is built.
- Distinguish between primary navigation (always available), secondary navigation (contextual), and in-page hierarchy (content structure within a page).
- Keep navigation flat where possible — depth adds friction.
- Make the hierarchy serve the most common user task first, edge cases second.
- If routing is relevant, define URL patterns that are stable, readable, and meaningful.
- Surface assumptions explicitly — especially about user types, entry points, and content volume.

## Avoid

- Treating IA as a flat sitemap — a list of URLs is not structure
- Making visual or layout decisions — that belongs in `frontend-design`
- Adding navigation layers to signal thoroughness — unnecessary depth creates confusion
- Designing for hypothetical user types not established in the spec or north star
- Leaving hierarchy decisions to the build phase

## Workflow

### 1. Understand the product scope

Identify:

- user types and their primary goals
- core tasks the product needs to support
- product constraints from `architecture.md`
- content types and volumes where known

If the scope is too vague to map, ask one clarifying question before proceeding.

### 2. Define the page inventory

List every screen or page the product needs. For each:

- name (what the user accomplishes here)
- purpose (one sentence)
- primary user type
- entry points (how users arrive)

Group related pages. Remove any that are redundant or serve no distinct user goal.

### 3. Map the navigation model

Decide:

- what constitutes primary navigation — what is always reachable
- what is secondary — contextual, within a section or flow
- what is modal or overlay — does not need navigation at all
- how deep the hierarchy goes — aim for two levels maximum unless the product genuinely requires more

Draw the structure as a simple outline, not a visual diagram.

### 4. Define content hierarchy per page

For each significant page, list:

- the primary action or content (what the user comes here for)
- supporting content (context, metadata, secondary actions)
- what is not on this page (content that belongs elsewhere)

Do not specify visual layout — order reflects priority, not position.

### 5. Define routing

If the product has URLs, specify:

- URL pattern for each page or dynamic route
- what makes a URL unique (ID, slug, date, etc.)
- which pages are public, authenticated, or role-restricted

Keep URL patterns short, lowercase, hyphenated, and human-readable.

### 6. Map key user flows

Trace the two or three most important user journeys through the structure:

- entry point
- steps through pages
- success state or exit
- most likely point of confusion or drop-off

Do not map every possible flow — only the ones that validate or stress-test the structure.

## File naming

Save the IA document as:

`/specs/YYYY-MM-DD-information-architecture.md`

If the IA is scoped to a specific feature, name it:

`/specs/YYYY-MM-DD-ia-feature-name.md`

## Output format

```md
## IA document created
`/specs/YYYY-MM-DD-information-architecture.md`

## Page inventory
[Table or list of pages with name, purpose, and primary user]

## Navigation model
[Outline of primary nav, secondary nav, and what is modal]

## Content hierarchy
[Per-page priority: primary content → supporting content → what's excluded]

## Routing
[URL patterns for each page or route type]

## Key user flows
[2–3 flows traced through the structure]

## Assumptions
- [Assumption — note what would change if wrong]

## Open questions
- [Question — who should answer it, or what unblocks it]

## Recommended next step
[Typically: review with stakeholders, then proceed to frontend-design]
```
