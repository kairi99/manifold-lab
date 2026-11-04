import { test, expect } from './fixtures'

test('top bar: theme toggles and persists, language switches the whole UI', async ({ app }) => {
  const html = app.locator('html')
  const start = await html.getAttribute('data-theme')
  await app.locator('.topbar .tb-icon').click()
  await expect(html).not.toHaveAttribute('data-theme', start!)
  const flipped = await html.getAttribute('data-theme')
  await app.reload()
  await expect(html).toHaveAttribute('data-theme', flipped!)

  await app.locator('.topbar').getByRole('button', { name: 'ES', exact: true }).click()
  await expect(html).toHaveAttribute('lang', 'es')
  await expect(app.locator('.nav button.active')).toHaveText('Métrica y espacios tangentes')
  await expect(app.getByRole('button', { name: 'Motivación y teoría' })).toBeVisible()
  await app.locator('.topbar').getByRole('button', { name: 'EN', exact: true }).click()
  await expect(app.locator('.nav button.active')).toHaveText('Metric & Tangent Spaces')
})

test('top bar: technical and legal pages open and close', async ({ app }) => {
  await app.locator('.topbar').getByRole('button', { name: 'Technical' }).click()
  const d = app.getByRole('dialog')
  await expect(d).toContainText('Runge–Kutta')
  await expect(d.locator('.katex-error')).toHaveCount(0)
  await app.keyboard.press('Escape')
  await expect(d).toBeHidden()
  await app.locator('.topbar').getByRole('button', { name: 'Legal' }).click()
  await expect(d).toContainText('MIT License')
  await expect(d).toContainText('CC BY 4.0')
  await app.getByRole('button', { name: 'Close' }).click()
  await expect(d).toBeHidden()
})
