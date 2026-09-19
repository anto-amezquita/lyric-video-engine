/** The few visual decisions worth exposing per song. Everything else is fixed. */
export function LookPanel({ style, dispatch }) {
  const set = (patch) => dispatch({ type: 'set-style', style: patch })

  return (
    <div className="panel">
      <div className="section__head">
        <h2 className="section__title">Look</h2>
      </div>

      <div className="panel__grid">
        <label className="field">
          <span className="field__label">Text size · {Math.round(style.fontScale * 100)}%</span>
          <input
            type="range"
            min={0.6}
            max={1.6}
            step={0.05}
            value={style.fontScale}
            onChange={(event) => set({ fontScale: Number(event.target.value) })}
          />
        </label>

        <label className="field">
          <span className="field__label">Alignment</span>
          <select
            className="select"
            value={style.align}
            onChange={(event) => set({ align: event.target.value })}
          >
            <option value="center">Centre</option>
            <option value="left">Left</option>
          </select>
        </label>
      </div>

      <div className="btn-row">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={style.uppercase}
            onChange={(event) => set({ uppercase: event.target.checked })}
          />
          Uppercase
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={style.accentActive}
            onChange={(event) => set({ accentActive: event.target.checked })}
          />
          Accent the active line
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={style.showProgress}
            onChange={(event) => set({ showProgress: event.target.checked })}
          />
          Progress bar
        </label>
      </div>
    </div>
  )
}
