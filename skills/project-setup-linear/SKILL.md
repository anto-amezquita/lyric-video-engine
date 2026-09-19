---
name: project-setup-linear
description: Use when a new digital product project should be represented in Linear so the team can see lifecycle stage, current work, blockers, assumptions, revisit items, and links to the project's source-of-truth documents.
---

# Project setup in Linear

Create or define the Linear structure for a new product project so the team can understand where the project is, what is happening now, and what needs attention.

## Core principle

```txt
Repository = source of truth
Linear = shared map of the work
```

Do not move canonical product knowledge out of the repository to fit Linear. Use Linear to make project progress, blockers, uncertainty, and revisits visible.

## When to use

Use when:

- starting a new product project
- creating a team-visible project structure after kickoff
- translating the product operating system into Linear
- checking whether an existing Linear project reflects the current lifecycle

Skip when:

- the project already has an up-to-date Linear structure that just needs a status update
- the work is too small to warrant milestone-level tracking

## Read first

Before proposing or creating the Linear setup, read:

1. `docs/product-north-star.md` — to understand the project goal and current phase
2. `docs/linear-workflow.md` — for default milestones, statuses, labels, saved views, and the update template
3. the relevant spec in `/specs`, if one exists

## Core behaviour

- Keep the structure lightweight enough to help rather than burden the team.
- Scale down for small projects — if the full default milestone set is too heavy, propose a reduced version and explain why.
- Explain the purpose of non-obvious choices so the user understands the model, not just the output.
- Make uncertainty visible. Open questions belong in labelled issues, not private notes.
- If Linear API access is unavailable, produce a copy-ready setup plan rather than stopping.

## Workflow

### 1. Understand the project

Before proposing structure, identify:

- the project goal and the outcome that marks it as done
- the current phase — where in the lifecycle it sits today
- how large the team is and whether the full default structure would help or burden them
- whether a first spec already exists in `/specs`

### 2. Decide on structure

Using `docs/linear-workflow.md` as the source for all defaults:

- Select which milestones fit the actual lifecycle — remove any that do not apply at this scale
- Confirm the starting project status
- Identify which labels and saved views the team will actually use
- Note which repo docs to link from the project overview

If the project is very small or early, propose a reduced version. Explain the trade-off clearly.

### 3. Create or plan the setup

If Linear API access is available: create the structure directly.

If not: produce a copy-ready plan the user can apply manually — every element should be named and ready to paste.

In either case, explain any deviation from the defaults in `docs/linear-workflow.md`.

## Output format

```md
# Linear project setup

## Initiative
[Name and purpose, or "none" if the project stands alone.]

## Project
[Name and starting status. Reason for the chosen status if not "Idea shaping".]

## Milestones
[List — include only those relevant to this project. Note any defaults omitted and why.]

## Initial issues
[By milestone. Drawn from docs/linear-workflow.md defaults, adapted to this project.]

## Labels in use
[Which labels are set up. Brief note on any omitted from the default set.]

## Saved views
[Which views are set up. Omit any that don't serve this team's needs.]

## Linked docs
[Repo docs linked from the project overview.]

## Update rhythm
[Recommended cadence for this project — weekly is default during active work.]

## Why this structure fits the project
[One short paragraph. Focus on any deviations from the defaults and the reasoning.]

## Items to revisit later
[Anything deferred or uncertain about the Linear setup itself.]
```

## Review checklist

- Is the repo still the single source of truth?
- Does the project have a clear outcome?
- Do the milestones show the lifecycle clearly?
- Are issues actionable rather than vague containers?
- Are important repo docs linked from the project overview?
- Are blockers, assumptions, and revisits easy to find?
- Could a teammate understand the project state quickly?
- Is the Linear structure helping the work rather than duplicating the repo?
