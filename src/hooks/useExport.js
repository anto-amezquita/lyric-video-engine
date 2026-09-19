import { useCallback, useRef, useState } from 'react'
import {
  downloadBlob,
  isRecordingSupported,
  pickRecordingFormat,
  recordCanvas,
} from '../lib/recorder.js'

const IDLE = { phase: 'idle', message: '', progress: 0 }

const RECORDING_MESSAGE = 'Recording in realtime. Switching tabs pauses the recording.'
const PAUSED_MESSAGE = 'Paused — this tab is in the background. Come back to carry on.'

/**
 * Record one realtime playthrough of the preview canvas and hand back an .mp4.
 *
 * Realtime is the point: the recorded frames are the previewed frames, from
 * the same clock, so nothing can drift between what you approved and what you
 * downloaded.
 */
export function useExport({ canvasRef, engine, filename }) {
  const [status, setStatus] = useState(IDLE)
  const recorderRef = useRef(null)
  const teardownRef = useRef([])
  const fallbackRef = useRef(null)

  const cleanup = useCallback(() => {
    for (const undo of teardownRef.current) undo()
    teardownRef.current = []
    recorderRef.current = null
  }, [])

  const finish = useCallback(
    async (blob, format) => {
      cleanup()
      engine.pause()

      if (format.route === 'direct') {
        downloadBlob(blob, `${filename}.mp4`)
        setStatus({ phase: 'done', message: 'Exported as .mp4.', progress: 1 })
        return
      }

      fallbackRef.current = blob
      setStatus({
        phase: 'converting',
        message:
          format.route === 'remux'
            ? 'Recorded H.264 — repackaging as .mp4.'
            : 'This browser recorded VP8/VP9, so the video is being re-encoded to H.264. Expect a few minutes.',
        progress: 0,
      })

      try {
        const { convertToMp4 } = await import('../lib/convert.js')
        const mp4 = await convertToMp4(blob, {
          route: format.route,
          onProgress: (progress) => setStatus((previous) => ({ ...previous, progress })),
        })
        downloadBlob(mp4, `${filename}.mp4`)
        fallbackRef.current = null
        setStatus({ phase: 'done', message: 'Exported as .mp4.', progress: 1 })
      } catch (error) {
        setStatus({
          phase: 'error',
          message: `Could not convert to .mp4 (${error?.message ?? 'unknown error'}). The recording itself is fine — you can download the raw .webm and convert it elsewhere.`,
          progress: 0,
        })
      }
    },
    [cleanup, engine, filename],
  )

  const start = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (!isRecordingSupported()) {
      setStatus({
        phase: 'error',
        message: 'This browser cannot record a canvas stream. Try Chrome, Edge, or Safari 17+.',
        progress: 0,
      })
      return
    }

    const format = pickRecordingFormat()
    if (!format) {
      setStatus({
        phase: 'error',
        message: 'No supported recording format in this browser.',
        progress: 0,
      })
      return
    }

    fallbackRef.current = null
    setStatus({ phase: 'recording', message: RECORDING_MESSAGE, progress: 0 })

    const audioTrack = await engine.getAudioStreamTrack()
    const audio = engine.audioRef.current

    /* Always record a full pass from the top. */
    await new Promise((resolve) => {
      if (!audio || audio.currentTime === 0) return resolve()
      audio.addEventListener('seeked', resolve, { once: true })
      audio.currentTime = 0
      return undefined
    })

    recorderRef.current = recordCanvas({
      canvas,
      audioTrack,
      format,
      onStop: (blob) => finish(blob, format),
    })

    const stop = () => recorderRef.current?.state !== 'inactive' && recorderRef.current?.stop()
    audio?.addEventListener('ended', stop, { once: true })
    teardownRef.current.push(() => audio?.removeEventListener('ended', stop))

    /*
     * A hidden tab throttles requestAnimationFrame, so the canvas stops
     * updating while captureStream keeps emitting the last frame — the
     * recording would run to full length with the lyrics frozen, and report
     * success. Pause both the recorder and the clock instead.
     *
     * Order matters. Resuming the recorder before the audio inserts a few
     * frozen milliseconds into *both* tracks, which stays in sync; starting
     * the audio first would drop audio that the recorder never captured.
     */
    const onVisibilityChange = () => {
      const recorder = recorderRef.current
      if (!recorder) return
      if (document.hidden) {
        if (recorder.state !== 'recording') return
        recorder.pause()
        engine.pause()
        setStatus((previous) =>
          previous.phase === 'recording'
            ? { ...previous, phase: 'paused', message: PAUSED_MESSAGE }
            : previous,
        )
      } else {
        if (recorder.state !== 'paused') return
        recorder.resume()
        engine.play()
        setStatus((previous) =>
          previous.phase === 'paused'
            ? { ...previous, phase: 'recording', message: RECORDING_MESSAGE }
            : previous,
        )
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    teardownRef.current.push(() =>
      document.removeEventListener('visibilitychange', onVisibilityChange),
    )

    const unsubscribe = engine.subscribe((time) => {
      const total = audio?.duration || 0
      if (total)
        setStatus((previous) =>
          previous.phase === 'recording' ? { ...previous, progress: time / total } : previous,
        )
    })
    teardownRef.current.push(unsubscribe)

    await engine.play()
  }, [canvasRef, engine, finish])

  const cancel = useCallback(() => {
    const recorder = recorderRef.current
    recorderRef.current = null
    cleanup()
    engine.pause()
    /* 'paused' counts too — cancelling from a backgrounded pause must still stop. */
    if (recorder && recorder.state !== 'inactive') {
      recorder.ondataavailable = null
      recorder.onstop = null
      recorder.stop()
    }
    setStatus({ phase: 'idle', message: 'Export cancelled.', progress: 0 })
  }, [cleanup, engine])

  const downloadFallback = useCallback(() => {
    if (fallbackRef.current) downloadBlob(fallbackRef.current, `${filename}.webm`)
  }, [filename])

  return {
    status,
    start,
    cancel,
    downloadFallback,
    hasFallback: () => Boolean(fallbackRef.current),
  }
}
