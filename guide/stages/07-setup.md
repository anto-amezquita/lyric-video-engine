# Stage 7 — Project setup and next step

## Goal

Turn the decisions into a usable project starting point.

## Required outputs

Create or update:

```txt
/docs/backlog.md
/docs/product-north-star.md
/docs/brand.md
/docs/design.md
/docs/content.md
/docs/architecture.md
/docs/quality.md
/specs/YYYY-MM-DD-[first-spec].md
AGENTS.md
.claude/settings.json
```

For `.claude/settings.json`, copy `templates/claude-settings.json` from the starter kit as the starting point, then add any project-specific tooling commands (e.g. `pnpm *`, `Bash(git -C * add:*)` for multi-package repos) surfaced during Stage 5. This exists so category-based permissions are in place from day one instead of accumulating one approved command at a time.

If the project uses multiple AI coding tools, optionally add thin adapter files such as:

```txt
CLAUDE.md
GEMINI.md
.github/copilot-instructions.md
```

Each adapter should point to the same shared documents rather than duplicating the whole product truth.

## Final summary to the user

At the end, provide:

1. a concise product summary
2. the strongest decisions made
3. assumptions still in play
4. open questions worth revisiting later
5. the files created or updated
6. the best next action
7. a ready-to-use implementation prompt

## Offering Linear setup

After presenting items 1–6, and if the project involves more than one person or the user has mentioned wanting visible progress tracking, offer:

> One more optional step: I can set up the Linear structure for this project — milestones, labels, and links to your docs — so the work is visible from day one. Want to do that now?

If yes, follow `skills/project-setup-linear/SKILL.md`.
If no, proceed to the implementation prompt.

This step is optional. The offer is enough.

### Example final implementation prompt

```md
Read the project docs in `/docs`, then implement Phase 1 of `/specs/YYYY-MM-DD-mvp.md`.

Before coding:
- check `backlog.md` for any open item this work should account for
- confirm the scope against `product-north-star.md`
- follow the visual and interaction rules in `brand.md`, `design.md`, and `content.md`
- follow the technical conventions in `architecture.md`
- use `quality.md` as the definition of done

During implementation:
- build end to end without stopping for approval at each step
- only pause if something in the spec is genuinely ambiguous, not for routine execution choices
- reuse existing tokens, components, and patterns before creating new ones
- do not invent product behaviour that is not supported by the spec
- make any necessary assumptions explicit
- log any real decisions made along the way in `/decisions`

Before considering the work complete:
- validate the implementation against the acceptance criteria
- run the relevant tests and checks
- report what was completed, what changed, and any remaining risks
```

## On completion

When all required files have been created, delete `decisions/kickoff-checkpoint.md` — the project docs are now the source of truth.
