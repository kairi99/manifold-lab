import { test, expect, readout, num } from './fixtures'

test.use({ start: '/#frontiers' })

const view = (p: import('@playwright/test').Page, name: string) => p.locator('[data-tour="views"]').getByRole('button', { name, exact: true }).click()

test('frontiers: problem cards filter, expand, and open their demo', async ({ app }) => {
  const toggle = app.getByRole('button', { name: /Willmore conjecture/ })
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(app.locator('.katex-error')).toHaveCount(0)
  await app.getByRole('button', { name: 'Open demo' }).first().click()
  await expect(app.getByRole('button', { name: 'Willmore energy' })).toBeVisible()
  await view(app, 'Problems')
  await app.getByRole('button', { name: 'Open', exact: true }).click()
  await expect(app.getByRole('button', { name: /^\W*Poincaré conjecture/ })).toHaveCount(0)
  await expect(app.getByRole('button', { name: /Smooth 4-dimensional Poincaré/ })).toHaveCount(1)
})

test('frontiers: every demo renders with its closed-form check', async ({ app }) => {
  await view(app, 'Curve shortening')
  expect(await num(readout(app, 'A₀/2π'))).toBeGreaterThan(0)
  await view(app, 'Willmore')
  await app.getByRole('button', { name: 'Set c = √2' }).click()
  expect(Math.abs(await num(readout(app, 'W / 2π²')) - 1)).toBeLessThan(1e-3)
  await view(app, 'Penrose inequality')
  expect(await num(readout(app, 'ratio to m'))).toBeLessThanOrEqual(1)
  await view(app, 'Ricci flow')
  await expect(app.getByText('3D sphere (n = 2)')).toBeVisible()
  await view(app, 'Yang–Mills holonomy')
  await expect(app.getByText('Non-abelian holonomy')).toBeVisible()
  await expect(app.locator('.katex-error')).toHaveCount(0)
})
