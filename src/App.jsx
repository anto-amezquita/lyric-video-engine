import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { CanvasPreview } from './components/CanvasPreview.jsx'
import { ExportPanel } from './components/ExportPanel.jsx'
import { FileDrop } from './components/FileDrop.jsx'
import { LookPanel } from './components/LookPanel.jsx'
import { LyricLines } from './components/LyricLines.jsx'
import { OffsetPanel } from './components/OffsetPanel.jsx'
import { Transport } from './components/Transport.jsx'
import { useAudioEngine } from './hooks/useAudioEngine.js'
import { useExport } from './hooks/useExport.js'
import { useSyncShortcuts } from './hooks/useSyncShortcuts.js'
import { loadStoredProject, projectReducer, storeProject } from './state/project.js'
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

  const { lines, offsetMs, cursor, lyricsName, style } = project
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
  const recording = exporter.status.phase === 'recording'

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

            <Transport engine={engine} disabled={!hasAudio} />

            <p className="hint">
              Play, then tap <kbd>Space</kbd> on each line as it lands. The cursor advances on its
              own, so one pass is usually enough. Tap again over a line to overwrite it.
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
              offsetMs={offsetMs}
              dispatch={dispatch}
              onSeek={engine.seek}
              onStamp={stampLine}
            />
          </section>

          <OffsetPanel offsetMs={offsetMs} dispatch={dispatch} disabled={!hasLyrics} />
          <LookPanel style={style} dispatch={dispatch} />
        </main>

        <aside className="pane pane--preview">
          <CanvasPreview
            canvasRef={canvasRef}
            lines={lines}
            offsetMs={offsetMs}
            style={style}
            duration={engine.duration}
            engine={engine}
            recording={recording}
            onActiveIndexChange={setActiveIndex}
          />
          <ExportPanel
            exporter={exporter}
            disabled={!ready || timedCount === 0}
            reason={exportReason}
          />
        </aside>
      </div>

      {/* Muted in the DOM sense only — playback is routed through Web Audio for the export tap. */}
      <audio {...engine.audioProps} className="sr-only" />
    </div>
  )
}
