import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { CanvasPreview } from './components/CanvasPreview.jsx'
import { ExportPanel } from './components/ExportPanel.jsx'
import { FileDrop } from './components/FileDrop.jsx'
import { LookPanel } from './components/LookPanel.jsx'
import { LyricLines } from './components/LyricLines.jsx'
import { RecentSessions } from './components/RecentSessions.jsx'
import { Transport } from './components/Transport.jsx'
import { useAudioEngine } from './hooks/useAudioEngine.js'
import { useExport } from './hooks/useExport.js'
import { useSyncShortcuts } from './hooks/useSyncShortcuts.js'
import { downloadBlob } from './lib/recorder.js'
import {
  listSessions,
  loadSessionAudio,
  saveSession,
  saveSessionAudio,
  sessionRecord,
} from './lib/sessions.js'
import {
  loadStoredProject,
  parseProjectFile,
  projectFromSession,
  projectReducer,
  serializeProjectFile,
  storeProject,
} from './state/project.js'
import './styles/global.css'

function safeFilename(name) {
  const base = (name ?? 'lyric-video').replace(/\.[^.]+$/, '')
  return (
    base
      .replace(/[^\w-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'lyric-video'
  )
}

export default function App() {
  const [project, dispatch] = useReducer(projectReducer, undefined, loadStoredProject)
  const [activeIndex, setActiveIndex] = useState(-1)
  const canvasRef = useRef(null)
  const engine = useAudioEngine()

  const { lines, cursor, lyricsName, style } = project
  const hasLyrics = lines.length > 0
  const hasAudio = Boolean(engine.audioFile)
  const ready = hasLyrics && hasAudio

  useEffect(() => storeProject(project), [project])

  useSyncShortcuts({ enabled: hasAudio, engine, lines, cursor, dispatch })

  const exporter = useExport({
    canvasRef,
    engine,
    filename: safeFilename(lyricsName ?? engine.audioFile?.name),
  })
  const capture = ['recording', 'paused'].includes(exporter.status.phase)
    ? exporter.status.phase
    : null

  const loadLyrics = useCallback(
    (file) => {
      const reader = new FileReader()
      reader.addEventListener('load', () =>
        dispatch({
          type: 'load-lyrics',
          raw: String(reader.result),
          name: file.name,
          /* Same song, corrected text: keep the sync pass. */
          preserveTimings: true,
        }),
      )
      reader.readAsText(file)
    },
    [dispatch],
  )

  const projectInputRef = useRef(null)
  const [projectMessage, setProjectMessage] = useState('')

  const saveProjectFile = useCallback(() => {
    const json = serializeProjectFile(project, engine.audioFile?.name)
    downloadBlob(
      new Blob([json], { type: 'application/json' }),
      `${safeFilename(project.lyricsName ?? engine.audioFile?.name)}.lve-project.json`,
    )
  }, [project, engine.audioFile])

  const loadProjectFile = useCallback(
    (file) => {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        const parsed = parseProjectFile(String(reader.result))
        if (!parsed) {
          setProjectMessage(`"${file.name}" isn't a project file this version understands.`)
          return
        }
        setProjectMessage('')
        dispatch({ type: 'load-project', project: parsed })
      })
      reader.readAsText(file)
    },
    [dispatch],
  )

  /* ---------- Recent sessions: audio persistence across a reload ---------- */

  const [sessions, setSessions] = useState([])
  const refreshSessions = useCallback(() => {
    listSessions().then(setSessions)
  }, [])

  useEffect(() => {
    refreshSessions()
  }, [refreshSessions])

  /* Every project change with a song name saves that song's session — metadata only, no audio bytes. */
  useEffect(() => {
    if (!lyricsName) return
    saveSession(
      sessionRecord({ lyricsName, lines, style, audioName: engine.audioFile?.name }),
    ).then(refreshSessions)
  }, [lyricsName, lines, style, engine.audioFile, refreshSessions])

  /* The audio file itself changed (a fresh pick, or a session restore) — save its bytes. */
  useEffect(() => {
    if (!lyricsName || !engine.audioFile) return
    saveSessionAudio(lyricsName, engine.audioFile, engine.audioFile.name)
  }, [lyricsName, engine.audioFile])

  /* On mount only: the localStorage-restored project has a song but no audio — restore it. */
  useEffect(() => {
    if (!lyricsName || engine.audioFile) return
    let cancelled = false
    loadSessionAudio(lyricsName).then((file) => {
      if (!cancelled && file) engine.setAudioFile(file)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openSession = useCallback(
    (session) => {
      dispatch({ type: 'load-project', project: projectFromSession(session) })
      loadSessionAudio(session.id).then((file) => {
        if (file) engine.setAudioFile(file)
      })
    },
    [dispatch, engine],
  )

  const stampLine = useCallback(
    (index) => {
      dispatch({ type: 'set-cursor', cursor: index })
      dispatch({ type: 'stamp-cursor', time: engine.getTime() })
    },
    [engine],
  )

  const timedCount = useMemo(() => lines.filter((line) => line.time != null).length, [lines])

  const exportReason = !hasLyrics
    ? 'Load a lyric file first.'
    : !hasAudio
      ? 'Load an audio file first.'
      : 'Stamp at least one line before exporting.'

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Lyric Video Engine</h1>
        <p className="app__subtitle">Text and a demo in, a 9:16 .mp4 out.</p>
        <p className="app__hint">Space stamp · K play · ↑↓ line · ←→ seek · ⌫ clear</p>
      </header>

      <div className="app__panes">
        <main className="pane">
          <section className="section">
            <div className="section__head">
              <h2 className="section__title">Project</h2>
            </div>
            <div className="btn-row">
              <button type="button" className="btn btn--ghost" onClick={saveProjectFile}>
                Save project
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => projectInputRef.current?.click()}
              >
                Load project
              </button>
              <input
                ref={projectInputRef}
                type="file"
                accept=".json,application/json"
                aria-label="Load project file"
                className="sr-only"
                tabIndex={-1}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) loadProjectFile(file)
                  event.target.value = ''
                }}
              />
            </div>
            <p className="hint" role="status" data-tone={projectMessage ? 'error' : undefined}>
              {projectMessage ||
                'Saves lines, timestamps and look to a file you keep. Audio is re-picked separately.'}
            </p>
          </section>

          <section className="section">
            <div className="section__head">
              <h2 className="section__title">Source</h2>
            </div>
            <div className="intake">
              <FileDrop
                label="Lyrics"
                accept=".txt,text/plain"
                value={lyricsName}
                hint="Drop a .txt file"
                onFile={loadLyrics}
              />
              <FileDrop
                label="Audio"
                accept=".wav,.mp3,.m4a,audio/*"
                value={engine.audioFile?.name}
                hint="Drop a .wav file"
                onFile={engine.setAudioFile}
              />
            </div>
            {hasLyrics && (
              <p className="hint">
                Re-importing a corrected .txt keeps every timestamp, matched line by line.
              </p>
            )}
          </section>

          <section className="section">
            <div className="section__head">
              <h2 className="section__title">Sync</h2>
              <span className="section__meta">
                {timedCount}/{lines.length} stamped
              </span>
            </div>

            <p className="hint">
              Play, then tap <kbd>Space</kbd> on each line as it lands. The cursor advances on its
              own, so one pass is usually enough. Click any line to jump the playhead to it, then
              type its start to fine-tune. An end time is optional: leave it empty and the line
              holds until the next one starts.
            </p>

            {hasLyrics && (
              <div className="btn-row">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => dispatch({ type: 'set-cursor', cursor: 0 })}
                >
                  Cursor to top
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={!timedCount}
                  onClick={() => {
                    if (window.confirm(`Clear all ${timedCount} timestamps? The lyrics stay.`)) {
                      dispatch({ type: 'clear-times' })
                    }
                  }}
                >
                  Clear all timestamps
                </button>
              </div>
            )}

            <LyricLines
              lines={lines}
              cursor={cursor}
              activeIndex={activeIndex}
              dispatch={dispatch}
              onSeek={engine.seek}
              onStamp={stampLine}
            />
          </section>

          <LookPanel style={style} dispatch={dispatch} />

          <RecentSessions
            sessions={sessions}
            activeLyricsName={lyricsName}
            onSelect={openSession}
          />
        </main>

        <aside className="pane pane--preview">
          <CanvasPreview
            canvasRef={canvasRef}
            lines={lines}
            style={style}
            duration={engine.duration}
            engine={engine}
            capture={capture}
            onActiveIndexChange={setActiveIndex}
          />
          <ExportPanel
            exporter={exporter}
            disabled={!ready || timedCount === 0}
            reason={exportReason}
          />
        </aside>
      </div>

      {/* Fixed bottom bar: the transport stays reachable while editing any line's times. */}
      <div className="app__transport">
        <Transport engine={engine} disabled={!hasAudio} />
      </div>

      {/* Muted in the DOM sense only — playback is routed through Web Audio for the export tap. */}
      <audio {...engine.audioProps} className="sr-only" />
    </div>
  )
}
