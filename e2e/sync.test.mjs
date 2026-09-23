import assert from 'node:assert/strict'
import test, { after, before, describe } from 'node:test'
import { launch, makeFixtures, openApp, stampLines, startPreview } from './helpers.mjs'

/**
 * The seam between the keyboard and the reducer.
 *
 * The reducer is covered by tests/project.test.js and the browser was checked
 * by hand, but nothing proved the two meet — that a real Space keypress
 * reaches `stamp-cursor` with the clock's value. That seam carries the
 * product's main promise, so it gets a real browser and real keys.
 */
let browser
let preview
let fixtures

before(async () => {
  browser = await launch()
  if (!browser) return
  preview = await startPreview()
  fixtures = await makeFixtures(4)
})

after(async () => {
  await browser?.close()
  preview?.stop()
})

/** Move focus off any field so the shortcuts are live. */
async function blur(page) {
  await page.evaluate(() => document.activeElement?.blur())
}

const stamps = (page) => page.locator('.line__time').evaluateAll((els) => els.map((e) => e.value))
const texts = (page) =>
  page.locator('.line__text').evaluateAll((els) => els.map((e) => e.textContent))

describe('keyboard sync pass', () => {
  test('Space stamps the cursor line and advances through the song', async (t) => {
    if (!browser) return t.skip('Chrome is not installed')
    const { context, page } = await openApp(browser, preview.url, fixtures)
    await blur(page)

    await page.keyboard.press('KeyK')
    await page.waitForTimeout(600)
    for (let i = 0; i < 4; i += 1) {
      await page.keyboard.press('Space')
      await page.waitForTimeout(500)
    }
    await page.keyboard.press('KeyK')

    const values = await stamps(page)
    assert.equal(values.filter(Boolean).length, 4, 'every line should be stamped')
    assert.ok(
      values.every((value, i) => i === 0 || value > values[i - 1]),
      `stamps should ascend with the song, got ${values.join(', ')}`,
    )
    assert.match(await page.locator('.section__meta').first().textContent(), /4\/4 stamped/)
    await context.close()
  })

  test('a stamp lands at the playhead, not at an arbitrary value', async (t) => {
    if (!browser) return t.skip('Chrome is not installed')
    const { context, page } = await openApp(browser, preview.url, fixtures)
    await blur(page)

    await page.evaluate(() => {
      document.querySelector('audio').currentTime = 2.5
    })
    await page.waitForTimeout(200)
    await page.keyboard.press('Space')
    await page.waitForTimeout(200)

    const [first] = await stamps(page)
    const [minutes, rest] = first.split(':')
    const seconds = Number(minutes) * 60 + Number(rest)
    assert.ok(
      Math.abs(seconds - 2.5) < 0.2,
      `stamp should sit at the playhead (2.5s), got ${first}`,
    )
    await context.close()
  })

  test('clicking a line moves the playhead to its start, for fine-tuning by ear', async (t) => {
    if (!browser) return t.skip('Chrome is not installed')
    const { context, page } = await openApp(browser, preview.url, fixtures)

    await stampLines(page, ['0:00.50', '0:02.50'])
    await blur(page)

    await page.locator('.line__text').nth(1).click()
    await page.waitForTimeout(250)

    const at = await page.evaluate(() => document.querySelector('audio').currentTime)
    assert.ok(Math.abs(at - 2.5) < 0.2, `playhead should sit at the line's start, got ${at}`)
    await context.close()
  })

  test('typing a timestamp never stamps anything', async (t) => {
    if (!browser) return t.skip('Chrome is not installed')
    const { context, page } = await openApp(browser, preview.url, fixtures)

    const field = page.locator('.line__end').nth(0)
    await field.click()
    await page.keyboard.type('0:03.00')
    await page.waitForTimeout(200)

    assert.deepEqual(
      (await stamps(page)).filter(Boolean),
      [],
      'no start should have been recorded while typing in a field',
    )
    await context.close()
  })

  test('Backspace clears one stamp and leaves every lyric intact', async (t) => {
    if (!browser) return t.skip('Chrome is not installed')
    const { context, page } = await openApp(browser, preview.url, fixtures)
    await blur(page)

    for (let i = 0; i < 3; i += 1) {
      await page.evaluate((n) => {
        document.querySelector('audio').currentTime = n
      }, i + 1)
      await page.waitForTimeout(150)
      await page.keyboard.press('Space')
      await page.waitForTimeout(150)
    }
    const lyricsBefore = await texts(page)

    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('Backspace')
    await page.waitForTimeout(200)

    const values = await stamps(page)
    assert.equal(values[2], '', 'the cursor line should have lost its stamp')
    assert.equal(values.filter(Boolean).length, 2, 'the other stamps should survive')
    assert.deepEqual(await texts(page), lyricsBefore, 'no lyric should have changed')
    await context.close()
  })

  test('editing an end leaves the start and the line order alone', async (t) => {
    if (!browser) return t.skip('Chrome is not installed')
    const { context, page } = await openApp(browser, preview.url, fixtures)
    await blur(page)

    await page.evaluate(() => {
      document.querySelector('audio').currentTime = 1.5
    })
    await page.waitForTimeout(150)
    await page.keyboard.press('Space')
    await page.waitForTimeout(150)
    const stamped = (await stamps(page))[0]
    const lyricsBefore = await texts(page)

    const end = page.locator('.line__end').nth(0)
    await end.fill('0:04.00')
    await end.press('Enter')
    await page.waitForTimeout(250)

    assert.equal((await stamps(page))[0], stamped, 'the start must not move')
    assert.deepEqual(await texts(page), lyricsBefore, 'the song must not reorder')
    await context.close()
  })
})

/** Brightness of the lyric band in the middle of the canvas — near zero means no text. */
async function lyricInk(page, at) {
  await page.evaluate((time) => {
    document.querySelector('audio').currentTime = time
  }, at)
  await page.waitForTimeout(250)
  return page.evaluate(() => {
    const canvas = document.querySelector('.preview__canvas')
    const { data } = canvas.getContext('2d').getImageData(0, 700, canvas.width, 500)
    let bright = 0
    for (let i = 0; i < data.length; i += 4) if (data[i] > 128) bright += 1
    return bright
  })
}

describe('end times', () => {
  test("a gap after a line's end renders as an empty frame", async (t) => {
    if (!browser) return t.skip('Chrome is not installed')
    const { context, page } = await openApp(browser, preview.url, fixtures)

    await stampLines(page, ['0:00.20', '0:02.50'])
    const end = page.locator('.line__end').nth(0)
    await end.fill('0:00.80')
    await end.press('Enter')
    await blur(page)

    assert.ok((await lyricInk(page, 0.6)) > 0, 'line 1 should be on screen before its end')
    assert.equal(await lyricInk(page, 1.6), 0, 'the gap should show no text at all')
    assert.ok((await lyricInk(page, 3)) > 0, 'line 2 should fade back in at its start')
    await context.close()
  })

  test('an end before the start is refused and explained', async (t) => {
    if (!browser) return t.skip('Chrome is not installed')
    const { context, page } = await openApp(browser, preview.url, fixtures)

    await stampLines(page, ['0:01.00'])
    const end = page.locator('.line__end').nth(0)
    await end.fill('0:00.50')
    await end.press('Enter')

    assert.equal(await end.inputValue(), '', 'the invalid end should not be stored')
    assert.equal(await end.getAttribute('aria-invalid'), 'true')
    assert.match(
      await page.locator('.lines + [role=status]').textContent(),
      /end has to come after the start/,
    )
    await context.close()
  })

  test("Backspace clears a line's end along with its start", async (t) => {
    if (!browser) return t.skip('Chrome is not installed')
    const { context, page } = await openApp(browser, preview.url, fixtures)

    await stampLines(page, ['0:01.00'])
    const end = page.locator('.line__end').nth(0)
    await end.fill('0:02.00')
    await end.press('Enter')
    await blur(page)
    await page.keyboard.press('Backspace')
    await page.waitForTimeout(200)

    assert.equal((await stamps(page))[0], '')
    assert.equal(await end.inputValue(), '')
    await context.close()
  })
})
