import { test, expect } from './fixtures'

test.use({ start: '/#limits' })

const view = (p: import('@playwright/test').Page, name: string) => p.locator('[data-tour="views"]').getByRole('button', { name, exact: true }).click()

test('limits: status cards filter, expand, and open their view', async ({ app }) => {
  await app.getByRole('button', { name: 'Resolved anomaly', exact: true }).click()
  const pioneer = app.getByRole('button', { name: /Pioneer/ })
  await pioneer.click()
  await expect(pioneer).toHaveAttribute('aria-expanded', 'true')
  await expect(app.getByRole('button', { name: /Equivalence principle/ })).toHaveCount(0)
  await expect(app.locator('.katex-error')).toHaveCount(0)
})

test('limits: every view renders its plot and readouts', async ({ app }) => {
  for (const name of ['Rotation curves', 'Cosmic tensions', 'Precision tests', 'Quantum limits']) {
    await view(app, name)
    await expect(app.locator('.panel svg').first()).toBeVisible()
    if (name !== 'Precision tests') await expect(app.locator('.readout').filter({ hasText: /\d/ }).first()).toBeVisible()
  }
  await expect(app.locator('.katex-error')).toHaveCount(0)
})
