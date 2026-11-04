import { test, expect, tab, readout, surface, num } from './fixtures'

test('catenoid preset: K readout equals -1/cosh^4(u) at p', async ({ app }) => {
  await surface(app, 'Custom…')
  await app.getByLabel('Preset surface').selectOption({ label: 'Catenoid' })
  await tab(app, 'Metric & Tangent Spaces')
  const coords = await app.locator('p', { hasText: 'Coordinates' }).first().textContent()
  const u = parseFloat(/=\s*\(([-−\d.]+),/.exec(coords!)![1].replace('−', '-'))
  await tab(app, 'Curvature')
  const expected = -1 / Math.cosh(u) ** 4
  expect(Math.abs((await num(readout(app, 'K intrinsic (from g)'))) - expected)).toBeLessThan(2e-4)
  expect(Math.abs((await num(readout(app, 'K extrinsic (κ₁κ₂)'))) - expected)).toBeLessThan(2e-4)
})

test('invalid expression shows an inline error with position and blocks Apply', async ({ app }) => {
  await surface(app, 'Custom…')
  await app.getByLabel('z(u, v)').fill('sni(u)')
  await expect(app.getByRole('alert').filter({ hasText: "unknown function 'sni' at 0" })).toBeVisible()
  await expect(app.getByRole('button', { name: 'Apply' })).toBeDisabled()
  await app.getByLabel('z(u, v)').fill('2u')
  await expect(app.getByRole('alert').filter({ hasText: 'implicit multiplication' })).toBeVisible()
  await app.getByLabel('z(u, v)').fill('u/2')
  await expect(app.getByRole('button', { name: 'Apply' })).toBeEnabled()
})

test('sphere preset warns about the degenerate poles', async ({ app }) => {
  await surface(app, 'Custom…')
  await app.getByLabel('Preset surface').selectOption({ label: 'Ellipsoid' })
  await expect(app.getByRole('status').filter({ hasText: 'degenerate at u = 0, π' })).toBeVisible()
})

test('custom surface survives a reload (localStorage)', async ({ app }) => {
  await surface(app, 'Custom…')
  await app.getByLabel('z(u, v)').fill('u/2')
  await app.getByRole('button', { name: 'Apply' }).click()
  await app.reload()
  await expect(app.locator('.canvas canvas')).toBeVisible()
  await surface(app, 'Custom…')
  await expect(app.getByLabel('z(u, v)')).toHaveValue('u/2')
})

test('every surface module renders on the Möbius band without errors', async ({ app }) => {
  await surface(app, 'Custom…')
  await app.getByLabel('Preset surface').selectOption({ label: 'Möbius band' })
  for (const m of ['Metric & Tangent Spaces', 'Parallel Transport', 'Geodesics', 'Curvature', 'Vector Fields & TM']) {
    await tab(app, m)
    await expect(app.locator('.panel h2').first()).toBeVisible()
  }
})
