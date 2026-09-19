# Skills

This folder contains reusable agent skills: compact workflows that teach an AI assistant how to perform repeatable kinds of work well.

## Included skills

### `project-kickoff`
Use when starting a new digital product from a rough idea.

### `product-spec`
Use when turning a product or feature idea into a buildable specification.

### `information-architecture`
Use when mapping the product's pages, navigation structure, content hierarchy, and routing before implementation begins.

### `frontend-design`
Use when designing or implementing frontend work that should follow the project's own brand, design system, content rules, and technical constraints.

### `accessibility-review`
Use when reviewing a product, page, component, or implementation for accessibility before it is considered complete.

### `design-system`
Use when creating, reviewing, or evolving tokens, reusable components, variants, or shared interface patterns.

### `quality-gate`
Use near the end of meaningful work to judge whether it is actually ready according to the project's full quality bar.

### `project-setup-linear`
Use when creating the team-visible Linear structure for a new product project.

## Mental model

- Docs = memory
- Skills = methods
- Specs = current decisions
- ADRs = remembered reasons

## Suggested workflow

```txt
rough idea
→ project-kickoff
→ project-setup-linear
→ product-spec
→ information-architecture
→ frontend-design
→ design-system, when shared patterns emerge
→ accessibility-review
→ quality-gate
```

## Skill structure

Each skill lives in its own folder and starts with a `SKILL.md` file containing:

- YAML front matter with `name` and `description`
- the instructions for how the skill should behave
- any references, assets, or scripts the skill needs

## Using skills with other AI tools

Skills are plain markdown. They work with any LLM — not just Claude Code.

**Claude Code** registers each skill as a slash command using the `name:` field in the YAML front matter. Invoke with `/skill-name`.

**Other tools** (Gemini, GPT, Cursor, Windsurf, etc.) — paste the contents of the relevant `SKILL.md` as a system prompt, or reference it in your first message:

```
Use the instructions in `skills/product-spec/SKILL.md` to help me write a spec.
```

The YAML front matter at the top of each skill file is only used by Claude Code — other tools can ignore it.

## Maintaining skills

Skills drift from actual practice. The right time to update is immediately after running one through a real task — that's when the gap between the documented method and the actual method is clearest.

For deeper reviews, the process that works:

1. **Read the skill** — note what feels over-specified, under-specified, or no longer true.
2. **Search for external references** — community cursor rules, published coding guidelines, or comparable workflows from other teams. Look for intent, not implementation.
3. **Separate intentional choices from gaps** — some absences are design decisions (e.g. stack-agnostic language). Don't fill those. Focus on gaps that would cause an agent to produce worse output.
4. **Propose additions that preserve the skill's character** — each addition should feel like it belongs, not like it was imported from a different philosophy.
5. **Self-review after applying** — read the skill again as a whole. Check for duplicated principles, vague anchors, and instructions that depend on things that may not exist yet.

This process requires judgment at every step. It works as a conversation, not as an automated skill.

## Possible additions later

- `content-review`
- `architecture-review`
- `research-brief`
- `release-notes`
