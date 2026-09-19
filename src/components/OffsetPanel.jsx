const OFFSET_RANGE = 10000

/**
 * Global time-shift.
 *
 * Applied on read, never written into the lines. A recut demo with more or
 * less intro silence moves the whole sync pass by one number; "Bake in" folds
 * the shift into the stored timestamps once it's settled.
 */
export function OffsetPanel({ offsetMs, dispatch, disabled }) {
  const setOffset = (value) => dispatch({ type: 'set-offset', offsetMs: value })

  return (
    <div className="panel">
      <div className="section__head">
        <h2 className="section__title">Global offset</h2>
        <span className="section__meta">{offsetMs >= 0 ? `+${offsetMs}` : offsetMs} ms</span>
      </div>

      <input
        type="range"
        min={-OFFSET_RANGE}
        max={OFFSET_RANGE}
        step={10}
        value={offsetMs}
        disabled={disabled}
        aria-label="Global time-shift offset in milliseconds"
        onChange={(event) => setOffset(Number(event.target.value))}
      />

      <div className="btn-row">
        <div className="offset__readout">
          <input
            className="input input--mono offset__value"
            type="number"
            step={10}
            value={offsetMs}
            disabled={disabled}
            aria-label="Offset in milliseconds"
            onChange={(event) => setOffset(Number(event.target.value) || 0)}
          />
          <span className="hint">ms</span>
        </div>
        <button
          type="button"
          className="btn"
          disabled={disabled}
          onClick={() => setOffset(offsetMs - 100)}
        >
          −100
        </button>
        <button
          type="button"
          className="btn"
          disabled={disabled}
          onClick={() => setOffset(offsetMs + 100)}
        >
          +100
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={disabled || !offsetMs}
          onClick={() => setOffset(0)}
        >
          Reset
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={disabled || !offsetMs}
          title="Add the offset to every timestamp and set the offset back to zero"
          onClick={() => dispatch({ type: 'bake-offset' })}
        >
          Bake in
        </button>
      </div>

      <p className="hint">
        Shifts every line at once. Positive values push the lyrics later — use it when the new cut
        gained intro silence.
      </p>
    </div>
  )
}
