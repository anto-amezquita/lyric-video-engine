# product-north-star.md

## Purpose

This file defines what the product is, who it serves, why it exists, and the
principles that should guide product decisions over time.

It is the stable reference point. When features, designs, or technical choices
compete, this document decides what deserves to exist and what does not.

---

## 1. Product summary

### Product name

Lyric Video Engine

### One-line description

A local-first browser tool that turns a lyric `.txt` and a demo `.wav` into a
9:16 lyric video, exported as an `.mp4`.

### Longer description

Drop in the lyrics and the demo, tap through the song once, then tune any line
by clicking it and listening. The lyric text comes from the `.txt` and the
timing lives beside it, so correcting a typo costs a re-import rather than a
second pass.

---

## 2. Problem

### The problem we solve

Syncing lyrics to a demo is quick the first time and tedious every time after.
In most tools the timing is welded to the text, so a typo fix means starting
over — and getting one line to land exactly right means scrubbing a timeline
for the same half-second, over and over.

### Who experiences it

Anyone iterating on unreleased material, where the audio changes more often than
the lyrics do. In this project's case, that is one person: the author.

### Why it matters

The cost is not the first sync pass. It is the tenth time hunting for the same
moment in the track to check whether one line lands where it should.

---

## 3. Audience

### Primary users

- The author, syncing their own demos.

This is a personal tool. It is built for one workflow and does not carry the
weight of onboarding, accounts, or unfamiliar users. If that ever changes, it
changes here first — and `brand.md`, `content.md`, and the whole question of a
first-run experience have to be reopened with it.

### Secondary users

- None. Anyone reading the code counts as a contributor, not a user.

### Users are trying to

- Sync a full song in one playthrough rather than line by line.
- Tune any individual line until it lands exactly right.
- Change the lyric text without losing the timing.
- Get a vertical `.mp4` that uploads without a second tool.

### Users should feel

- That the tool keeps up with the work rather than interrupting it.
- That a correction is cheap.
- That the file which downloads is the one they just watched.

---

## 4. Value proposition

### We help users

Turn a lyric sheet and a rough demo into a finished vertical video in about the
time it takes to listen to the song once.

### Compared with alternatives

A video editor can do this, and does it badly for this specific job: every timing
change is a manual nudge on a timeline, and the lyrics live in text layers that
have to be edited one by one. Dedicated lyric-video services want an upload and a
subscription, and unreleased demos are exactly the material you do not want to
upload.

This does one job, keeps the audio on the machine, and makes tuning a single
line a matter of clicking it and listening.

---

## 5. Product principles

#### 1. Timing and text are separate things

Anything that edits words must not touch timing, and anything that edits timing
must not touch words. Every feature is checked against this before it is built.

#### 2. One pass should be enough

The sync pass runs at the speed of the song. Anything that makes the user stop,
switch to the mouse, or listen twice is working against the product.

#### 3. Precision per line, not per song

A whole-song shift cannot fix the thing that actually goes wrong — one line
landing slightly early. Timestamps are absolute and tuned one at a time, and
the job of the interface is to make hearing that one moment cheap
(`decisions/0004`).

#### 4. What you previewed is what you get

The export records the canvas on screen. No second renderer, no "export looks
different" class of bug.

#### 5. Nothing leaves the browser

Unreleased material is the whole use case. Any proposal that uploads audio or
lyrics is a change to what this product is, not a technical detail.

#### 6. Say what the browser is doing

Export behaviour varies by browser and some of it is slow. Name the route and
the cost rather than showing an indeterminate spinner.

---

## 6. What this product should become

- Fast enough that syncing stops being a thing you put off.
- Reliable enough that the export is never the reason a video is late.
- Small enough to still understand after six months away from it.

---

## 7. What this product should not become

- A video editor. No timeline, no layers, no keyframes.
- A service. No accounts, no uploads, no hosting of anyone's audio.
- A word-level karaoke tool. Line level is the level this product works at.
- A general-purpose captioning tool. It is for lyrics and songs.

---

## 8. Business and product goals

### Business goals

None. This is a personal tool, not a product with a business behind it. If that
changes, this section is the first thing to rewrite.

### Product goals

- A four-minute song syncs in one playthrough.
- Any single line can be tuned to the frame without re-syncing the rest.
- Export produces a file that uploads without conversion.

### Success signals

- The author reaches for this instead of a video editor.
- A corrected lyric sheet costs no re-sync.
- Exports are not repeated because the first one came out wrong.

---

## 9. Strategic scope

### In scope

- Line-level sync, per-line fine-tuning, and the timestamp editing that serves
  it.
- 9:16 canvas rendering with the handful of look controls that change per song.
- In-browser export to `.mp4`.
- Keeping a project across a reload, and saving/loading it as a portable
  `.json` file across sessions and machines
  (`specs/2026-09-22-project-save-load.md`).
- Audio persisting across a reload, and a history of every song synced,
  reopenable from a list — all local to the browser
  (`specs/2026-09-22-recent-sessions-and-audio-persistence.md`).

### Out of scope

- Word or syllable timing.
- Background video, images, or per-line animation.
- Accounts, sync across devices, sharing.
- Batch export across songs.
- Automatic sync from audio analysis.

---

## 10. Decision filter

When making product decisions, ask:

- Does it make tuning one line cheaper, or only the whole song?
- Can it be done without leaving the keyboard mid-pass?
- Does it keep timing and text separate?
- Does anything leave the browser?
- Would this still be understandable after six months away?

---

## 11. Open questions

- Should stanza breaks carry visual weight in the render, or stay dropped?
  (`specs/2026-09-19-lyric-video-mvp.md` §9)
- Is positional carry-over the right match on re-import, or should reordered
  lines survive too?
- Is 30fps enough, or do text-heavy songs want 60?
