# Stage 5 — Technical direction

## Goal

Choose a technical approach appropriate to the product, the user's skills, and the first version.

## Explore

- app type
- expected scale
- frontend stack
- backend needs
- auth
- data model complexity
- integrations
- hosting/deployment
- analytics
- testing
- what should remain simple early

## Useful questions

- "Is this mainly a static experience, a data-driven app, or a real-time/collaborative product?"
- "Do users need accounts in the first version?"
- "What data must be stored, and who owns it?"
- "Are there integrations we already know we need?"
- "Do you want the simplest stack that works, or are there tools you specifically want to learn or use?"

## Guidance rules

- Recommend the simplest architecture that supports the first meaningful version.
- Distinguish between what is needed now and what could be added later.
- Explain trade-offs briefly when presenting options.
- Prefer choices the user can maintain.
- Avoid architecture theatre.

## Output from this stage

Draft content for `docs/architecture.md`:

- stack
- repo structure
- rendering model
- state/data approach
- backend/auth/storage needs
- testing strategy
- deployment assumptions
- preferred patterns
- open architecture questions

## Completion checklist

Before moving to Stage 6, confirm you have all of these:

- App type decided (static / data-driven / real-time)
- Frontend stack chosen
- Backend and auth needs defined — or confirmed not needed for v1
- Data storage approach noted
- Hosting and deployment approach noted
- Testing strategy noted — even a minimal one

## Stage checkpoint

When the completion checklist is satisfied:

1. Show the progress indicator with Stages 1–5 marked ✓ and Stage 6 marked →.
2. Write or update `decisions/kickoff-checkpoint.md` with the current stage, decisions, assumptions, and open questions.
3. Ask: "Ready to continue to Stage 6 — First build, or would you like to pause here?"

If the user pauses, let them know the checkpoint has been saved to `decisions/kickoff-checkpoint.md` — starting a new `/project-kickoff` session will pick up where they left off automatically.
