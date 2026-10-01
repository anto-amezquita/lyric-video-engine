# 0009 — An opt-in constant-frame-rate export, for DaVinci Resolve

## Status

Accepted. The cause below turned out to be wrong: see the outcome in Context. The option is kept as a general editor-compatibility safeguard, not as a fix for the Resolve problem.

## Context

`decisions/0001` records the canvas in realtime with `MediaRecorder`. On the
`direct` route the browser's own MP4 is downloaded untouched, and on the
`remux` route the H.264 stream is copied into an MP4 without re-encoding.

An exported `.mp4` played in QuickTime but showed as "Media Offline" in the
free version of DaVinci Resolve on a Mac. The likely cause is that a
`MediaRecorder` file is variable frame rate: frames are stamped as they are
drawn, not on a fixed 30fps grid. Editors often refuse that, and copying the
video stream, as `remux` does, cannot change it. This has not been confirmed
against Resolve; the manual `ffmpeg` command that resamples to a constant
rate was suggested but not reported back.

**Outcome (2026-10-01).** Variable frame rate was not the cause. A file
exported with this option on still showed "Media Offline" in Resolve. The clip
had simply lost its link: deleting it from the Resolve project and importing
the same file again from the same folder made it open normally. The exported
file was never at fault. The option was built on a wrong guess, and it is kept
only because variable-rate files can still cause other problems in some
editors (sync drift, wrong duration, scrubbing). That benefit is untested here.

## Decision

An **Export** option, "Constant frame rate, for DaVinci Resolve and other
editors", sits under the export button. When it is on, every route ends in a
full ffmpeg re-encode with the video resampled to 30fps (`-vf fps=30`), still
H.264 at CRF 18 with AAC audio. The `remux` shortcut is skipped, and the
`direct` route, which would have downloaded the browser's file, is converted
too. The `transcode` route already re-encodes, and gains the resampling.

It is off by default, because the re-encode adds minutes and pulls in the
32MB ffmpeg.wasm core, which `decisions/0001` keeps out of any export that
doesn't need it. The choice is remembered across songs and reloads in its own
`localStorage` key, since it is about how this person exports, not about a
song.

If the conversion fails, the original recording stays downloadable. The button
now says "Download original recording" and keeps the real extension: `.mp4` for
a direct recording, `.webm` otherwise. Before this it was always `.webm`.

## Alternatives considered

- **Always export at a constant frame rate.** Not chosen: every export would
  pay the re-encode and the wasm download, which `decisions/0001` rejected for
  the same reason.
- **Resample only when the browser takes the `direct` route.** Not chosen: the
  `remux` route copies the same variable-rate stream, so it has the same
  problem.
- **A separate "Export for editors" button.** Not chosen: a checkbox next to
  the export keeps one button and one flow.
- **Document the `ffmpeg` command instead.** Done as a stop-gap, but it needs
  a tool installed and a manual step every time.
- **A ProRes `.mov`.** Not built: ffmpeg.wasm's size and speed make it
  impractical, and an H.264 file at a constant rate should be enough.

## Consequences

### Positive

- An export can be made that an editor opens, without leaving the app.
- The fast paths are unchanged for anyone uploading straight to social.

### Negative

- It re-encodes the whole video in the browser, so a four-minute song takes
  minutes on top of the realtime recording.
- A second lossy generation: the picture is encoded once by the browser and
  once by ffmpeg. At CRF 18 on flat graphics it should be invisible.
- It did not fix the Resolve "Media Offline" problem that prompted it, because
  that was a lost file link and not the file. Its value is now speculative.
- The option adds a second state that has to be set before exporting, and it
  is disabled while an export is running.

## Related files

- `src/lib/convert.js` — `convertToMp4` and its `constantFrameRate` option
- `src/hooks/useExport.js` — routing, messages, the fallback download
- `src/components/ExportPanel.jsx` — the checkbox
- `src/App.jsx` — the remembered setting
- `e2e/export.test.mjs` — the new route test
- `decisions/0001-realtime-canvas-recording-for-export.md`
