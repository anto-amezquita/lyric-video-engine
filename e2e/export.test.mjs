import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test, { after, before, describe } from 'node:test'
import { launch, makeFixtures, openApp, probeVideo, stampLines, startPreview } from './helpers.mjs'

/**
 * The export pipeline has three routes and a given browser only ever takes
 * one, so two of them can break unnoticed — and one already did: passing
 * `classWorkerURL` to `ffmpeg.load()` hung the conversion with no error
 * anywhere (decisions/0001). Each route is forced here and its output decoded.
 */
let browser
let preview
let fixtures

before(async () => {
  browser = await launch()
  if (!browser) return
  preview = await startPreview()
  fixtures = await makeFixtures(3)
})

after(async () => {
  await browser?.close()
  preview?.stop()
})

async function exportOnce(options = {}) {
  const { context, page } = await openApp(browser, preview.url, fixtures, options)
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))

  await stampLines(page, ['0:00.30', '0:01.00', '0:01.80', '0:02.40'])

  const download = page.waitForEvent('download', { timeout: 240_000 })
  await page.getByRole('button', { name: 'Export .mp4' }).click()
  const file = await download
  const target = path.join(fixtures.dir, file.suggestedFilename())
  await file.saveAs(target)
  const buffer = await readFile(target)
  const probe = await probeVideo(page, buffer)
  const status = await page.locator('.status .hint').textContent()

  await context.close()
  return { buffer, probe, status, errors, page }
}

function assertPlayableMp4({ buffer, probe }) {
  assert.equal(buffer.subarray(4, 8).toString(), 'ftyp', 'should be an ISO base media file')
  const boxes = buffer.toString('latin1')
  assert.ok(boxes.includes('avc1'), 'video track should be H.264')
  assert.ok(boxes.includes('mp4a'), 'audio track should be AAC')
  assert.equal(probe.width, 1080)
  assert.equal(probe.height, 1920)
  assert.ok(probe.audioChannels >= 1, 'should carry an audio track')
  assert.ok(
    Math.abs(probe.videoDuration - probe.audioDuration) < 0.5,
    `video (${probe.videoDuration.toFixed(2)}s) and audio (${probe.audioDuration.toFixed(2)}s) should match`,
  )
  assert.ok(
    probe.videoDuration > fixtures.seconds - 1,
    `should cover the whole song, got ${probe.videoDuration.toFixed(2)}s`,
  )
  assert.equal(
    probe.distinctFrames,
    3,
    'sampled frames should differ — identical means the canvas froze',
  )
}

describe('export routes', () => {
  test('direct: a browser that records MP4 downloads it untouched', async (t) => {
    if (!browser) return t.skip('Chrome is not installed')
    const result = await exportOnce()
    assertPlayableMp4(result)
    assert.match(result.status, /Exported as \.mp4/)
    assert.deepEqual(result.errors, [])
  })

  test('remux: H.264 in WebM is repackaged, not re-encoded', async (t) => {
    if (!browser) return t.skip('Chrome is not installed')
    const result = await exportOnce({ maskMimeType: 'webm;codecs="avc1' })
    assertPlayableMp4(result)
    assert.match(result.status, /Exported as \.mp4/)
    assert.deepEqual(result.errors, [])
  })

  test('transcode: VP9 is fully re-encoded to H.264', async (t) => {
    if (!browser) return t.skip('Chrome is not installed')
    const result = await exportOnce({ maskMimeType: 'vp9' })
    assertPlayableMp4(result)
    assert.match(result.status, /Exported as \.mp4/)
    assert.deepEqual(result.errors, [])
  })
})

describe('backgrounded tab', () => {
  /*
   * Playwright cannot genuinely background a tab — `bringToFront` leaves
   * `document.hidden` false in both headless and headed Chrome. So the
   * visibility *signal* is driven directly. That is the contract our handler
   * owns; the throttling behind it belongs to the browser.
   */
  test('pauses the recording and resumes it in sync', async (t) => {
    if (!browser) return t.skip('Chrome is not installed')
    const { context, page } = await openApp(browser, preview.url, fixtures)
    await page.evaluate(() => {
      let hidden = false
      Object.defineProperty(document, 'hidden', { get: () => hidden, configurable: true })
      Object.defineProperty(document, 'visibilityState', {
        get: () => (hidden ? 'hidden' : 'visible'),
        configurable: true,
      })
      window.__setHidden = (value) => {
        hidden = value
        document.dispatchEvent(new Event('visibilitychange'))
      }
    })
    await stampLines(page, ['0:00.30', '0:01.00', '0:01.80', '0:02.40'])

    const download = page.waitForEvent('download', { timeout: 120_000 })
    const startedAt = Date.now()
    await page.getByRole('button', { name: 'Export .mp4' }).click()
    await page.waitForTimeout(800)

    await page.evaluate(() => window.__setHidden(true))
    await page.waitForTimeout(300)
    assert.match(
      await page.locator('.status .hint').textContent(),
      /Paused/,
      'hiding the tab should pause the recording',
    )
    assert.equal(await page.locator('.preview__badge').textContent(), 'PAUSED')
    assert.equal(
      await page.evaluate(() => document.querySelector('audio').paused),
      true,
      'the clock should stop while paused',
    )

    const heldFor = 2500
    await page.waitForTimeout(heldFor)
    await page.evaluate(() => window.__setHidden(false))
    await page.waitForTimeout(300)
    assert.match(await page.locator('.status .hint').textContent(), /Recording in realtime/)
    assert.equal(await page.locator('.preview__badge').textContent(), 'REC')

    const file = await download
    const elapsed = Date.now() - startedAt
    const target = path.join(fixtures.dir, 'paused.mp4')
    await file.saveAs(target)
    const probe = await probeVideo(page, await readFile(target))

    assert.ok(
      elapsed > fixtures.seconds * 1000 + heldFor - 500,
      'the pause should have extended the wall-clock time',
    )
    assert.ok(
      probe.videoDuration < fixtures.seconds + 1,
      `the paused time must not land in the file — got ${probe.videoDuration.toFixed(2)}s for a ${fixtures.seconds}s song`,
    )
    assert.ok(
      Math.abs(probe.videoDuration - probe.audioDuration) < 0.5,
      'audio and video should still line up after resuming',
    )
    assert.equal(probe.distinctFrames, 3, 'frames should still differ across the file')

    await context.close()
  })
})
