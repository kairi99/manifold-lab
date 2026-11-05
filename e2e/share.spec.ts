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

test('share link restores a Frontiers demo (view and sliders live in the module store)', async ({ app, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await app.goto('/#frontiers')
  await app.locator('[data-tour="views"]').getByRole('button', { name: 'Penrose inequality', exact: true }).click()
  await app.getByLabel('spin a over m').fill('0.25')
  await expect(app.getByText('a/m = 0.250')).toBeVisible()
  await app.locator('.topbar').getByRole('button', { name: /Copy link/ }).click()
  const url = await app.evaluate(() => navigator.clipboard.readText())
  expect(url).toMatch(/#frontiers\?s=/)

  const fresh = await context.newPage()
  await fresh.addInitScript(() => localStorage.setItem('manifoldlab.tourSeen.frontiers', '1'))
  await fresh.goto(url)
  await expect(fresh.getByText('a/m = 0.250')).toBeVisible()
})
