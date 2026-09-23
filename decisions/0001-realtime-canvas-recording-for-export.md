# 0001 — Record the live canvas in realtime for export

## Status

Accepted

## Context

The product has to produce an H.264/AAC `.mp4` at 1080×1920 from inside the
browser, with no server. Two things make that awkward:

1. No browser records MP4 everywhere. Chrome and Safari can; Firefox records
   WebM only, and which video codec lands inside that WebM varies by platform.
2. An export can either replay the preview in realtime or render frames
   offscreen and encode them as fast as the machine allows.

## Decision

Export records the same canvas the user is watching, at 30fps, driven by the
same `audio.currentTime` clock, for one realtime playthrough. The audio track is
tapped from a `MediaStreamAudioDestinationNode` and muxed in by `MediaRecorder`.

The container is resolved at export time against what the browser will actually
record, in this order:

| Route | Recorded as | What happens next |
|---|---|---|
| `direct` | MP4 | Downloaded as-is. |
| `remux` | H.264 in WebM | ffmpeg copies the video stream into MP4, re-encodes audio to AAC. Seconds. |
| `transcode` | VP8/VP9 in WebM | Full H.264 re-encode through ffmpeg.wasm. Minutes. |

ffmpeg.wasm is lazily imported and only reached on the two fallback routes, so
the initial bundle stays at roughly 77kB gzipped.

## Alternatives considered

- **Offscreen frame-by-frame rendering into ffmpeg.wasm.** Faster than realtime
  and independent of tab visibility, but it means a second render path that can
  drift from the preview, and it pulls the 32MB wasm core into every export.
- **WebCodecs (`VideoEncoder`) plus an MP4 muxer.** The best long-term answer —
  real H.264 everywhere, faster than realtime, no ffmpeg. Rejected for the MVP
  because it needs a muxer written by hand and browser support is still uneven.
- **Always transcode through ffmpeg.wasm** for one predictable path. Rejected:
  it would make every export slow on browsers that need no conversion at all.
- **Ship WebM and let the user convert.** Rejected — the deliverable is a file
  that uploads to social without a second tool.

## Consequences

### Positive

- What downloads is exactly what was previewed; there is no second renderer to
  keep in sync.
- Most users get MP4 with no conversion step at all.
- The 32MB wasm core is never downloaded unless a conversion is actually needed.

### Negative

- A four-minute song takes four minutes to export.
- `requestAnimationFrame` throttles in a background tab, which would freeze
  frames mid-recording. The UI warns; it does not prevent it.
- The VP8/VP9 route is slow enough to feel broken, so it is labelled before it
  starts and the raw recording stays downloadable if conversion fails.

## Implementation note

Do not pass `classWorkerURL` to `ffmpeg.load()`. Vite bundles ffmpeg's own
`new Worker(new URL("./worker.js", import.meta.url))` correctly; importing
`@ffmpeg/ffmpeg/worker?url` emits a second, unbundled copy whose relative
imports 404 inside a module worker, and `load()` then hangs with no error
surfaced anywhere.

## Related files

- `specs/2026-09-19-lyric-video-mvp.md` §7, §9
- `src/lib/recorder.js`, `src/lib/convert.js`, `src/hooks/useExport.js`
