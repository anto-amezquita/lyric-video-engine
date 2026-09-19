# Stage 6 — First build

## Goal

Turn the product direction into the first concrete spec.

## Explore

- smallest complete release
- main user story
- required flows
- functional requirements
- non-goals
- acceptance criteria
- first implementation phases

## Useful questions

- "What is the smallest thing we could ship that would still prove the product has value?"
- "What must a user be able to do from start to finish?"
- "What can we postpone without weakening the core idea?"
- "What would make you say: yes, the first version works?"

## Output from this stage

Create the first file in `/specs`, usually:

```txt
/specs/YYYY-MM-DD-mvp.md
```

or a more specific first-feature spec when that makes more sense.

Use `docs/spec.md` as the structure.

## Completion checklist

Before moving to Stage 7, confirm you have all of these:

- Smallest shippable version defined
- Main user story written
- Functional requirements listed
- Non-goals for this build named
- Acceptance criteria defined — clear enough to judge "done"
- First implementation phases identified

## Stage checkpoint

When the completion checklist is satisfied:

1. Show the progress indicator with Stages 1–6 marked ✓ and Stage 7 marked →.
2. Write or update `decisions/kickoff-checkpoint.md` with the current stage, decisions, assumptions, and open questions.
3. Ask: "Ready to continue to Stage 7 — Project setup and next step, or would you like to pause here?"

If the user pauses, let them know the checkpoint has been saved to `decisions/kickoff-checkpoint.md` — starting a new `/project-kickoff` session will pick up where they left off automatically.
