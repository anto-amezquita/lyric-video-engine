import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import coreURL from '@ffmpeg/core?url'
import wasmURL from '@ffmpeg/core/wasm?url'

/**
 * WebM -> MP4, in the browser.
 *
 * ffmpeg.wasm is loaded lazily and served from the app's own bundle, so the
 * tool stays local-first: nothing is uploaded and nothing is fetched from a
 * third party at export time.
 */
let ffmpegPromise = null

async function getFFmpeg(onLog) {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const ffmpeg = new FFmpeg()
      if (onLog) ffmpeg.on('log', ({ message }) => onLog(message))
      /*
       * No classWorkerURL: Vite bundles ffmpeg's own `new Worker(new URL(...))`
       * correctly on its own. Pointing it at a `?url` copy of worker.js hands
       * the module worker a file whose relative imports 404, and load() then
       * hangs with no error. Core and wasm are same-origin bundle assets, so
       * they are passed straight through.
       */
      await ffmpeg.load({ coreURL, wasmURL })
      return ffmpeg
    })().catch((error) => {
      ffmpegPromise = null
      throw error
    })
  }
  return ffmpegPromise
}

/**
 * `route` decides the ffmpeg arguments:
 *   remux     — copy the H.264 stream, re-encode audio to AAC only.
 *   transcode — full H.264 re-encode. `onProgress` matters here.
 */
export async function convertToMp4(blob, { route, onProgress, onLog } = {}) {
  const ffmpeg = await getFFmpeg(onLog)

  const handleProgress = ({ progress }) => onProgress?.(Math.min(1, Math.max(0, progress)))
  ffmpeg.on('progress', handleProgress)

  const input = 'input.webm'
  const output = 'output.mp4'

  try {
    await ffmpeg.writeFile(input, await fetchFile(blob))

    const args =
      route === 'remux'
        ? [
            '-i',
            input,
            '-c:v',
            'copy',
            '-c:a',
            'aac',
            '-b:a',
            '192k',
            '-movflags',
            '+faststart',
            output,
          ]
        : [
            '-i',
            input,
            '-c:v',
            'libx264',
            '-preset',
            'veryfast',
            /*
             * 18, not 22: the canvas now carries a subtle background dither
             * (renderFrame.js) to fix 8-bit banding, and a looser CRF here
             * would quantize that grain right back into blocky patches on
             * this route's full re-encode.
             */
            '-crf',
            '18',
            '-pix_fmt',
            'yuv420p',
            '-c:a',
            'aac',
            '-b:a',
            '192k',
            '-movflags',
            '+faststart',
            output,
          ]

    await ffmpeg.exec(args)
    const data = await ffmpeg.readFile(output)
    return new Blob([data.buffer ?? data], { type: 'video/mp4' })
  } finally {
    ffmpeg.off('progress', handleProgress)
    await ffmpeg.deleteFile(input).catch(() => {})
    await ffmpeg.deleteFile(output).catch(() => {})
  }
}
