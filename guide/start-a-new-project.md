# start-a-new-project

This guide leads an AI assistant through starting a new digital product from a rough idea to a clear first spec and project foundation.

## Structure

The guide is split into stage files so each stage can be loaded on demand:

| File | Contents |
|---|---|
| `guide/stages/00-behavior.md` | Behavioral rules, progress indicator, document generation rules |
| `guide/stages/01-idea.md` | Stage 1 — Idea |
| `guide/stages/02-product-direction.md` | Stage 2 — Product direction |
| `guide/stages/03-brand-character.md` | Stage 3 — Brand character |
| `guide/stages/04-experience-direction.md` | Stage 4 — Experience direction |
| `guide/stages/05-technical-direction.md` | Stage 5 — Technical direction |
| `guide/stages/06-first-build.md` | Stage 6 — First build |
| `guide/stages/07-setup.md` | Stage 7 — Project setup and next step |

## For Claude Code

Use `/project-kickoff` — it reads the stage files automatically, one at a time.

## For other AI assistants

Paste the contents of `guide/stages/00-behavior.md` to establish the rules, then paste each stage file as you reach it. Use the prompt below to begin:

```md
Use the content I'm about to share to guide me through starting a new digital product.

Ask me one main question at a time. Help me think when I am unsure by suggesting useful options and trade-offs. Keep track of decisions, assumptions, and open questions as we go. Once the idea is clear enough, help me create the core project documents and the first spec.
```

Then paste `guide/stages/00-behavior.md` followed by `guide/stages/01-idea.md`.
