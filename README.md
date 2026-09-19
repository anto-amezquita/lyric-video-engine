# AI Product Starter Kit

A starting point for AI-assisted products that have to last longer than one
session.

Coding agents can read your code. What they can't read is the decision behind
it — why this pattern and not the three you tried first, which brand rule is
deliberate, what "done" means on this project. That reasoning usually lives in
a chat window that closes, so the next session re-argues it instead of building
on it.

This kit keeps it. Seven documents hold the project's stable truth (six
stable references plus a live backlog), specs hold feature definitions,
decisions hold the calls you've made and why, and eight skills hold the
repeatable ways of working with all of it. Agents enter through `AGENTS.md`
and read the same files a person would — nothing is written twice.

A decision kept together with its reasoning can be amended when you know
better. One kept without it can only be argued again from the start.

**Where it fits.** Multi-session work over weeks, where a person is making real
calls about product, brand, design, architecture and quality — especially
working solo, with nobody to ask what was decided last month. It's the wrong
tool for a weekend prototype, where the overhead outweighs the benefit, and it
adds little to a mature codebase that's already well documented.

This is a GitHub template: use it as the starting point for a new project, or
read it and take the parts you want.

## Start here

1. Read `docs/backlog.md` — the only one of these expected to change turn to turn
2. Read `docs/product-north-star.md`
3. Read `docs/brand.md`
4. Read `docs/design.md`
5. Read `docs/content.md`
6. Read `docs/architecture.md`
7. Read `docs/quality.md`
8. For feature work, read the relevant file in `/specs`

## Working model

- Stable product rules live in `/docs`
- Feature definitions live in `/specs`
- Important technical decisions live in `/decisions`
- AI agents should begin with `AGENTS.md`

## Default workflow

1. Clarify the product intent
2. Create or update a spec
3. Design the flow and components
4. Implement within the architecture rules
5. Validate against the quality bar
6. Record important decisions

## Suggested setup order for a new project

1. Create `docs/backlog.md` from the template (usually starts empty)
2. Fill in `docs/product-north-star.md`
3. Adapt `docs/brand.md`
4. Adapt `docs/design.md`
5. Complete `docs/content.md`
6. Complete `docs/architecture.md`
7. Review `docs/quality.md`
8. Create the first product spec in `/specs`
9. Start building from that spec

## Optional cross-LLM adapter files

This starter kit includes `AGENTS.md` as the default agent entry file.

If you also use other coding agents, create small adapter files that point to the same shared docs:

- `CLAUDE.md`
- `GEMINI.md`
- `.github/copilot-instructions.md`

Keep the shared truth in `/docs`, not inside each adapter file.


## Starting a new project with the guide

Read `START-HERE.md`. In Claude Code, run `/project-kickoff` directly. With other AI assistants, follow the prompt in `START-HERE.md` to load `guide/start-a-new-project.md`.

The guide will lead you through the product idea, direction, brand, experience, technical setup, first spec, and next build step one question at a time.


## Reusable skills

This starter kit includes eight skills in `/skills`:

- `project-kickoff`
- `product-spec`
- `information-architecture`
- `frontend-design`
- `accessibility-review`
- `design-system`
- `quality-gate`
- `project-setup-linear`

The docs hold the project's truth. The skills hold repeatable ways of working with that truth.

A useful default workflow is:

```txt
rough idea
→ project-kickoff
→ project-setup-linear  (or via the offer at end of /project-kickoff)
→ product-spec
→ information-architecture
→ frontend-design
→ design-system, when shared patterns emerge
→ accessibility-review
→ quality-gate
```


## Linear as the team-visible layer

Use `docs/linear-workflow.md` to represent the product operating system in Linear without moving the source of truth out of the repo.

```txt
Repository = what we know
Linear = where that knowledge is in motion
```

The starter workflow uses:

- Initiatives for larger goals
- Projects for coherent bodies of work
- Milestones for lifecycle stages
- Issues for concrete next work
- Labels and saved views for blockers, assumptions, and revisits
- Project updates for the current story of the work

Use `skills/project-setup-linear/SKILL.md` when creating the Linear structure for a new product project.
