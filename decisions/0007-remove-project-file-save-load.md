# 0007 — Remove the project `.json` file; sessions in the app are the save

## Status

Accepted

## Context

`specs/2026-09-22-project-save-load.md` added Save project and Load project,
which wrote the project to a `.json` file the author kept outside the app. Two
days later, `decisions/0003` added Recent sessions: every song is saved in
IndexedDB as it changes, with its audio, keyed by lyrics file name, and can be
reopened with one click.

The two overlap. The file save asks for a manual step, leaves the project
outside the app, and doesn't carry the audio. The author prefers the project to
stay inside the app.

## Decision

Save project and Load project are removed, along with the code behind them
(`serializeProjectFile`, `parseProjectFile`, `PROJECT_FILE_VERSION`). The
Project section keeps **New project** and a hint that every song is saved in
the app, with its audio, and reopens from Recent sessions.

Nothing needs a new save action: sessions already save on every change. The
`load-project` reducer action stays, since opening a session uses it.

## Alternatives considered

- **A Save button that stores a named copy in the app.** Not chosen: sessions
  are already saved automatically, so a manual copy would add a second way to
  keep the same thing.
- **Keep the `.json` file as a backup alongside the in-app save.** Not chosen:
  the author wants the project inside the app.

## Consequences

### Positive

- One way to keep a song, and it needs no action.
- The saved song includes its audio, which the file never did.
- Less code and fewer tests to maintain, and one fewer versioned contract.

### Negative

- Sessions live in this browser's IndexedDB. A cleared browser profile, a
  different browser or another machine means the songs are gone, and there is
  no portable copy any more. This is the case the original spec was written
  for.
- A session is keyed by lyrics file name, so two songs with the same file name
  share one session (`decisions/0003`).
- There is still no way to delete a session (`docs/backlog.md` #6).
- Project files saved earlier can no longer be opened.

## Related files

- `src/App.jsx` — the Project section
- `src/state/project.js` — the removed helpers, `load-project`
- `src/lib/sessions.js`, `src/components/RecentSessions.jsx`
- `decisions/0003-indexeddb-sessions-with-audio.md`
- `specs/2026-09-22-project-save-load.md` (superseded)
- `docs/architecture.md` §7
