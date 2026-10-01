const TONE = { error: 'error', done: 'success' }

/** Export controls plus whatever the pipeline is currently doing. */
export function ExportPanel({
  exporter,
  disabled,
  reason,
  constantFrameRate,
  onConstantFrameRateChange,
}) {
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
            Download original recording
          </button>
        )}
      </div>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={constantFrameRate}
          disabled={busy}
          onChange={(event) => onConstantFrameRateChange(event.target.checked)}
        />
        Constant frame rate, for DaVinci Resolve and other editors (adds a few minutes)
      </label>

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
