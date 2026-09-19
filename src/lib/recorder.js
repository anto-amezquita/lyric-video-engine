/**
 * Recording format selection.
 *
 * The goal is always an H.264/AAC .mp4. Which route gets there depends on what
 * the browser will record:
 *
 *  - `direct`    — the browser records MP4 itself. Nothing else to do.
 *  - `remux`     — H.264 video in a WebM container. ffmpeg copies the video
 *                  stream into MP4 and re-encodes only the audio. Near-instant.
 *  - `transcode` — VP8/VP9. The full frame-by-frame re-encode; slow, and the
 *                  UI says so before it starts.
 */
const CANDIDATES = [
  { mimeType: 'video/mp4;codecs="avc1.42E01E,mp4a.40.2"', route: 'direct' },
  { mimeType: 'video/mp4;codecs=h264,aac', route: 'direct' },
  { mimeType: 'video/mp4', route: 'direct' },
  { mimeType: 'video/webm;codecs="avc1.42E01E,opus"', route: 'remux' },
  { mimeType: 'video/webm;codecs=h264,opus', route: 'remux' },
  { mimeType: 'video/webm;codecs=vp9,opus', route: 'transcode' },
  { mimeType: 'video/webm;codecs=vp8,opus', route: 'transcode' },
  { mimeType: 'video/webm', route: 'transcode' },
]

export function pickRecordingFormat() {
  if (typeof MediaRecorder === 'undefined') return null
  return CANDIDATES.find((candidate) => MediaRecorder.isTypeSupported(candidate.mimeType)) ?? null
}

export function isRecordingSupported() {
  return typeof MediaRecorder !== 'undefined' && !!HTMLCanvasElement.prototype.captureStream
}

/**
 * Record a canvas plus an audio track for the length of one playthrough.
 *
 * Realtime by design: the canvas is the same one on screen, driven by the same
 * clock, so what is recorded is exactly what was previewed.
 */
export function recordCanvas({ canvas, audioTrack, format, fps = 30, onStop }) {
  const stream = canvas.captureStream(fps)
  if (audioTrack) stream.addTrack(audioTrack)

  const recorder = new MediaRecorder(stream, {
    mimeType: format.mimeType,
    videoBitsPerSecond: 8_000_000,
    audioBitsPerSecond: 192_000,
  })

  const chunks = []
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data)
  }
  recorder.onstop = () => {
    stream.getVideoTracks().forEach((track) => track.stop())
    onStop(new Blob(chunks, { type: format.mimeType.split(';')[0] }))
  }

  recorder.start(1000)
  return recorder
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
