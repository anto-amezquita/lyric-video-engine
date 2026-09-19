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

### 1. Spike automatic line alignment

- **Source:** Decided 2026-09-19 while specifying end times. Manual syncing
  has to be redone whenever a demo is recut beyond an intro shift, and the
  time goes to syncing instead of music.
- **Why it matters:** This is the biggest time saving on the table, and the
  least certain. Run two approaches in the browser against a vocal separated
  with Ultimate Vocal Remover:
  - **Whisper word timestamps** (base/small), with the transcript matched to
    the known lyric lines. One multilingual model covers English and Spanish.
  - **CTC forced alignment** (wav2vec2), given the known lyrics, so it only
    has to find the timing. Likely tighter, especially on line ends, but
    needs one model per language (English and Spanish), and the Spanish ones
    are larger. MMS covers both but is likely too big for the browser.

  Songs are mostly English or Spanish. Test on 2–3 real demos covering both,
  compare start and end errors against manual timings, and note model size,
  speed and where it fails (repeated choruses, dense mixes, mixed-language
  lines). If it holds up, write an ADR (model, bundling vs. cached download,
  given the local-first rule) and a spec. Alignment against the full mix is
  worth one run too, as a baseline.
- **Status:** Not started — waiting on separated vocals for 2–3 demos

### 2. Separate vocals inside the tool

- **Source:** Follows from #1. Separation currently needs UVR as a separate
  app for every recut, since Ableton Live Intro has no stem separation.
- **Why it matters:** The goal is to drop in the mix and get a draft sync
  back. It costs a second model (roughly 80MB+) and slower processing, so it's
  only worth doing if the spike shows alignment is good enough.
- **Status:** Blocked on #1

### 3. Evaluate WebCodecs for export

- **Source:** `decisions/0001`, alternatives considered.
- **Why it matters:** Faster than realtime, drops the 32MB ffmpeg dependency,
  and gives real H.264 everywhere. The cost is hand-writing an MP4 muxer. Worth
  revisiting once support settles — deliberately after end times and
  alignment, because the current pipeline works on every target browser and
  those change what the videos look like.
- **Status:** Not started

### 4. Deploy it somewhere

- **Source:** Surfaced while filling `docs/architecture.md` — the deployment
  section is the one that stayed empty.
- **Why it matters:** The tool currently needs a local checkout to use, which
  makes it easy to not bother. Any static host works; the only requirement is
  that it serves `.wasm` as `application/wasm`, or the conversion fallback
  fails to load on the browsers that need it.
- **Status:** Not started

### 5. Decide whether long gaps need a marker

- **Source:** Deferred in `specs/2026-09-19-line-end-times-and-gaps.md`.
- **Why it matters:** A long intro or solo (roughly 5–8s+) rendered as an
  empty frame may look like a frozen or broken video, especially on a muted
  feed. A note icon or dots on long gaps only, as an option, is the likely
  answer. End times and empty-frame gaps are built, so this can be judged
  on real renders now.
- **Status:** Ready — export a real song with a long intro or solo and watch it

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
