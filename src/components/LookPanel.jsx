import { contrastRatio } from '../lib/color.js'
import { DEFAULT_STYLE } from '../state/project.js'

/** A labelled colour swatch. The hex is shown so a value can be read off and reused. */
function ColorField({ label, value, onChange }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className="colorfield">
        <input
          type="color"
          className="colorfield__swatch"
          value={value}
          aria-label={`${label} colour`}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="colorfield__hex">{value.toUpperCase()}</span>
      </span>
    </label>
  )
}

/** The few visual decisions worth exposing per song. Everything else is fixed. */
export function LookPanel({ style, dispatch }) {
  const set = (patch) => dispatch({ type: 'set-style', style: patch })

  /*
   * The canvas is outside the stylesheet's contrast test, and these colours
   * are free-form, so an unreadable pairing is easy to pick by accident.
   * Warn rather than prevent — it's the author's video.
   */
  const textContrast = contrastRatio(style.text, style.background)
  const lowContrast = textContrast < 4.5

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

      <div className="panel__grid">
        <ColorField
          label="Background"
          value={style.background}
          onChange={(background) => set({ background })}
        />
        <ColorField label="Lyrics" value={style.text} onChange={(text) => set({ text })} />
      </div>

      <p className="hint" role="status" data-tone={lowContrast ? 'error' : undefined}>
        {lowContrast
          ? `Lyrics sit at ${textContrast.toFixed(1)}:1 against the background — below 4.5:1, so they may be hard to read on a phone.`
          : `The background is a soft vertical gradient built from this colour. The lyric colour also drives the progress bar. Contrast ${textContrast.toFixed(1)}:1.`}
      </p>

      <div className="btn-row">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={style.showProgress}
            onChange={(event) => set({ showProgress: event.target.checked })}
          />
          Progress bar
        </label>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() =>
            set({ background: DEFAULT_STYLE.background, text: DEFAULT_STYLE.text })
          }
        >
          Reset colours
        </button>
      </div>
    </div>
  )
}
