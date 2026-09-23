let counter = 0

/** Stable-enough id for a lyric line. Ids never leave the browser. */
export function createLineId() {
  counter += 1
  return `l${Date.now().toString(36)}${counter.toString(36)}`
}

/** A trimmed line wrapped entirely in [...] — metadata, never a lyric. */
const BRACKET_LINE = /^\[(.*)\]$/

/** Bracket keywords that become a stampable "♪" cue instead of being dropped. */
const NOTE_KEYWORDS = new Set(['instrumental', 'intro', 'outro'])

/**
 * Raw .txt -> line-level blocks.
 *
 * Blank lines are stanza separators, not lyrics, so they are dropped. A line
 * wrapped entirely in [...] is metadata — title, section label, credits —
 * and is dropped too, except a NOTE_KEYWORDS match (case-insensitive, stray
 * spacing ignored), which becomes a stampable "♪" cue instead of being shown
 * as text: same start, end and fade as any lyric line, just without the
 * words. A bracket that doesn't span the whole line is left alone as
 * ordinary text.
 */
export function tokenizeLyrics(raw) {
  return String(raw)
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .flatMap((line) => {
      const bracket = line.match(BRACKET_LINE)
      if (!bracket) return [line]
      return NOTE_KEYWORDS.has(bracket[1].trim().toLowerCase()) ? ['♪'] : []
    })
}

/**
 * Build line objects from raw text, carrying existing timestamps over by
 * position — starts and ends both.
 *
 * This is the "new demo, same song" path: re-importing a corrected .txt keeps
 * the sync work as long as the line order holds. Timestamps live on the line
 * object, never on the text, so a typo fix costs nothing.
 */
export function buildLines(raw, previousLines = []) {
  return tokenizeLyrics(raw).map((text, index) => ({
    id: previousLines[index]?.id ?? createLineId(),
    text,
    time: previousLines[index]?.time ?? null,
    end: previousLines[index]?.end ?? null,
  }))
}
