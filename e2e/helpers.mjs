import { spawn } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

/**
 * Shared rig for the browser tests.
 *
 * These use the Chrome already installed on the machine rather than a
 * Playwright-managed build, so `npm ci` does not pull down browser binaries. If
 * Chrome is missing the suite skips instead of failing — see `launch`.
 */

/** Serve the production build and resolve with its URL. */
export function startPreview() {
  return new Promise((resolve, reject) => {
    /*
     * detached, and killed by process group below: `npx` spawns vite as a
     * child, so killing the npx pid alone leaves the server holding the port
     * and the next test file starts a second one.
     */
    const child = spawn('npx', ['vite', 'preview', '--port', '4180'], {
      cwd: path.resolve(import.meta.dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    })
    const timer = setTimeout(() => reject(new Error('vite preview did not start in 30s')), 30_000)
    let output = ''
    child.stdout.on('data', (chunk) => {
      output += chunk
      const match = output.match(/(http:\/\/localhost:\d+)\/?/)
      if (match) {
        clearTimeout(timer)
        resolve({
          url: `${match[1]}/`,
          stop: () => {
            try {
              process.kill(-child.pid, 'SIGTERM')
            } catch {
              child.kill()
            }
          },
        })
      }
    })
    child.on('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
  })
}

/**
 * Returns a browser, or null when Chrome is not installed — the caller skips.
 * Playwright is imported lazily so the module still loads without it.
 */
export async function launch() {
  try {
    const { chromium } = await import('playwright')
    return await chromium.launch({
      channel: 'chrome',
      args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
    })
  } catch {
    return null
  }
}

/** A short mono sine sweep, written as a real .wav so the app decodes it normally. */
export async function makeFixtures(seconds = 3) {
  const dir = await mkdtemp(path.join(tmpdir(), 'lve-e2e-'))
  const rate = 44_100
  const frames = rate * seconds
  const data = Buffer.alloc(frames * 2)
  for (let i = 0; i < frames; i += 1) {
    const t = i / rate
    const freq = 220 * 2 ** (Math.floor(t * 2) / 12)
    data.writeInt16LE(Math.round(Math.sin(2 * Math.PI * freq * t) * 0.3 * 32_767), i * 2)
  }
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(rate, 24)
  header.writeUInt32LE(rate * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)

  const wav = path.join(dir, 'demo.wav')
  const txt = path.join(dir, 'lyrics.txt')
  await writeFile(wav, Buffer.concat([header, data]))
  await writeFile(txt, 'Hold the line\n\nI was wrong\nCome back around\nAnd the light stays on\n')
  return { dir, wav, txt, seconds }
}

/** Fresh page with both files loaded and no project carried over from a previous test. */
export async function openApp(browser, url, fixtures, { maskMimeType } = {}) {
  const context = await browser.newContext({ acceptDownloads: true })
  const page = await context.newPage()

  /*
   * Only one recording route runs in a given browser, so the others are
   * unreachable unless the format list is narrowed. This makes Chrome look
   * like a browser that can only record `maskMimeType`.
   */
  if (maskMimeType) {
    await page.addInitScript((mime) => {
      const supported = MediaRecorder.isTypeSupported.bind(MediaRecorder)
      MediaRecorder.isTypeSupported = (type) => type.includes(mime) && supported(type)
    }, maskMimeType)
  }

  await page.goto(url, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })

  const inputs = page.locator('input[type=file]')
  await inputs.nth(0).setInputFiles(fixtures.txt)
  await inputs.nth(1).setInputFiles(fixtures.wav)
  await page.waitForTimeout(400)
  return { context, page }
}

/** Type timestamps straight into the cells, so sync is set up without the keyboard path. */
export async function stampLines(page, times) {
  for (const [index, time] of times.entries()) {
    const cell = page.locator('.line__time').nth(index)
    await cell.fill(time)
    await cell.press('Enter')
  }
}

/** Decode a finished export in the browser and report what is actually inside it. */
export async function probeVideo(page, buffer) {
  return page.evaluate(async (base64) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    const video = document.createElement('video')
    video.src = URL.createObjectURL(new Blob([bytes], { type: 'video/mp4' }))
    await new Promise((resolve, reject) => {
      video.addEventListener('loadedmetadata', resolve, { once: true })
      video.addEventListener('error', () => reject(new Error('video failed to decode')), {
        once: true,
      })
      setTimeout(() => reject(new Error('timed out decoding video')), 20_000)
    })

    /* Sample a few frames; identical signatures mean the canvas froze. */
    const canvas = document.createElement('canvas')
    canvas.width = 270
    canvas.height = 480
    const ctx = canvas.getContext('2d')
    const frames = []
    for (const at of [0.5, video.duration * 0.5, Math.max(0, video.duration - 0.5)]) {
      await new Promise((resolve) => {
        video.addEventListener('seeked', resolve, { once: true })
        video.currentTime = at
      })
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      let sum = 0
      for (let i = 0; i < data.length; i += 4) sum += data[i]
      frames.push(Math.round(sum / 1000))
    }

    const audio = await new AudioContext().decodeAudioData(bytes.slice().buffer)
    return {
      width: video.videoWidth,
      height: video.videoHeight,
      videoDuration: video.duration,
      audioDuration: audio.duration,
      audioChannels: audio.numberOfChannels,
      distinctFrames: new Set(frames).size,
    }
  }, buffer.toString('base64'))
}
