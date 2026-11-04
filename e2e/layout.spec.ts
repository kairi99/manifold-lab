import { test, expect } from './fixtures'

test('phone: nav, canvas, panel stacked; panel scrolls, document does not', async ({ app }) => {
  const box = async (s: string) => (await app.locator(s).boundingBox())!
  const nav = await box('.nav'), canvas = await box('.canvas'), panel = await box('.panel')
  expect(nav.y + nav.height).toBeLessThanOrEqual(canvas.y + 1)
  expect(canvas.y + canvas.height).toBeLessThanOrEqual(panel.y + 1)
  expect(panel.y).toBeGreaterThanOrEqual(canvas.y + canvas.height - 1)
  expect(panel.y + panel.height).toBeLessThanOrEqual(844 + 1)
  expect(canvas.width).toBeLessThanOrEqual(390)

  const doc = await app.evaluate(() => ({
    sh: document.documentElement.scrollHeight, ch: document.documentElement.clientHeight,
    sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
  }))
  expect(doc.sh).toBeLessThanOrEqual(doc.ch)
  expect(doc.sw).toBeLessThanOrEqual(doc.cw)

  const p = app.locator('.panel')
  expect(await p.evaluate((e) => e.scrollHeight - e.clientHeight)).toBeGreaterThan(100)
  await p.evaluate((e) => e.scrollTo(0, 300))
  expect(await p.evaluate((e) => e.scrollTop)).toBeGreaterThan(100)
  expect(await app.evaluate(() => window.scrollY)).toBe(0)
})
