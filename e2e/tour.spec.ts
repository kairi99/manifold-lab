import { test, expect, tab } from './fixtures'

test.use({ tourSeen: false })

test('tour: per-module guide on first visit, step through, Escape closes, ? reopens', async ({ app }) => {
  const dialog = app.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('h2')).toHaveText('Metric & tangent spaces')
  const total = Number((await dialog.locator('.tour-count').textContent())!.split('/')[1])
  expect(total).toBeGreaterThan(2)
  for (let i = 1; i < total; i++) {
    await expect(dialog.locator('.tour-count')).toHaveText(`${i} / ${total}`)
    await expect(dialog).toBeInViewport({ ratio: 1 }) // a card below the fold left the tour stuck
    await dialog.getByRole('button', { name: 'Next' }).click()
  }
  await expect(dialog.locator('.tour-count')).toHaveText(`${total} / ${total}`)
  await dialog.getByRole('button', { name: 'Done' }).click()
  await expect(dialog).toBeHidden()

  await app.keyboard.press('?')
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.tour-count')).toHaveText(`1 / ${total}`)
  await app.keyboard.press('Escape')
  await expect(dialog).toBeHidden()

  await app.reload() // seen flag persisted: no auto-open
  await expect(app.locator('.canvas canvas')).toBeVisible()
  await expect(dialog).toBeHidden()
  await app.keyboard.press('?')
  await expect(dialog).toBeVisible()
  await app.keyboard.press('Escape')

  // another module has its own guide, opened on its first visit
  await tab(app, 'Parallel Transport')
  await expect(dialog.locator('h2')).toHaveText('Parallel transport')
  await expect(dialog.locator('.tour-count')).toHaveText(/^1 \//)
})

// every guide's cards stay fully on screen (desktop and phone projects)
for (const m of ['metric', 'transport', 'geodesics', 'curvature', 'fields', 'relativity', 'spacetime', 'cosmos']) {
  test(`tour: ${m} guide can be stepped to the end`, async ({ app }) => {
    if (m !== 'metric') { await app.goto(`/#${m}`); await app.reload() }
    const dialog = app.getByRole('dialog')
    await expect(dialog).toBeVisible()
    const total = Number((await dialog.locator('.tour-count').textContent())!.split('/')[1])
    for (let i = 1; i <= total; i++) {
      await expect(dialog.locator('.tour-count')).toHaveText(`${i} / ${total}`)
      await expect(dialog).toBeInViewport({ ratio: 1 })
      await dialog.locator('button.primary').click()
    }
    await expect(dialog).toBeHidden()
  })
}

test('tour: Escape closes it on first visit', async ({ app }) => {
  await expect(app.getByRole('dialog')).toBeVisible()
  await app.keyboard.press('Escape')
  await expect(app.getByRole('dialog')).toBeHidden()
})
