---
name: product-spec
description: Use when turning a product or feature idea into a buildable technical specification that aligns with the existing product, brand, design, content, architecture, and quality rules.
---

# Product spec

Create or update a product technical specification for a meaningful feature, workflow, redesign, or new product slice.

## Read first

Before writing a spec, read:

1. `docs/product-north-star.md`
2. `docs/brand.md`
3. `docs/design.md`
4. `docs/content.md`
5. `docs/architecture.md`
6. `docs/quality.md`
7. `docs/spec.md`
8. any relevant existing files in `/specs`
9. any relevant ADRs in `/decisions`

## When to use

Use this skill for:

- a new product
- a major feature
- a meaningful redesign
- a workflow affecting multiple parts of the product
- any work where behaviour, technical structure, or scope could otherwise become unclear

Do not use a full spec for:

- tiny copy changes
- isolated visual adjustments
- trivial bug fixes
- tasks already fully defined elsewhere

## Core behaviour

- Start from the user problem and desired outcome.
- Keep product intent, UX behaviour, and implementation decisions connected throughout the spec.
- Ask at most one clarifying question at a time — do not front-load a list before starting work.
- When information is missing but not blocking, make a reasonable assumption, label it clearly, and continue.
- Surface trade-offs, dependencies, risks, and open questions explicitly — do not bury them inside technical language.
- Make requirements testable, not aspirational.
- Do not invent product behaviour that conflicts with the core docs.
- Do not let early sections grow at the expense of acceptance criteria — criteria are what make the spec executable.

## Workflow

### 1. Understand the brief

Identify:

- the feature or product slice being specified
- the user problem it solves and who it solves it for
- the desired outcome when the work is done
- any constraints or context already known

If the brief is too vague to start, ask one targeted question before proceeding.

### 2. Read context

Review the docs listed above. Look for:

- existing patterns this feature should follow or extend
- constraints in `architecture.md` that affect the approach
- brand or content rules that shape the UX
- overlapping or related specs in `/specs`

### 3. Surface gaps

Before drafting, note:

- what is known, what is assumed, and what is genuinely unknown
- which gaps must be resolved before writing (ask once, concisely)
- which gaps can be assumed and labelled — keep them visible, never buried

### 4. Write the spec

Follow the structure in `docs/spec.md`.

Guidance for the sections most likely to go wrong:

- **Goals vs. non-goals:** goals describe outcomes for users; non-goals explicitly exclude things that would otherwise creep into scope
- **Functional requirements:** write as verifiable statements — if a QA engineer couldn't test it directly, rewrite it
- **Technical approach:** describe responsibilities and shape, not implementation detail — unless the detail affects behaviour, architecture, or future maintainability
- **Interface and component breakdown:** cover states before structure — states drive complexity and are the part most often skipped
- **Acceptance criteria:** write as pass/fail statements, not hoped-for outcomes — these are the definition of done

### 5. Review

Check the spec against the checklist below before returning it.

## File naming

Save specs as:

`/specs/YYYY-MM-DD-feature-name.md`

Use lowercase, hyphenated, specific names.

## Review before finalising

- Is the user problem clear and specific?
- Is the desired outcome clear?
- Are goals stated as outcomes, not implementation tasks?
- Are non-goals explicit?
- Are the main user flows described step by step?
- Are loading, empty, success, error, and permission states covered where relevant?
- Are functional requirements specific and testable?
- Are accessibility and responsive behaviour addressed where relevant?
- Are data, dependencies, and permissions visible?
- Is the technical approach described at the right level — shape and responsibilities, not over-specified implementation?
- Are assumptions, decisions, and open questions clearly separated?
- Are acceptance criteria verifiable pass/fail statements?
- Could a competent contributor begin work without the author in the room for every major decision?

## Output format

```md
## Spec created
`/specs/YYYY-MM-DD-feature-name.md`

## Summary
[One or two sentences on what this spec covers.]

## Key decisions
- [Decision]

## Assumptions
- [Assumption — note what would change if this is wrong]

## Open questions
- [Question — who should answer it, or what unblocks it]

## Recommended next step
[One clear action: design exploration, ADR, stakeholder sign-off, or start implementation.]
```

Once implementation against this spec is complete, run `quality-gate` before considering the work done — a solid spec makes a good build likely, it does not confirm one happened.
