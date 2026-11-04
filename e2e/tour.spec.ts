import { test, expect } from './fixtures'

test.use({ tourSeen: false })

test('tour: first visit, step through, Escape closes, ? reopens', async ({ app }) => {
  const dialog = app.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const total = Number((await dialog.locator('.tour-count').textContent())!.split('/')[1])
  expect(total).toBeGreaterThan(5)
  for (let i = 1; i < total; i++) {
    await expect(dialog.locator('.tour-count')).toHaveText(`${i} / ${total}`)
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
})

test('tour: Escape closes it on first visit', async ({ app }) => {
  await expect(app.getByRole('dialog')).toBeVisible()
  await app.keyboard.press('Escape')
  await expect(app.getByRole('dialog')).toBeHidden()
})
