import { test, expect, tab, readout, num } from './fixtures'
import type { Page } from '@playwright/test'

const open = async (app: Page, view: 'Penrose diagrams' | 'Cosmology') => {
  await tab(app, 'Causal Structure & Cosmology')
  await app.getByRole('group', { name: 'View' }).getByRole('button', { name: view }).click()
}
const setRange = (app: Page, label: RegExp, v: number) =>
  app.getByLabel(label).evaluate((el, x) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, String(x))
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, v)

test('Planck 2018 age of the universe is 13.79 Gyr', async ({ app }) => {
  await open(app, 'Cosmology')
  expect(await num(readout(app, 'age of universe now'))).toBeCloseTo(13.79, 1)
  await expect(app.getByText('Receding faster than light').first()).toBeVisible() // default object z = 14.32 (today and at emission)
})

test('Einstein-de Sitter is 2/(3 H0) = 9.63 Gyr old', async ({ app }) => {
  await open(app, 'Cosmology')
  await app.getByLabel('Cosmological parameters').selectOption({ label: 'Einstein-de Sitter (toy, no dark energy)' })
  expect(await num(readout(app, 'age of universe now'))).toBeCloseTo(9.63, 1)
})

test('recollapsing model shows a message instead of NaN', async ({ app }) => {
  await open(app, 'Cosmology')
  await setRange(app, /^Ω_m/, 1.5)
  await setRange(app, /^Ω_Λ/, -0.5)
  await expect(app.getByRole('alert')).toContainText('recollapses')
  await expect(app.locator('.panel')).not.toContainText('NaN')
})

test('infall from r0 = 10 M: τ to singularity = π sqrt(r0³/8M) = 35.124 M', async ({ app }) => {
  await open(app, 'Penrose diagrams')
  await setRange(app, /^Start radius/, 10)
  await expect(readout(app, 'τ to singularity')).toContainText('35.124 M')
  await app.getByLabel('Real black hole (for units)').selectOption({ label: 'Sagittarius A*' })
  await expect(readout(app, 'τ to singularity')).toContainText('min')
})

test('probe event inside the black hole reports region II and r as time', async ({ app }) => {
  await open(app, 'Penrose diagrams')
  await setRange(app, /^Event X/, 0)
  await setRange(app, /^Event T/, 1)
  await expect(readout(app, 'region')).toHaveText('II')
  await expect(app.locator('.panel')).toContainText('r is a time coordinate here')
})

test('switching spacetime and views raises no console errors', async ({ app }) => {
  await open(app, 'Penrose diagrams')
  await app.getByLabel('Spacetime').selectOption('minkowski')
  await expect(app.locator('.panel')).toContainText('flat space')
  await open(app, 'Cosmology')
  await app.getByRole('group', { name: 'Time axis' }).getByRole('button', { name: 'Cosmic time' }).click()
  await tab(app, 'Metric & Tangent Spaces')
  await open(app, 'Penrose diagrams')
})
