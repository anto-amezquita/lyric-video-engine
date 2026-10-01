let counter = 0

/** Stable-enough id for a lyric line. Ids never leave the browser. */
export function createLineId() {
  counter += 1
  return `l${Date.now().toString(36)}${counter.toString(36)}`
}

/** A trimmed line wrapped entirely in [...] — metadata, never a lyric. */
const BRACKET_LINE = /^\[(.*)\]$/

/** Bracket keywords that become a stampable "♪" cue instead of being dropped. */
const NOTE_KEYWORDS = new Set(['instrumental', 'intro', 'outro', 'turnaround'])

const NOTE = '♪'

/**
 * Raw .txt -> line-level blocks.
 *
 * Blank lines are stanza separators, not lyrics, so they are dropped. A line
 * wrapped entirely in [...] is metadata — title, section label, credits —
 * and is dropped too, except a NOTE_KEYWORDS match (case-insensitive, stray
 * spacing ignored), which becomes a stampable cue: same start, end and fade
 * as any lyric line. A bracket that doesn't span the whole line is left alone
 * as ordinary text.
 *
 * Two of the cues carry words instead of the "♪", read from the metadata
 * around them (`decisions/0008`):
 *
 * - [Intro] shows the title: the file's first line when it is a bracket
 *   (`[Adios MF]`), else `fallbackTitle`, else the note.
 * - [Outro] shows the credits: the bracket lines directly after it, one row
 *   each, else the note.
 *
 * Cue count and order never change, so re-importing keeps every timestamp.
 *
 * `tokenizeCues` returns each line as `{ text, role? }`. The Intro title
 * (`role: 'title'`) and the Outro credits (`role: 'credits'`) carry a role so
 * the renderer can draw them smaller than the lyrics. `tokenizeLyrics` is the
 * same list as plain text.
 */
export function tokenizeCues(raw, { fallbackTitle = null } = {}) {
  const items = String(raw)
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const bracket = line.match(BRACKET_LINE)
      if (!bracket) return { kind: 'lyric', text: line }
      const inner = bracket[1].trim()
      const keyword = inner.toLowerCase()
      return NOTE_KEYWORDS.has(keyword)
        ? { kind: 'note', keyword }
        : { kind: 'meta', text: inner }
    })

  const first = items[0]
  const title = (first?.kind === 'meta' && first.text) || fallbackTitle

  /* The bracket lines straight after an [Outro], stopping at anything else. */
  const creditsAfter = (start) => {
    const rows = []
    for (let i = start + 1; i < items.length && items[i].kind === 'meta'; i += 1) {
      if (items[i].text) rows.push(items[i].text)
    }
    return rows.length ? rows.join('\n') : null
  }

  return items.flatMap((item, index) => {
    if (item.kind === 'lyric') return [{ text: item.text }]
    if (item.kind === 'meta') return []
    if (item.keyword === 'intro') {
      return [title ? { text: title, role: 'title' } : { text: NOTE }]
    }
    if (item.keyword === 'outro') {
      const credits = creditsAfter(index)
      return [credits ? { text: credits, role: 'credits' } : { text: NOTE }]
    }
    return [{ text: NOTE }]
  })
}

export function tokenizeLyrics(raw, options) {
  return tokenizeCues(raw, options).map((cue) => cue.text)
}

/**
 * Build line objects from raw text, carrying existing timestamps over by
 * position — starts and ends both.
 *
 * This is the "new demo, same song" path: re-importing a corrected .txt keeps
 * the sync work as long as the line order holds. Timestamps live on the line
 * object, never on the text, so a typo fix costs nothing.
 */
export function buildLines(raw, previousLines = [], options = {}) {
  return tokenizeCues(raw, options).map(({ text, role }, index) => ({
    id: previousLines[index]?.id ?? createLineId(),
    text,
    ...(role ? { role } : {}),
    time: previousLines[index]?.time ?? null,
    end: previousLines[index]?.end ?? null,
  }))
}
