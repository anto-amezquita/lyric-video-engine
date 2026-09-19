let counter = 0

/** Stable-enough id for a lyric line. Ids never leave the browser. */
export function createLineId() {
  counter += 1
  return `l${Date.now().toString(36)}${counter.toString(36)}`
}

/**
 * Raw .txt -> line-level blocks.
 *
 * Blank lines are stanza separators, not lyrics, so they are dropped. Every
 * surviving line becomes one displayed, timestamped block.
 */
export function tokenizeLyrics(raw) {
  return String(raw)
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
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
