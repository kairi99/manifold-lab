import { test, expect } from './fixtures'

test('share link restores the configuration in a fresh page', async ({ app, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await app.goto('/#transport')
  const lat = app.locator('label.field', { hasText: 'latitude' })
  await lat.locator('input').fill('0.79') // θ0 ≈ 45°
  await expect(lat).toContainText('45°')
  await app.locator('.topbar').getByRole('button', { name: /Copy link/ }).click()
  const url = await app.evaluate(() => navigator.clipboard.readText())
  expect(url).toMatch(/#transport\?s=/)

  const fresh = await context.newPage()
  await fresh.addInitScript(() => { for (const m of ['transport']) localStorage.setItem(`manifoldlab.tourSeen.${m}`, '1') })
  await fresh.goto(url)
  await expect(fresh.locator('.nav button.active')).toHaveText('Parallel Transport')
  await expect(fresh.locator('label.field', { hasText: 'latitude' })).toContainText('45°')
})

test('a hostile share payload is ignored, not executed', async ({ app }) => {
  await app.goto('/#metric?s=' + encodeURIComponent('<script>alert(1)</script>'))
  await expect(app.locator('.nav button.active')).toHaveText('Metric & Tangent Spaces')
})
