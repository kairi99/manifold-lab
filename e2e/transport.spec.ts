import { test, expect, tab, readout } from './fixtures'
import type { Page } from '@playwright/test'

const holonomyDeg = async (p: Page) => parseFloat((await readout(p, 'measured').textContent())!)

test('sphere latitude loop: holonomy 180° at 60°, ~0 at the equator', async ({ app }) => {
  await tab(app, 'Parallel Transport')
  await expect(app.getByText('θ0 (latitude): 60°')).toBeVisible()
  await app.locator('[data-tour="transport-controls"] input[type=range]').fill('1')
  await expect(app.getByText('Progress 100%', { exact: true })).toBeVisible()
  await expect(readout(app, 'measured')).toContainText('180.00°')
  await expect(readout(app, 'predicted')).toContainText('180.00°')

  // slider step 0.01 from min 0.2 cannot hit π/2 exactly; nearest grid value is 1.57 (≈ -0.29°)
  // fill() rejects values off the step grid, so set it the way React listens
  await app.locator('label.field:has-text("latitude") input[type=range]').evaluate((e: HTMLInputElement, v) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(e, v)
    e.dispatchEvent(new Event('input', { bubbles: true }))
  }, Math.PI / 2)
  await expect(app.getByText('θ0 (latitude): 90°')).toBeVisible()
  expect(Math.abs(await holonomyDeg(app))).toBeLessThan(0.5)
})
