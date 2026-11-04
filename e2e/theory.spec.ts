import { test, expect } from './fixtures'

for (const m of ['metric', 'transport', 'geodesics', 'curvature', 'fields', 'relativity', 'spacetime', 'cosmos', 'frontiers']) {
  test(`theory: ${m} dialog opens, renders its math, closes`, async ({ app }) => {
    if (m !== 'metric') await app.goto(`/#${m}`)
    await app.getByRole('button', { name: 'Motivation & theory' }).click()
    const d = app.getByRole('dialog')
    await expect(d).toBeVisible()
    await expect(d.locator('h3').first()).toBeVisible()
    expect(await d.locator('.katex').count()).toBeGreaterThan(3)
    await expect(d.locator('.katex-error')).toHaveCount(0)
    await app.keyboard.press('Escape')
    await expect(d).toBeHidden()
  })
}
