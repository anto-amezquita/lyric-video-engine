import { formatRelativeTime } from '../lib/time.js'

/**
 * The bottom strip: every song synced, most recently updated first.
 * Clicking one hands the raw session record back to the caller, which
 * builds a project from it (`projectFromSession`) and restores its audio.
 */
export function RecentSessions({ sessions, activeLyricsName, onSelect }) {
  if (!sessions.length) return null

  return (
    <div className="app__sessions">
      <span className="section__title">Recent sessions</span>
      <div className="sessions">
        {sessions.map((session) => {
          const active = session.lyricsName === activeLyricsName
          return (
            <button
              key={session.id}
              type="button"
              className="session"
              data-active={active}
              aria-current={active || undefined}
              aria-label={`Open ${session.lyricsName}, updated ${formatRelativeTime(session.updatedAt)}`}
              onClick={() => onSelect(session)}
            >
              <span className="session__name">{session.lyricsName}</span>
              <span className="session__meta">{formatRelativeTime(session.updatedAt)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
