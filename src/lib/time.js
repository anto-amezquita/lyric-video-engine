/** Seconds -> `m:ss.cc`. Used everywhere a timestamp is shown or typed. */
export function formatTime(seconds) {
  if (seconds == null || Number.isNaN(seconds)) return '—'
  const clamped = Math.max(0, seconds)
  const m = Math.floor(clamped / 60)
  const s = Math.floor(clamped % 60)
  const cs = Math.floor((clamped * 100) % 100)
  return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}

/**
 * Parse what a person is likely to type into a timestamp cell:
 * `72.4`, `1:12.4`, `01:12`. Returns null for anything unusable, which the
 * caller treats as "leave the stored value alone".
 */
export function parseTime(input) {
  const raw = String(input).trim()
  if (!raw) return null
  const parts = raw.split(':')
  if (parts.length > 2) return null
  const numbers = parts.map((part) => Number(part.replace(',', '.')))
  if (numbers.some((n) => Number.isNaN(n) || n < 0)) return null
  const seconds = numbers.length === 2 ? numbers[0] * 60 + numbers[1] : numbers[0]
  return Number.isFinite(seconds) ? seconds : null
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}
