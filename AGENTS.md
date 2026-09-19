# Project instructions

## Agent Quick Start

- Purpose: help an AI coding agent become productive quickly in this repo.
- Read core docs first: [docs/backlog.md](docs/backlog.md) — check this first, it's the only doc here expected to change turn to turn — then [docs/product-north-star.md](docs/product-north-star.md), [docs/architecture.md](docs/architecture.md), [docs/quality.md](docs/quality.md), and the relevant file in `/specs`.
- Skills: use the manifests under `skills/` for repeatable workflows (see `skills/README.md`).
- Finding build/test commands: look for `package.json`, `Makefile`, or `README.md` in the repo root; if none exist, ask a human before running environment-changing commands.
- Keep changes here minimal and link to repository docs rather than duplicating them.

Before doing meaningful product work, read:

1. `docs/backlog.md` — is there open work already in flight?
2. `docs/product-north-star.md`
3. `docs/brand.md`
4. `docs/design.md`
5. `docs/content.md`
6. `docs/architecture.md`
7. `docs/quality.md`
8. the relevant file in `/specs`, if one exists

For new features or significant changes:

- create or update a spec before implementation
- follow existing architecture and component patterns
- reuse tokens and components before creating new ones
- do not invent product behaviour not supported by the docs or spec
- update `/decisions` when making important architectural choices
- validate the work against `docs/quality.md` before considering it complete

Do not:

- introduce new patterns without a documented reason
- hard-code design values when tokens exist
- change brand, design, architecture, or quality rules casually
- hide assumptions or unresolved decisions inside implementation


## Available skills

Use the relevant skill when the task matches:

- `skills/project-kickoff/SKILL.md` — starting a new digital product from a rough idea
- `skills/product-spec/SKILL.md` — creating or updating a meaningful product or feature spec
- `skills/information-architecture/SKILL.md` — mapping the product's pages, navigation structure, and routing before implementation begins
- `skills/frontend-design/SKILL.md` — designing or implementing frontend work that must follow the product system
- `skills/design-system/SKILL.md` — creating or reviewing shared tokens, components, variants, and patterns
- `skills/accessibility-review/SKILL.md` — reviewing product work for accessibility before it is considered complete
- `skills/quality-gate/SKILL.md` — checking whether meaningful work is actually ready to ship
- `skills/project-setup-linear/SKILL.md` — representing a new product project in Linear so progress and revisits are visible
