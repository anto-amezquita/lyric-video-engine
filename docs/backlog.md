# backlog.md

## Purpose

This file holds the product's live, open work — nothing else. Every other file in `docs/` is stable reference (what the product is, how it's built, what quality means); this one is the only file expected to change from session to session.

Its job is narrow on purpose: a session should be able to open this file and know what's actually actionable right now, without paging through `product-north-star.md` or a pile of closed specs to find it.

---

## 1. Session protocol

1. Read this file first, before the other `docs/` files — it's the one that tells you whether there's open work waiting, and the other docs are read for context on *how* to do it, not *what* to do.
2. If it's empty, there's no open backlog item. Check with whoever's directing the work before starting something new.
3. Pick an item, or ask if more than one is open and it's not obvious which.
4. When an item ships or a decision is made: remove it from this file. If it's substantial enough to need a record, write a spec in `/specs` or an ADR in `/decisions` per this repo's own conventions — this file holds only what's still open, never history.
5. If new backlog work surfaces mid-session (a deferred fix, a follow-up idea, something explicitly punted on), add it here before finishing — not just in memory or a chat transcript.

---

## 2. Open items

Ordered by what it costs if it goes wrong, read against `product-north-star.md`
("reliable enough that the export is never the reason a video is late") rather
than by effort.

### 1. Handle a backgrounded tab during export

- **Source:** MVP build, known limitation.
- **Why it matters:** `requestAnimationFrame` throttles when the tab is hidden,
  so frames freeze mid-recording and the file is quietly wrong — after a
  four-minute wait, with no error. It is the only known defect that produces a
  broken artefact while reporting success, which is why it sits above the
  missing tests. Detect `visibilitychange` during a recording and either pause
  or fail loudly.
- **Status:** Not started

### 2. Commit an end-to-end test for the three export routes

- **Source:** MVP build. The routes were verified by driving Chrome with
  `MediaRecorder.isTypeSupported` masked to force each one, then decoding each
  output to confirm H.264 + AAC at 1080×1920 — but that check lives in a scratch
  script, not the repo.
- **Why it matters:** Only one of the three routes runs in any given browser, so
  two can break without anyone noticing locally. One already did: passing
  `classWorkerURL` to `ffmpeg.load()` hung the conversion with no error
  surfaced anywhere (`decisions/0001`).
- **Status:** Not started

### 3. Cover the gap between the keyboard and the reducer

- **Source:** `docs/quality.md`, testing strategy — named there as the honest gap.
- **Why it matters:** The reducer is well covered and the browser is checked by
  hand, but nothing proves the two meet — that a Space press actually stamps
  what `stamp-cursor` expects. That seam carries the product's main promise.
- **Status:** Not started

### 4. Decide whether stanza breaks should carry visual weight

- **Source:** `specs/2026-09-19-lyric-video-mvp.md` §9, open questions.
- **Why it matters:** Blank lines in the `.txt` are dropped, so a chorus reads
  continuous with the verse before it. Keeping them as spacing, or as a hold on
  an empty frame, changes how the video breathes. This is a product question,
  not a bug — it needs a decision before it needs code.
- **Status:** Spec needed

### 5. Evaluate WebCodecs for export

- **Source:** `decisions/0001`, alternatives considered.
- **Why it matters:** Faster than realtime, drops the 32MB ffmpeg dependency,
  and gives real H.264 everywhere. The cost is hand-writing an MP4 muxer. Worth
  revisiting once support settles — deliberately last, because the current
  pipeline works on every target browser.
- **Status:** Not started

---

## 3. What doesn't belong here

- **Finished work.** Once something ships, it leaves this file. History lives in `/specs` (what was built and why) and `/decisions` (architectural choices), not in a growing log here.
- **Vague aspirations.** "Improve performance" isn't an item; "investigate the N+1 query on the dashboard load" is. If it's too vague to hand to someone as a starting point, it's not ready for this file yet.
- **A roadmap with dates or phases.** This file tracks *what's open*, not a schedule. If the product needs date-based planning, that belongs in whatever project-management tool `docs/linear-workflow.md` (or its equivalent) points at — this file stays a plain list.

---

## Final review checklist

- Could someone open this file cold and know what to work on next?
- Is every item concrete enough to start, not just a topic?
- Has everything that shipped since the last review been removed?
- Does anything here actually belong in a spec or ADR instead, now that it's been thought through?
