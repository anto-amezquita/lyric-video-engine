import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/**
 * The master playback clock.
 *
 * `audio.currentTime` is the single source of truth for where we are; nothing
 * keeps its own timer. Listeners are driven from one requestAnimationFrame
 * loop and receive the time directly, so per-frame updates never pass through
 * React state.
 */
export function useAudioEngine() {
  const audioRef = useRef(null)
  const listenersRef = useRef(new Set())
  const frameRef = useRef(0)

  const contextRef = useRef(null)
  const sourceRef = useRef(null)
  const streamDestRef = useRef(null)

  const [audioFile, setAudioFile] = useState(null)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const audioUrl = useMemo(() => (audioFile ? URL.createObjectURL(audioFile) : null), [audioFile])
  useEffect(() => () => audioUrl && URL.revokeObjectURL(audioUrl), [audioUrl])

  /* One loop for every time-driven surface: canvas, transport, active line. */
  useEffect(() => {
    const tick = (now) => {
      const time = audioRef.current?.currentTime ?? 0
      listenersRef.current.forEach((listener) => listener(time, now))
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  const subscribe = useCallback((listener) => {
    listenersRef.current.add(listener)
    return () => listenersRef.current.delete(listener)
  }, [])

  const getTime = useCallback(() => audioRef.current?.currentTime ?? 0, [])

  const play = useCallback(async () => {
    const audio = audioRef.current
    if (!audio?.src) return
    await contextRef.current?.resume().catch(() => {})
    await audio.play().catch(() => {})
  }, [])

  const pause = useCallback(() => audioRef.current?.pause(), [])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio?.src) return
    if (audio.paused) play()
    else pause()
  }, [play, pause])

  const seek = useCallback((time) => {
    const audio = audioRef.current
    if (!audio?.src) return
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, time))
  }, [])

  const nudge = useCallback((delta) => seek((audioRef.current?.currentTime ?? 0) + delta), [seek])

  /**
   * Route the element through Web Audio so the export can tap a real audio
   * track. Built once and kept: `createMediaElementSource` permanently
   * redirects the element, so it also stays connected to the speakers.
   */
  const getAudioStreamTrack = useCallback(async () => {
    const audio = audioRef.current
    if (!audio?.src) return null

    if (!contextRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return null
      contextRef.current = new AudioCtx()
      sourceRef.current = contextRef.current.createMediaElementSource(audio)
      streamDestRef.current = contextRef.current.createMediaStreamDestination()
      sourceRef.current.connect(contextRef.current.destination)
      sourceRef.current.connect(streamDestRef.current)
    }

    await contextRef.current.resume().catch(() => {})
    return streamDestRef.current.stream.getAudioTracks()[0] ?? null
  }, [])

  const audioProps = useMemo(
    () => ({
      ref: audioRef,
      src: audioUrl ?? undefined,
      preload: 'auto',
      onLoadedMetadata: (event) => setDuration(event.currentTarget.duration || 0),
      onPlay: () => setIsPlaying(true),
      onPause: () => setIsPlaying(false),
      onEnded: () => setIsPlaying(false),
    }),
    [audioUrl],
  )

  return {
    audioRef,
    audioProps,
    audioFile,
    setAudioFile,
    duration,
    isPlaying,
    subscribe,
    getTime,
    play,
    pause,
    toggle,
    seek,
    nudge,
    getAudioStreamTrack,
  }
}
