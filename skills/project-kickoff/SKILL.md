---
name: project-kickoff
description: Use when starting a new digital product or app from a rough idea and the user needs guided help shaping the product direction, brand, experience, technical approach, and first spec before implementation.
---

# Project kickoff

Guide the user through the beginning of a new digital product project.

This skill is for turning a loose idea into a clear project foundation. It should feel like a thoughtful product workshop, not a form.

## When to use

Use when:

- starting a brand-new product from a rough idea
- no project foundation docs exist yet and direction needs to be shaped before implementation
- the user needs guided help across product, brand, design, and technical decisions together

Skip when:

- the project already has established docs — use the relevant targeted skill instead (product-spec, design-system, quality-gate)
- the user just needs a spec for a specific feature — use `product-spec` instead

## On startup

Before reading anything else, check for `decisions/kickoff-checkpoint.md`.

- **If it exists:** read it, tell the user briefly where they left off (stage, key decisions, open questions), confirm they want to continue, then resume from the next incomplete stage. Do not restart from Stage 1. Do not ask about path — it is already in motion.
- **If it does not exist:** ask the path question below before beginning Stage 1.

## Path selection

On a fresh start, ask this **before** the first Stage 1 question:

> Before we begin — full kickoff or lean?
>
> **Full** (7 stages): product direction, brand, experience, tech, spec, setup. Better when brand and design decisions need thinking through.
>
> **Lean** (6 stages): same outcome, brand and experience compressed into one quick pass. Better when you want to reach a spec and technical direction fast.

**Full path:** stages 1 → 2 → 3 → 4 → 5 → 6 → 7

**Lean path:** stages 1 → 2 → 3+4 combined → 5 → 6 → 7

For the lean path, read `guide/stages/03-04-lean.md` instead of stages 3 and 4, and use this progress indicator:

```txt
1. Idea
2. Product direction
3. Brand + experience
4. Technical direction
5. First build
6. Setup
```

## Read first

Before beginning, read:

1. `guide/stages/00-behavior.md` — behavioral rules, always needed
2. any existing files in `docs/` — if some docs already exist, build on them rather than starting over
3. `AGENTS.md`, if present

Then, **just before starting each stage**, read the corresponding stage file:

Full path:
- Stage 1: `guide/stages/01-idea.md`
- Stage 2: `guide/stages/02-product-direction.md`
- Stage 3: `guide/stages/03-brand-character.md`
- Stage 4: `guide/stages/04-experience-direction.md`
- Stage 5: `guide/stages/05-technical-direction.md`
- Stage 6: `guide/stages/06-first-build.md`
- Stage 7: `guide/stages/07-setup.md`

Lean path (stages 3+4 replaced):
- Stage 3+4: `guide/stages/03-04-lean.md`
- All other stages: same files as full path

Do not read all stage files upfront. Read each one when you are about to begin it.

**Lean path stage number mapping:** The files for stages 5, 6, and 7 use full-path stage numbers in their progress indicators. When on the lean path, adapt them to lean-path numbers before displaying:

| File | Full-path number | Lean-path number |
|---|---|---|
| `05-technical-direction.md` | Stage 5 | Stage 4 |
| `06-first-build.md` | Stage 6 | Stage 5 |
| `07-setup.md` | Stage 7 | Stage 6 |

## Core behaviour

- Ask one main question at a time.
- When the user is unsure, offer 2–4 plausible options with brief trade-offs rather than waiting for clarity.
- Make provisional assumptions rather than stopping; label them clearly and keep them visible.
- Track three things throughout: **Decisions**, **Assumptions**, **Open questions**.
- Summarise the emerging product at natural checkpoints.
- Challenge unnecessary scope gently — prefer the smallest strong first version over a broad weak one.
- Do not generate final documents before the idea has enough shape.

## Checkpoint behavior

At every stage transition, automatically write or update `decisions/kickoff-checkpoint.md`. Do not ask the user to copy anything — the file is the checkpoint.

Use this format:

```md
# Kickoff checkpoint

path: [full or lean]
next-stage: [N]

## Progress
[List the stages for the chosen path, marking each ✓ completed or → in progress]

## Decisions
- [decision]

## Assumptions
- [assumption]

## Open questions
- [question]
```

When Stage 7 is complete and all required files have been created, delete `decisions/kickoff-checkpoint.md` — the project docs are now the source of truth.

## Stages

Follow the process defined in `guide/stages/`:

1. Idea
2. Product direction
3. Brand character
4. Experience direction
5. Technical direction
6. First build
7. Project setup and next step

Show a compact progress indicator at natural checkpoints.

## Required outputs

By the end, create or update:

- `docs/backlog.md`
- `docs/product-north-star.md`
- `docs/brand.md`
- `docs/design.md`
- `docs/content.md`
- `docs/architecture.md`
- `docs/quality.md`
- the first relevant spec in `/specs`
- `AGENTS.md`

If major technical choices are made, create an ADR in `/decisions`.

Not all docs need to reach final form in one session — create what the conversation has shaped clearly, and note what remains unresolved.

## Handoff model

The point of a solid spec is to enable a full handoff, not just a well-documented conversation. Once Stage 7 produces the implementation prompt, the expectation is: build end to end, log real decisions in `/decisions`, and only pause for genuine ambiguity — not for routine execution choices. See the example implementation prompt in `guide/stages/07-setup.md`.

## Optional: Linear setup

After completing all required outputs, offer to run `project-setup-linear` if the project involves a team or the user wants visible progress tracking. Offer it; do not require it.

## Output format

End the kickoff with:

```md
## Product summary
[What the product is, who it's for, and what the first version does — two or three sentences.]

## Key decisions
- [Decision made]

## Assumptions
- [Assumption — note what would change if this turns out to be wrong]

## Open questions
- [Question — what unblocks it or who should answer it]

## Files created or updated
- [File path]

## Next step
[One clear action to take immediately.]

## Implementation prompt
[Ready-to-use prompt for starting implementation.]
```

## Quality bar

This skill succeeds when:

- the product becomes clearer through the conversation
- the user feels helped rather than processed
- useful options appear when the answer is not obvious
- important trade-offs become visible
- the first version becomes smaller and stronger
- the generated files feel like the natural output of the conversation
