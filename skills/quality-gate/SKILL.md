---
name: quality-gate
description: Use near the end of meaningful product work to review whether a feature, flow, page, or release is actually ready according to the project's spec, design, content, architecture, accessibility, testing, and release standards.
---

# Quality gate

Run a final, product-wide readiness review before meaningful work is considered complete.

This skill exists to prevent "it appears to work" from being mistaken for "it is ready."

## When to use

Use when:

- a feature, flow, or page is approaching done
- a PR or release needs a cross-cutting readiness check
- work touches multiple systems and no single reviewer has the full picture

Skip when:

- the work is a trivial fix or isolated copy change
- the feature already has a dedicated review process that covers all areas

## Read first

Before reviewing, read:

1. `docs/product-north-star.md`
2. `docs/brand.md`
3. `docs/design.md`
4. `docs/content.md`
5. `docs/architecture.md`
6. `docs/quality.md`
7. the relevant spec in `/specs`
8. relevant ADRs in `/decisions`
9. the implementation being reviewed

## Core behaviour

- Review the work against the actual spec, not only against the visible UI.
- Distinguish clearly between: done, done with known follow-ups, and not ready.
- Prefer concrete evidence over optimistic language.
- Surface gaps — do not silently waive requirements. If something is skipped, name the trade-off.
- Do not call work complete if critical acceptance criteria are unmet.
- Adjust depth to scope: a small feature does not need the same weight as a major release, but all areas should still be considered.

## Workflow

### 1. Establish scope

Before reviewing, identify:

- what is being reviewed (feature, page, flow, release)
- which spec governs it and what "done" means here
- what the most likely failure points are — let those shape where you look hardest

### 2. Review evidence

Read the implementation, tests, and relevant docs. For each review area below, look for evidence of completeness — not just absence of obvious problems. If no evidence exists, treat the area as unverified.

### 3. Classify findings

#### Blockers
Critical acceptance criteria unmet, or a behaviour that would embarrass the product in production. Must be fixed before release.

#### Important follow-ups
Gaps that should be fixed soon but do not prevent a careful release. Document clearly.

#### Nice-to-have improvements
Useful refinements that do not undermine readiness.

### 4. Give a release recommendation

Use one of:

- **Ready** — all critical criteria met, no blockers
- **Ready after small fixes** — minor fixes needed, no blockers against merging
- **Not ready** — one or more blockers must be resolved first

State the reason plainly. If you are uncertain, say so — an uncertain recommendation is more useful than a confident wrong one.

## Review areas

### 1. Product fit

- Work still supports the product direction
- User problem is actually addressed
- Scope matches the spec — neither over nor under
- Non-goals have not crept in
- No major behaviour invented outside the docs

### 2. Spec coverage

- Goals satisfied
- Functional requirements met
- Non-functional requirements met
- User flows tested end to end
- Edge cases handled
- Acceptance criteria verifiably met
- Assumptions and open questions resolved or explicitly deferred

### 3. UX and visual quality

- Visual hierarchy is clear
- Responsive behaviour works at relevant breakpoints
- All relevant states present: loading, empty, success, error, permission, destructive
- Motion behaviour considered
- Consistent with `brand.md` and `design.md`
- Copy follows `content.md` — no placeholder text, no generic labels
- Realistic content used in review, not idealised samples

### 4. Accessibility

- Keyboard access for all interactive elements
- Visible focus states
- Correct semantic HTML
- Meaningful labels and names
- Sufficient colour contrast
- Non-colour indicators for meaning
- Logical reading and tab order
- Reduced-motion behaviour considered
- Errors identifiable and recoverable
- Touch targets usable in practice

Use `accessibility-review` when a deeper accessibility pass is needed.

### 5. Technical quality

- Implementation fits `architecture.md`
- Existing components and tokens reused — no unnecessary duplication
- Error handling present and consistent with project conventions
- Type safety maintained where expected
- State and data flow correct
- Maintainability considered
- Relevant ADRs updated or created

### 6. Testing and validation

- Relevant tests added or updated
- Tests, linting, and type checks pass
- Manual QA done where automated coverage is insufficient
- Regressions considered
- Browser or device behaviour checked where relevant

### 7. Analytics and observability

*Check when relevant:*

- Key events implemented
- Success and failure states observable
- Error reporting present
- Monitoring needs considered
- No unnecessary sensitive data collected

### 8. Release readiness

- Documentation updated for any shared behaviour that changed
- Migration or rollout steps identified if needed
- Feature flags considered where rollback risk is high
- Known issues listed
- Production checks identified

## Output format

```md
# Quality gate review

## Scope
[What was reviewed and which spec governed it.]

## Overall recommendation
Ready | Ready after small fixes | Not ready
[Reason in one or two sentences.]

## What is confirmed complete
[Areas reviewed with positive evidence — be specific.]

## Blockers
[Each blocker: what it is, where it is, why it blocks.]

## Important follow-ups
[Each follow-up: what it is, why it matters, who should handle it.]

## Nice-to-have improvements
[Optional — only include if there are real candidates.]

## Evidence reviewed
[Files, tests, flows, or docs read during the review.]

## Suggested next actions
[Ordered — what should happen first, and who owns it.]
```
