# spec.md

## Purpose

This document defines how product technical specifications should be created in this project.

A good spec is not just a list of features. It is a bridge between product intent, user experience, and implementation. It should make clear:

- what we are building
- why it should exist
- how it should behave
- what constraints shape it
- what must be true when it is done

The goal is to remove avoidable ambiguity before implementation begins, while keeping the document practical enough to support real decisions during design and development.

---

## Core principles

### 1. Start with the user problem

Every spec must begin with the problem being solved and the value created for the user.

### 2. Keep product intent connected to technical decisions

Technical choices should not drift away from the reason the product exists.

### 3. Prefer clarity over completeness theatre

A useful spec is not the longest possible document. It is the clearest document that makes the work buildable.

### 4. Make important decisions explicit

Do not hide assumptions, constraints, trade-offs, or open questions inside vague language.

### 5. Write for execution

A competent designer, developer, or AI coding agent should be able to work from the spec without inventing major product decisions along the way.

---

## When to create a spec

Create a product technical spec for:

- a new digital product
- a major feature
- a meaningful redesign
- a workflow that affects multiple parts of the product
- any work where product behaviour, technical structure, or scope could otherwise become unclear

A full spec is usually not needed for:

- small copy changes
- isolated visual adjustments
- minor bug fixes
- tasks already fully defined in another source of truth

---

## Required context before writing

Before creating a spec, review any relevant source documents, including:

1. `product-north-star.md`
2. `brand.md`
3. `design.md`
4. `content.md`
5. `architecture.md`
6. `quality.md`
7. Existing relevant specs

If important information is missing, do not stop by default. Make the best reasonable assumption, mark it clearly as an assumption, and continue.

---

## What every spec must answer

1. What problem are we solving?
2. Who are we solving it for?
3. What should the user be able to do?
4. What is included, and what is not?
5. How should the experience behave in normal, edge, empty, loading, success, and error states?
6. What data, rules, permissions, and dependencies are involved?
7. What technical shape does the solution need?
8. What trade-offs or risks are known?
9. What remains undecided?
10. How will we know the work is complete?

---

## Required spec structure

# [Product or feature name]

## 1. Overview

### Summary
[A short description of what is being built.]

### Problem
[What problem exists today, for whom, and why it matters.]

### Intended users
[Primary and important secondary users.]

### Desired outcome
[What should become possible or better when this work is complete.]

---

## 2. Goals and non-goals

### Goals
- [Outcome]
- [Outcome]

### Non-goals
- [Deliberately excluded item]
- [Deliberately excluded item]

### Success criteria
- [Observable success]
- [Observable success]

---

## 3. User experience

### Primary user stories
- As a [user], I want to [action] so I can [outcome].

### Main user flows
[Describe the core flows step by step.]

### States and edge cases
Cover relevant states, including:

- default
- loading
- empty
- success
- error
- disabled
- permission denied
- offline or degraded behaviour
- first-time versus returning-user behaviour, when relevant

### UX notes
[Important interaction, content, accessibility, or responsive behaviour.]

---

## 4. Functional requirements

Use numbered, testable statements.

- `FR-01` The user can...
- `FR-02` The system must...
- `FR-03` The interface shows...

---

## 5. Non-functional requirements

Include only what is relevant:

- performance
- accessibility
- responsive behaviour
- browser/device support
- security/privacy
- SEO
- analytics
- localization
- maintainability

---

## 6. Information architecture and data

### Data entities
[List the main objects involved.]

### Fields
[Describe important fields, types, validation rules, and whether they are required or optional.]

### Relationships
[How entities connect to one another.]

### Permissions
[Who can view, create, edit, delete, or trigger what.]

### State changes
[How relevant data changes over time.]

---

## 7. Technical approach

### Proposed architecture
[High-level shape of the solution.]

### Frontend responsibilities
[Rendering, local state, validation, routing, interaction logic, etc.]

### Backend responsibilities
[Persistence, business logic, permissions, validation, jobs, integrations, etc.]

### APIs and integrations
[Endpoints, payloads, services, CMS dependencies, auth systems, or external contracts.]

### Reused systems
[Existing components, tokens, hooks, utilities, services, or patterns to reuse.]

### New technical work
[What likely needs to be added or changed.]

---

## 8. Interface and component breakdown

### [Component name]

- **Purpose:** [Why it exists]
- **Inputs:** [Data or props it needs]
- **Outputs:** [Events, callbacks, or data it produces]
- **Variants:** [Relevant visual or behavioural versions]
- **States:** [Default, hover, focus, active, disabled, loading, error, empty, etc.]
- **Responsive behaviour:** [What changes across screen sizes]
- **Accessibility notes:** [Semantics, labels, keyboard behaviour, announcements]
- **Dependencies:** [Related components, tokens, data, APIs, or services]

---

## 9. Risks, trade-offs, assumptions, and open questions

### Risks
- [Risk]

### Trade-offs
- [Trade-off]

### Assumptions
- [Assumption]

### Open questions
- [Question]

---

## 10. Acceptance criteria

- [Specific, verifiable statement]
- [Specific, verifiable statement]

---

## 11. Implementation plan

### Phase 1 — Foundations
[Schemas, routes, APIs, shared types, tokens, base components.]

### Phase 2 — Core functionality
[Main user flow and minimum complete behaviour.]

### Phase 3 — States and edge cases
[Error handling, empty states, loading states, permissions, degraded cases.]

### Phase 4 — Polish
[Responsive refinement, motion, copy, accessibility improvements, analytics.]

### Phase 5 — Validation and release
[Testing, QA, documentation, rollout, monitoring.]

---

## Writing rules

- Lead with the human reason, then explain the system.
- Use direct, concrete language.
- Separate facts, assumptions, and decisions.
- Prefer testable statements over abstract wording.
- Do not use technical detail to hide an unresolved product decision.
- Do not prescribe implementation detail unless it affects behaviour, architecture, constraints, or future maintainability.
- Keep the document compact, but never at the cost of clarity.
- Use diagrams when they explain a flow better than paragraphs.
- Use tables when comparison is clearer than prose.
- Avoid filler. Every section should help someone understand, decide, build, or test.

---

## Definition of ready

A spec is ready when:

- the problem is clear
- the intended users are clear
- goals and non-goals are explicit
- the main flows are described
- functional requirements are testable
- important states and edge cases are covered
- technical responsibilities are visible
- dependencies and constraints are named
- risks, assumptions, and open questions are exposed
- acceptance criteria are concrete
- a competent contributor could begin work without needing the author in the room for every major decision

---

## File naming

Store generated specs in:

`/specs/YYYY-MM-DD-feature-name.md`

---

## Final review checklist

- Is the user problem clear?
- Is the desired outcome clear?
- Are goals distinct from implementation tasks?
- Is the scope explicit?
- Are non-goals included?
- Are all major flows covered?
- Are empty, loading, success, and error states described?
- Are requirements specific and testable?
- Are accessibility and responsive behaviour addressed where relevant?
- Are data, permissions, and dependencies visible?
- Are decisions separated from assumptions?
- Are open questions named rather than hidden?
- Could a developer build the first version from this?
- Could a designer see what still needs design work?
- Could an AI coding agent follow this without inventing the product?
