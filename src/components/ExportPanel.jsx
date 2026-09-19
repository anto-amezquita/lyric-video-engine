const TONE = { error: 'error', done: 'success' }

/** Export controls plus whatever the pipeline is currently doing. */
export function ExportPanel({ exporter, disabled, reason }) {
  const { status, start, cancel, downloadFallback, hasFallback } = exporter
  const capturing = status.phase === 'recording' || status.phase === 'paused'
  const busy = capturing || status.phase === 'converting'
  const showProgress = busy && status.progress > 0

  return (
    <div className="status" data-tone={TONE[status.phase] ?? 'neutral'}>
      <div className="btn-row">
        {busy ? (
          <button type="button" className="btn btn--danger" onClick={cancel}>
            {capturing ? 'Stop recording' : 'Cancel'}
          </button>
        ) : (
          <button type="button" className="btn btn--primary" onClick={start} disabled={disabled}>
            Export .mp4
          </button>
        )}
        {status.phase === 'error' && hasFallback() && (
          <button type="button" className="btn" onClick={downloadFallback}>
            Download .webm instead
          </button>
        )}
      </div>

      {showProgress && (
        <div className="progress">
          <div
            className="progress__bar"
            style={{ width: `${Math.round(status.progress * 100)}%` }}
          />
        </div>
      )}

      <p className="hint" role="status">
        {status.message ||
          (disabled
            ? reason
            : 'Records one realtime pass from the top, with the audio track muxed in.')}
      </p>
    </div>
  )
}
