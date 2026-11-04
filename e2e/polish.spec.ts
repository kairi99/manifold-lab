import { test, expect, tab, readout, surface, num } from './fixtures'

test('curves module: helix curvature readout is a/(a²+b²) for the default a, b', async ({ app }) => {
  await app.goto('/#curves')
  await expect(app.locator('.canvas canvas')).toBeVisible()
  await expect(app.locator('.nav button.active')).toHaveText('Curves & Charts')
  const a = 1, b = 0.4
  expect(await num(readout(app, 'κ'))).toBeCloseTo(a / (a * a + b * b), 3)
  await expect(readout(app, 'κ')).toHaveText((a / (a * a + b * b)).toFixed(4))
})

test('chart inset is visible on a surface module and toggles', async ({ app }) => {
  const inset = app.locator('.chart-inset')
  await expect(inset).toBeVisible()
  await expect(inset.locator('svg')).toBeVisible()
  await inset.getByRole('button', { name: 'Hide' }).click()
  await expect(inset.locator('svg')).toHaveCount(0)
  await inset.getByRole('button', { name: 'Show' }).click()
  await expect(inset.locator('svg')).toBeVisible()
})

test('glossary dialog opens from the top bar; a term popover opens from the theory dialog', async ({ app }) => {
  await app.locator('.topbar').getByRole('button', { name: 'Glossary' }).click()
  const d = app.getByRole('dialog')
  await expect(d.getByRole('heading', { name: 'Glossary' })).toBeVisible()
  await d.getByRole('searchbox').fill('geodesic')
  await expect(d.locator('dt').first()).toBeVisible()
  await app.keyboard.press('Escape')
  await expect(d).toBeHidden()

  await app.getByRole('button', { name: 'Motivation & theory' }).click()
  const th = app.getByRole('dialog')
  await th.locator('button.gl-term').first().click()
  await expect(th.locator('.gl-pop').first()).toBeVisible()
})

test('a suggested task ticks itself when the state satisfies it', async ({ app }) => {
  await app.goto('/#transport')
  await expect(app.locator('.canvas canvas')).toBeVisible()
  const task = app.locator('.tasks li').filter({ hasText: 'find the latitude loop' }).first()
  await expect(task.locator('input[type=checkbox]')).not.toBeChecked()
  await app.locator('[data-tour="transport-controls"] input[type=range]').fill('1') // default θ0 is already 60°
  await expect(task.locator('input[type=checkbox]')).toBeChecked()
  await expect(task).toContainText('detected')
})

test('Möbius band: transport loop and geodesics work across the glued seam', async ({ app }) => {
  await surface(app, 'Custom…')
  await app.getByLabel('Preset surface').selectOption({ label: 'Möbius band' })
  await expect(app.getByLabel('twisted u seam', { exact: false })).toBeChecked()
  await tab(app, 'Parallel Transport')
  await app.locator('[data-tour="transport-controls"] input[type=range]').fill('1')
  // the core loop closes through the seam: a finite, well-defined holonomy is reported
  const m = readout(app, 'measured')
  await expect(m).toContainText('°')
  expect(Number.isFinite(parseFloat((await m.textContent())!))).toBe(true)
  await tab(app, 'Geodesics')
  await expect(app.locator('.canvas canvas')).toBeVisible()
})
